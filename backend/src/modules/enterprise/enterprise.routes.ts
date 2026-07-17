import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'

const enterpriseRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'enterpriseIncident',
      prefix: 'enterprise-incidents',
      searchFields: ['status', 'category', 'severity', 'title'],
      sortableFields: ['created_at', 'updated_at', 'severity', 'status'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin', 'management', 'compliance'],
        get: ['admin', 'management', 'compliance'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin'],
      },
    }, { skipCrud: true }),
  )

  // Incident bearbeiten
  app.post('/api/enterprise/incidents/:id/transition', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, notes } = request.body as { status: string; notes?: string }
    const validTransitions: Record<string, string[]> = {
      open: ['investigating'],
      investigating: ['root_cause_identified', 'mitigation_active'],
      root_cause_identified: ['mitigation_active', 'in_progress'],
      mitigation_active: ['in_progress', 'resolved'],
      in_progress: ['resolved'],
      resolved: ['closed'],
      closed: [],
      rejected: [],
      accepted_risk: [],
      auto_fixed: [],
    }

    const incident = await prisma.enterpriseIncident.findUnique({ where: { id } })
    if (!incident) return reply.status(404).send({ error: 'Incident not found' })
    const allowed = validTransitions[incident.status as string] || []
    if (!allowed.includes(status)) {
      return reply.status(400).send({ error: `Status "${incident.status}" → "${status}" nicht erlaubt` })
    }

    return prisma.enterpriseIncident.update({
      where: { id },
      data: {
        status: status as any,
        resolution_notes: notes ? `${incident.resolution_notes || ''}\n[${status}] ${notes}`.trim() : incident.resolution_notes,
      },
    })
  })

  // SLA-Dashboard
  app.get('/api/enterprise/sla-dashboard', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [openIncidents, byCategory, bySeverity] = await Promise.all([
      prisma.enterpriseIncident.count({ where: { organization_id: orgId, status: { in: ['open', 'investigating', 'in_progress'] } } }),
      prisma.enterpriseIncident.groupBy({ by: ['category'], where: { organization_id: orgId }, _count: true }),
      prisma.enterpriseIncident.groupBy({ by: ['severity'], where: { organization_id: orgId }, _count: true }),
    ])
    return { openIncidents, byCategory, bySeverity }
  })

  // Governance Rules
  app.get('/api/enterprise/governance-rules', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    return prisma.governanceRule.findMany({
      where: { organization_id: orgId },
      orderBy: { created_at: 'desc' },
    })
  })

  // Verbesserungsvorschläge
  app.get('/api/enterprise/improvements', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    return prisma.enterpriseImprovement.findMany({
      where: { organization_id: orgId },
      orderBy: { created_at: 'desc' },
    })
  })
}

export default enterpriseRoutes
