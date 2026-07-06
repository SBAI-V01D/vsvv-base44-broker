import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'
import {
  createApplicationSchema,
  updateApplicationSchema,
  transitionStatusSchema,
} from './applications.schema.js'

const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['in_progress', 'archived'],
  in_progress: ['waiting', 'approved', 'rejected', 'archived'],
  waiting: ['approved', 'rejected', 'in_progress', 'archived'],
  approved: ['archived'],
  rejected: ['archived'],
  archived: [],
}

const applicationsRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'application',
      prefix: 'applications',
      searchFields: ['status', 'insurer', 'policy_number', 'product', 'customer_name'],
      sortableFields: ['created_at', 'updated_at', 'status', 'insurer', 'customer_name'],
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
        linked_contract: { select: { id: true, policy_number: true, status: true } },
        documents: {
          where: { archived: false },
          take: 5,
          orderBy: { created_at: 'desc' },
        },
      },
      validateCreate: async (body) => {
        try { createApplicationSchema.parse(body) }
        catch (err: any) { return { error: err.errors?.map((e: any) => e.message).join(', ') || 'Validation failed', status: 400 } }
      },
      validateUpdate: async (body) => {
        try { updateApplicationSchema.parse(body) }
        catch (err: any) { return { error: err.errors?.map((e: any) => e.message).join(', ') || 'Validation failed', status: 400 } }
      },
    }),
  )

  // Custom: Status-Übergang mit Validierung
  app.post('/api/applications/:id/transition', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = transitionStatusSchema.parse(request.body)
    const { status: nextStatus, reason } = body

    const appRecord = await prisma.application.findUnique({ where: { id } })
    if (!appRecord) return reply.status(404).send({ error: 'Application not found' })

    const current = appRecord.status
    const allowed = VALID_TRANSITIONS[current] || []

    if (!allowed.includes(nextStatus)) {
      return reply.status(400).send({
        error: `Status-Übergang von "${current}" nach "${nextStatus}" nicht erlaubt. Erlaubt: ${allowed.join(', ')}`,
      })
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: nextStatus as any,
        status_changed_at: new Date(),
        status_history: [
          ...((appRecord.status_history as any[]) || []),
          { from: current, to: nextStatus, reason, changed_by: (request.user as any)?.id, changed_at: new Date().toISOString() },
        ],
        notes: reason ? `${appRecord.notes || ''}\n[Status: ${current}→${nextStatus}] ${reason}`.trim() : undefined,
      },
    })

    // Auto-create contract on approval
    if (nextStatus === 'approved' && !appRecord.linked_contract_id) {
      const contract = await prisma.contract.create({
        data: {
          customer_id: appRecord.customer_id,
          customer_name: appRecord.customer_name,
          organization_id: appRecord.organization_id,
          insurer: appRecord.insurer,
          policy_number: appRecord.policy_number,
          product: appRecord.product,
          status: 'active',
          start_date: appRecord.contract_start_date,
          end_date: appRecord.contract_end_date,
          source_application_id: appRecord.id,
          assigned_broker: appRecord.assigned_broker,
        },
      })
      await prisma.application.update({
        where: { id },
        data: { linked_contract_id: contract.id, policy_number: contract.policy_number },
      })
    }

    return updated
  })

  // Custom: Antrag pro Kunde abrufen
  app.get('/api/applications/by-customer/:customerId', { preHandler: [app.requireAuth] }, async (request) => {
    const { customerId } = request.params as { customerId: string }
    return prisma.application.findMany({
      where: { customer_id: customerId, archived: false },
      orderBy: { created_at: 'desc' },
      include: { linked_contract: { select: { id: true, policy_number: true, status: true } } },
    })
  })

  // Custom: Statistiken
  app.get('/api/applications/stats', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [total, byStatus, byInsurer] = await Promise.all([
      prisma.application.count({ where: { organization_id: orgId, archived: false } }),
      prisma.application.groupBy({ by: ['status'], where: { organization_id: orgId, archived: false }, _count: true }),
      prisma.application.groupBy({ by: ['insurer'], where: { organization_id: orgId, archived: false }, _count: true, orderBy: { _count: { insurer: 'desc' } }, take: 10 }),
    ])
    return { total, byStatus, byInsurer }
  })
}

export default applicationsRoutes
