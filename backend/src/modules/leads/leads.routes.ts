import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'
import { qualifyLeadSchema, autopilotSchema, offerStatusSchema } from './leads.schema.js'

const leadsRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'lead',
      prefix: 'leads',
      searchFields: ['status', 'source', 'notes'],
      sortableFields: ['created_at', 'updated_at', 'status', 'source'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin', 'management', 'broker', 'backoffice'],
        get: ['admin', 'management', 'broker', 'backoffice'],
        create: ['admin', 'management', 'backoffice'],
        update: ['admin', 'management', 'broker'],
        delete: ['admin'],
      },
      include: {
        customer: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
      },
    }),
  )

  // Lead qualifizieren (Status-Übergang)
  app.post('/api/leads/:id/qualify', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, notes } = qualifyLeadSchema.parse(request.body)

    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return reply.status(404).send({ error: 'Lead not found' })

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: status as any,
        notes: notes ? `${lead.notes || ''}\n[${status}] ${notes}`.trim() : lead.notes,
      },
    })

    // Bei converted: Auto-Create Customer falls nicht vorhanden
    if (status === 'converted' && lead.customer_id) {
      const customer = await prisma.customer.findUnique({ where: { id: lead.customer_id } })
      if (customer) {
        await prisma.customer.update({
          where: { id: lead.customer_id },
          data: { status: 'active', notes: `${customer.notes || ''}\n[Lead converted]`.trim() },
        })
      }
    }

    return updated
  })

  // Autopilot umschalten
  app.post('/api/leads/:id/autopilot', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { autopilot_status } = autopilotSchema.parse(request.body)
    return prisma.lead.update({ where: { id }, data: { autopilot_status: autopilot_status as any } })
  })

  // Angebots-Status
  app.post('/api/leads/:id/offer-status', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { offer_status, notes } = offerStatusSchema.parse(request.body)
    return prisma.lead.update({
      where: { id },
      data: {
        offer_status: offer_status as any,
        notes: notes ? `${(await prisma.lead.findUnique({ where: { id } }))?.notes || ''}\n[Offer: ${offer_status}] ${notes}`.trim() : undefined,
      },
    })
  })

  // Dashboard
  app.get('/api/leads/stats', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [total, byStatus, bySource, autopilotActive] = await Promise.all([
      prisma.lead.count({ where: { organization_id: orgId, archived: false } }),
      prisma.lead.groupBy({ by: ['status'], where: { organization_id: orgId, archived: false }, _count: true }),
      prisma.lead.groupBy({ by: ['source'], where: { organization_id: orgId, archived: false }, _count: true }),
      prisma.lead.count({ where: { organization_id: orgId, archived: false, autopilot_status: 'active' } }),
    ])
    return { total, byStatus, bySource, autopilotActive }
  })
}

export default leadsRoutes
