import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'
import {
  renewalStageSchema,
  cancellationSchema,
  upsellStageSchema,
  linkApplicationSchema,
} from './contracts.schema.js'

const contractsRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'contract',
      prefix: 'contracts',
      searchFields: ['status', 'insurer', 'policy_number', 'product', 'customer_name', 'sparte'],
      sortableFields: ['created_at', 'updated_at', 'status', 'start_date', 'end_date', 'renewal_date', 'premium_yearly', 'premium_monthly', 'insurer'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance'],
        get: ['admin', 'management', 'broker', 'backoffice'],
        create: ['admin', 'management', 'backoffice'],
        update: ['admin', 'management', 'broker', 'backoffice'],
        delete: ['admin'],
      },
      include: {
        customer: { select: { id: true, first_name: true, last_name: true, email: true } },
        commissions: { take: 3, orderBy: { created_at: 'desc' } },
      },
    }),
  )

  // Renewal Stage vorrücken
  app.post('/api/contracts/:id/renewal-stage', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { stage, notes } = renewalStageSchema.parse(request.body)

    const contract = await prisma.contract.findUnique({ where: { id } })
    if (!contract) return reply.status(404).send({ error: 'Contract not found' })

    return prisma.contract.update({
      where: { id },
      data: {
        renewal_stage: stage,
        renewal_stage_updated: new Date(),
        renewal_last_activity: new Date(),
        notes: notes ? `${contract.notes || ''}\n[Renewal: ${contract.renewal_stage}→${stage}] ${notes}`.trim() : undefined,
      },
    })
  })

  // Kündigung einreichen
  app.post('/api/contracts/:id/cancel', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = cancellationSchema.parse(request.body)

    const contract = await prisma.contract.findUnique({ where: { id } })
    if (!contract) return reply.status(404).send({ error: 'Contract not found' })

    return prisma.contract.update({
      where: { id },
      data: {
        status: contract.end_date && new Date(data.cancellation_effective_date || contract.end_date) <= new Date(contract.end_date) ? 'cancelled' as any : ('cancelled' as any),
        cancellation_status: 'submitted',
        cancellation_type: data.cancellation_type,
        cancellation_structured_reason: data.cancellation_structured_reason,
        cancellation_effective_date: data.cancellation_effective_date ? new Date(data.cancellation_effective_date) : null,
        cancellation_notes: data.cancellation_notes,
        cancellation_submitted_at: new Date(),
        retention_attempted: data.retention_attempted,
        retention_result: data.retention_result,
        retention_notes: data.retention_notes,
        cancel_date: new Date(),
      },
    })
  })

  // Upsell Stage
  app.post('/api/contracts/:id/upsell-stage', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { stage, reason, potential_value } = upsellStageSchema.parse(request.body)

    const contract = await prisma.contract.findUnique({ where: { id } })
    if (!contract) return reply.status(404).send({ error: 'Contract not found' })

    return prisma.contract.update({
      where: { id },
      data: {
        upsell_stage: stage,
        upsell_stage_updated: new Date(),
        upsell_identified_reason: reason,
        upsell_potential_value: potential_value ?? contract.upsell_potential_value,
        upsell_last_activity: new Date(),
      },
    })
  })

  // Application mit Contract verknüpfen
  app.post('/api/contracts/:id/link-application', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { application_id } = linkApplicationSchema.parse(request.body)

    const [contract, application] = await Promise.all([
      prisma.contract.findUnique({ where: { id } }),
      prisma.application.findUnique({ where: { id: application_id } }),
    ])
    if (!contract) return reply.status(404).send({ error: 'Contract not found' })
    if (!application) return reply.status(404).send({ error: 'Application not found' })

    await prisma.application.update({
      where: { id: application_id },
      data: { linked_contract_id: id, status: 'approved', policy_number: contract.policy_number },
    })

    return prisma.contract.update({
      where: { id },
      data: { source_application_id: application_id },
    })
  })

  // Renewal-Dashboard Daten
  app.get('/api/contracts/renewal-dashboard', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const now = new Date()
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const [upcoming, overdue, total] = await Promise.all([
      prisma.contract.findMany({
        where: {
          organization_id: orgId,
          archived: false,
          status: 'active',
          end_date: { gte: now, lte: in90Days },
        },
        include: { customer: { select: { id: true, first_name: true, last_name: true } } },
        orderBy: { end_date: 'asc' },
      }),
      prisma.contract.findMany({
        where: {
          organization_id: orgId,
          archived: false,
          status: 'active',
          end_date: { lt: now },
          cancellation_status: 'none',
        },
        include: { customer: { select: { id: true, first_name: true, last_name: true } } },
        orderBy: { end_date: 'asc' },
      }),
      prisma.contract.count({ where: { organization_id: orgId, archived: false, status: 'active' } }),
    ])

    return { upcoming, overdue, total, upcomingCount: upcoming.length, overdueCount: overdue.length }
  })

  // Statistiken
  app.get('/api/contracts/stats', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [total, byStatus, byInsurer, monthlyPremiums] = await Promise.all([
      prisma.contract.count({ where: { organization_id: orgId, archived: false } }),
      prisma.contract.groupBy({ by: ['status'], where: { organization_id: orgId, archived: false }, _count: true }),
      prisma.contract.groupBy({ by: ['insurer'], where: { organization_id: orgId, archived: false }, _count: true, orderBy: { _count: { insurer: 'desc' } }, take: 10 }),
      prisma.contract.aggregate({ where: { organization_id: orgId, archived: false }, _sum: { premium_monthly: true, premium_yearly: true } }),
    ])
    return { total, byStatus, byInsurer, monthlyPremiums }
  })
}

export default contractsRoutes
