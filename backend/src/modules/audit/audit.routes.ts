import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'
import { addJob, QueueName } from '../../lib/queue.js'

const auditRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'auditLog',
      prefix: 'audit-logs',
      searchFields: ['entity_type', 'event_type', 'actor_type'],
      sortableFields: ['created_at', 'updated_at', 'entity_type', 'event_type'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin', 'compliance', 'management'],
        get: ['admin', 'compliance', 'management'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin'],
      },
    }, { skipCrud: true }),
  )

  // Gefilterte Audit-Logs
  app.get('/api/audit/search', { preHandler: [app.requireAuth] }, async (request) => {
    const { entity_type, event_type, actor_type, from, to, limit = '100', skip = '0' } = request.query as Record<string, string>
    const orgId = (request.user as any)?.organization_id

    const where: Record<string, any> = { organization_id: orgId }
    if (entity_type) where.entity_type = entity_type
    if (event_type) where.event_type = event_type
    if (actor_type) where.actor_type = actor_type
    if (from || to) {
      where.created_at = {}
      if (from) where.created_at.gte = new Date(from)
      if (to) where.created_at.lte = new Date(to)
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        skip: Number(skip),
      }),
      prisma.auditLog.count({ where }),
    ])
    return { data, total, limit: Number(limit), skip: Number(skip) }
  })

  // Compliance-Check: Datenintegrität
  app.get('/api/audit/compliance-check', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id

    const [orphanContracts, orphanApplications, orphanDocuments] = await Promise.all([
      prisma.contract.count({ where: { organization_id: orgId, customer_id: { notIn: (await prisma.customer.findMany({ where: { organization_id: orgId }, select: { id: true } })).map(c => c.id) } } }),
      prisma.application.count({ where: { organization_id: orgId, customer_id: { notIn: (await prisma.customer.findMany({ where: { organization_id: orgId }, select: { id: true } })).map(c => c.id) } } }),
      prisma.document.count({ where: { organization_id: orgId, customer_id: { notIn: (await prisma.customer.findMany({ where: { organization_id: orgId }, select: { id: true } })).map(c => c.id) } } }),
    ])

    const totalCustomers = await prisma.customer.count({ where: { organization_id: orgId } })
    const totalWithoutEmail = await prisma.customer.count({ where: { organization_id: orgId, email: null } })

    return {
      orphanContracts,
      orphanApplications,
      orphanDocuments,
      totalCustomers,
      totalWithoutEmail,
      dataQualityScore: totalCustomers > 0 ? Math.round((1 - totalWithoutEmail / totalCustomers) * 100) : 100,
    }
  })

  // System-Logs
  app.get('/api/audit/system-logs', { preHandler: [app.requireAuth] }, async (request) => {
    const { level, limit = '100', skip = '0' } = request.query as Record<string, string>
    const orgId = (request.user as any)?.organization_id

    const where: Record<string, any> = { organization_id: orgId }
    if (level) where.level = level

    const [data, total] = await Promise.all([
      prisma.systemLog.findMany({ where, orderBy: { created_at: 'desc' }, take: Number(limit), skip: Number(skip) }),
      prisma.systemLog.count({ where }),
    ])
    return { data, total }
  })

  // ---------------------------------------------------------------------------
  // POST /api/audit/scan — Trigger a deep audit scan
  // ---------------------------------------------------------------------------
  app.post(
    '/api/audit/scan',
    { preHandler: [app.requireAuth, app.requireRole(['admin', 'compliance', 'management'])] },
    async (request, reply) => {
      const { run_auto_fix } = (request.body || {}) as { run_auto_fix?: boolean }
      const userId = (request.user as any)?.id
      const orgId = (request.user as any)?.organization_id

      const job = await addJob(
        QueueName.AUDIT,
        'deep-audit-scan',
        {
          organizationId: orgId,
          userId,
          run_auto_fix: run_auto_fix ?? false,
        },
        {
          attempts: 2,
          backoff: { type: 'exponential', delay: 5000 },
        },
      )

      return reply.code(202).send({
        queued: true,
        jobId: job.id,
        message: 'Deep Audit Scan wurde gestartet',
      })
    },
  )

  // ---------------------------------------------------------------------------
  // GET /api/audit/scan/status — Get latest scan results / status
  // ---------------------------------------------------------------------------
  app.get(
    '/api/audit/scan/status',
    { preHandler: [app.requireAuth] },
    async (request) => {
      const orgId = (request.user as any)?.organization_id

      const latestScan = await prisma.enterpriseIncident.findFirst({
        where: {
          organization_id: orgId,
          category: 'other',
        },
        orderBy: { created_at: 'desc' },
      })

      if (!latestScan) {
        return { data: null, message: 'Noch kein Scan durchgeführt' }
      }

      let reportData = null
      try {
        reportData = latestScan.description ? JSON.parse(latestScan.description) : null
      } catch { /* ignore */ }

      return {
        data: {
          id: latestScan.id,
          status: latestScan.status,
          severity: latestScan.severity,
          created_at: latestScan.created_at,
          updated_at: latestScan.updated_at,
          report: reportData,
        },
      }
    },
  )

  // ---------------------------------------------------------------------------
  // GET /api/audit/scan/history — Scan history
  // ---------------------------------------------------------------------------
  app.get(
    '/api/audit/scan/history',
    { preHandler: [app.requireAuth] },
    async (request) => {
      const orgId = (request.user as any)?.organization_id

      const scans = await prisma.enterpriseIncident.findMany({
        where: { organization_id: orgId, category: 'other' },
        orderBy: { created_at: 'desc' },
        take: 20,
      })

      return {
        data: scans.map((s) => {
          let reportData = null
          try { reportData = s.description ? JSON.parse(s.description) : null } catch { /* ignore */ }
          return {
            id: s.id,
            status: s.status,
            severity: s.severity,
            score: reportData?.score?.overall ?? null,
            summary: reportData?.summary ?? null,
            created_at: s.created_at,
            duration_ms: reportData?.duration_ms ?? null,
          }
        }),
      }
    },
  )
}

export default auditRoutes
