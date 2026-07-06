import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma.js'

const adminRoutes: FastifyPluginAsync = async (app) => {
  // System-Health
  app.get('/api/admin/health', async () => {
    const [dbOk, customerCount] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false),
      prisma.customer.count(),
    ])
    return { status: dbOk ? 'healthy' : 'degraded', database: dbOk ? 'connected' : 'disconnected', totalCustomers: customerCount }
  })

  // Team-Übersicht
  app.get('/api/admin/team', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const users = await prisma.user.findMany({
      where: { organization_id: orgId },
      select: { id: true, email: true, name: true, role: true, is_active: true, last_login: true, created_at: true },
      orderBy: { name: 'asc' },
    })
    const total = users.length
    const active = users.filter(u => u.is_active).length
    return { users, total, active, byRole: users.reduce((acc: Record<string, number>, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {}) }
  })

  // User aktivieren/deaktivieren
  app.patch('/api/admin/users/:id/toggle-active', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return prisma.user.update({ where: { id }, data: { is_active: !user.is_active } })
  })

  // User erstellen (Admin)
  app.post('/api/admin/users', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const orgId = (request.user as any)?.organization_id
    const { email, name, role } = request.body as { email: string; name?: string; role?: string }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return reply.status(409).send({ error: 'Email already exists' })
    return prisma.user.create({ data: { email, name: name || email, role: role || 'broker', organization_id: orgId, is_active: true } })
  })

  // Fehler-Logs
  app.get('/api/admin/error-logs', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const { limit = '50', skip = '0', status } = request.query as Record<string, string>
    const where: Record<string, any> = { organization_id: orgId }
    if (status) where.status = status
    const [data, total] = await Promise.all([
      prisma.errorLog.findMany({ where, orderBy: { created_at: 'desc' }, take: Number(limit), skip: Number(skip) }),
      prisma.errorLog.count({ where }),
    ])
    return { data, total }
  })

  // Dashboard-Metriken
  app.get('/api/admin/metrics', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [
      customerCount, contractCount, activeContracts,
      totalPremium, openTasks, pendingApplications,
    ] = await Promise.all([
      prisma.customer.count({ where: { organization_id: orgId, archived: false } }),
      prisma.contract.count({ where: { organization_id: orgId, archived: false } }),
      prisma.contract.count({ where: { organization_id: orgId, archived: false, status: 'active' } }),
      prisma.contract.aggregate({ where: { organization_id: orgId, archived: false }, _sum: { premium_yearly: true } }),
      prisma.task.count({ where: { organization_id: orgId, archived: false, status: { in: ['open', 'in_progress'] } } }),
      prisma.application.count({ where: { organization_id: orgId, archived: false, status: { in: ['new', 'in_progress', 'waiting'] } } }),
    ])
    return { customerCount, contractCount, activeContracts, totalPremium: totalPremium._sum.premium_yearly || 0, openTasks, pendingApplications }
  })
}

export default adminRoutes
