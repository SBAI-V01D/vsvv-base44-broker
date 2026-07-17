import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'
import {
  calculateCommissionSchema,
  splitSchema,
  approvePayoutSchema,
} from './commissions.schema.js'

const STORNO_PERIOD_MONTHS = 12
const DEFAULT_COMMISSION_RATE = 70

const commissionsRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'commissionEntry',
      prefix: 'commission-entries',
      searchFields: ['status', 'insurer', 'policy_number', 'advisor_name', 'customer_name'],
      sortableFields: ['created_at', 'updated_at', 'entry_date', 'premium_yearly', 'advisor_courtage_amount', 'advisor_provision_amount', 'status'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin', 'management', 'finance', 'backoffice'],
        get: ['admin', 'management', 'finance', 'backoffice'],
        create: ['admin', 'backoffice'],
        update: ['admin', 'finance'],
        delete: ['admin'],
      },
    }, { skipCrud: true }),
  )

  // Provision berechnen aus Vertrag
  app.post('/api/commissions/calculate', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const data = calculateCommissionSchema.parse(request.body)
    const orgId = (request.user as any)?.organization_id

    const contract = await prisma.contract.findUnique({ where: { id: data.contract_id }, include: { customer: true } })
    if (!contract) return reply.status(404).send({ error: 'Contract not found' })

    // Rate aus Vertrag oder Default
    const rate = data.rate ?? contract.commission_rate ?? DEFAULT_COMMISSION_RATE
    const premiumYearly = data.premium_yearly || contract.premium_yearly || 0
    const commissionAmount = premiumYearly * (rate / 100)
    const stornoAmount = commissionAmount * (10 / 100)
    const payoutAmount = commissionAmount - stornoAmount

    const entry = await prisma.commissionEntry.create({
      data: {
        policy_id: contract.id,
        policy_number: contract.policy_number,
        advisor_id: contract.advisor_id || '',
        advisor_name: contract.assigned_broker || 'Unbekannt',
        organization_id: orgId,
        organization_name: 'VSVV',
        customer_id: contract.customer_id,
        customer_name: contract.customer_name,
        insurer: contract.insurer,
        product_category: contract.sparte,
        premium_yearly: premiumYearly,
        company_courtage_amount: commissionAmount,
        advisor_courtage_percentage: rate,
        advisor_courtage_amount: commissionAmount,
        courtage_storno_percentage: 10,
        courtage_storno_amount: stornoAmount,
        courtage_payout_amount: payoutAmount,
        company_provision_amount: commissionAmount,
        advisor_provision_percentage: rate,
        advisor_provision_amount: commissionAmount,
        provision_storno_percentage: 10,
        provision_storno_amount: stornoAmount,
        provision_payout_amount: payoutAmount,
        commission_percentage: rate,
        commission_amount: commissionAmount,
        received_amount: payoutAmount,
        status: 'pending',
        entry_date: new Date(),
        storno_period_months: STORNO_PERIOD_MONTHS,
        storno_eligible_until: new Date(Date.now() + STORNO_PERIOD_MONTHS * 30 * 24 * 60 * 60 * 1000),
      },
    })

    // Commission-Split wenn Berater zugewiesen
    if (contract.advisor_id) {
      const advisor = await prisma.advisor.findUnique({ where: { id: contract.advisor_id } })
      if (advisor) {
        const advisorShare = payoutAmount * 0.7
        const teamleadShare = payoutAmount * 0.3
        await prisma.commissionSplit.create({
          data: {
            commission_entry_id: entry.id,
            advisor_id: contract.advisor_id,
            advisor_name: `${advisor.firstname} ${advisor.lastname}`,
            organization_id: orgId,
            advisor_share_percent: 70,
            advisor_share_amount: advisorShare,
            teamlead_share_percent: 30,
            teamlead_share_amount: teamleadShare,
            total_amount: payoutAmount,
            status: 'pending',
          },
        })
      }
    }

    return entry
  })

  // Split konfigurieren
  app.post('/api/commissions/:id/split', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = splitSchema.parse(request.body)

    const entry = await prisma.commissionEntry.findUnique({ where: { id } })
    if (!entry) return reply.status(404).send({ error: 'Commission entry not found' })

    const totalAmount = entry.courtage_payout_amount || entry.commission_amount || 0
    const advisorShare = totalAmount * (data.advisor_share_percent / 100)
    const teamleadShare = totalAmount * (data.teamlead_share_percent / 100)

    return prisma.commissionSplit.create({
      data: {
        commission_entry_id: id,
        advisor_id: data.advisor_id,
        organization_id: entry.organization_id,
        advisor_share_percent: data.advisor_share_percent,
        advisor_share_amount: advisorShare,
        teamlead_id: data.teamlead_id,
        teamlead_share_percent: data.teamlead_share_percent,
        teamlead_share_amount: teamleadShare,
        total_amount: totalAmount,
        status: 'pending',
      },
    })
  })

  // Status aktualisieren (invoiced → earned → paid)
  app.patch('/api/commissions/:id/status', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }
    const validTransitions: Record<string, string[]> = {
      pending: ['invoiced'],
      invoiced: ['earned'],
      earned: ['paid'],
      paid: [],
      cancelled: [],
    }

    const entry = await prisma.commissionEntry.findUnique({ where: { id } })
    if (!entry) return reply.status(404).send({ error: 'Commission entry not found' })

    const allowed = validTransitions[entry.status as string] || []
    if (!allowed.includes(status)) {
      return reply.status(400).send({ error: `Status "${entry.status}" → "${status}" nicht erlaubt` })
    }

    const updateData: Record<string, any> = { status }
    if (status === 'invoiced') updateData.courtage_invoiced_date = new Date()
    if (status === 'earned') updateData.courtage_earned_date = new Date()
    if (status === 'paid') updateData.courtage_paid_date = new Date()

    return prisma.commissionEntry.update({ where: { id }, data: updateData })
  })

  // Storno-Rückforderung
  app.post('/api/commissions/:id/storno', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { grund } = request.body as { grund?: string }

    const entry = await prisma.commissionEntry.findUnique({ where: { id } })
    if (!entry) return reply.status(404).send({ error: 'Commission entry not found' })

    return prisma.commissionEntry.update({
      where: { id },
      data: {
        is_storno: true,
        storno_datum: new Date(),
        storno_grund: grund || 'Storno',
        storno_war_ausbezahlt: entry.status === 'paid',
        storno_rueckforderungsbetrag: entry.courtage_payout_amount || entry.commission_amount || 0,
        status: 'cancelled',
      },
    })
  })

  // Dashboard: Provisionsübersicht
  app.get('/api/commissions/dashboard', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [totalCommissions, byStatus, byAdvisor, monthlyTotals] = await Promise.all([
      prisma.commissionEntry.aggregate({
        where: { organization_id: orgId, is_storno: false },
        _sum: { commission_amount: true, advisor_courtage_amount: true },
      }),
      prisma.commissionEntry.groupBy({
        by: ['status'],
        where: { organization_id: orgId, is_storno: false },
        _count: true,
        _sum: { advisor_courtage_amount: true },
      }),
      prisma.commissionEntry.groupBy({
        by: ['advisor_name'],
        where: { organization_id: orgId, is_storno: false },
        _sum: { advisor_courtage_amount: true },
        orderBy: { _sum: { advisor_courtage_amount: 'desc' } },
        take: 10,
      }),
      prisma.commissionEntry.aggregate({
        where: { organization_id: orgId, is_storno: false },
        _sum: { commission_amount: true },
      }),
    ])
    return { totalCommissions, byStatus, byAdvisor, monthlyTotals }
  })
}

export default commissionsRoutes
