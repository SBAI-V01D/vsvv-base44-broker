import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'
import { assignTaskSchema, completeTaskSchema } from './tasks.schema.js'

const tasksRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'task',
      prefix: 'tasks',
      searchFields: ['status', 'type', 'priority', 'title'],
      sortableFields: ['created_at', 'updated_at', 'due_date', 'priority', 'status'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin', 'management', 'broker', 'backoffice', 'support'],
        get: ['admin', 'management', 'broker', 'backoffice'],
        create: ['admin', 'management', 'backoffice'],
        update: ['admin', 'management', 'broker'],
        delete: ['admin'],
      },
      include: {
        customer: { select: { id: true, first_name: true, last_name: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
    }),
  )

  // Task zuweisen
  app.post('/api/tasks/:id/assign', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { assigned_to } = assignTaskSchema.parse(request.body)
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return reply.status(404).send({ error: 'Task not found' })
    return prisma.task.update({ where: { id }, data: { assigned_to, status: 'in_progress' } })
  })

  // Task abschliessen
  app.post('/api/tasks/:id/complete', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { notes } = completeTaskSchema.parse(request.body)
    return prisma.task.update({ where: { id }, data: { status: 'completed', notes: notes || undefined } })
  })

  // Task wieder öffnen
  app.post('/api/tasks/:id/reopen', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return prisma.task.update({ where: { id }, data: { status: 'open' } })
  })

  // Fällige Tasks (Dashboard)
  app.get('/api/tasks/upcoming', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return prisma.task.findMany({
      where: {
        organization_id: orgId,
        archived: false,
        status: { in: ['open', 'in_progress'] },
        due_date: { lte: in7Days },
      },
      include: {
        customer: { select: { id: true, first_name: true, last_name: true } },
        assignee: { select: { id: true, email: true, name: true } },
      },
      orderBy: [{ due_date: 'asc' }, { priority: 'asc' }],
    })
  })

  // Auto-Task erstellen (für Renewal, Dokumente etc.)
  app.post('/api/tasks/auto-create', { preHandler: [app.requireAuth] }, async (request) => {
    const body = request.body as any
    const orgId = (request.user as any)?.organization_id
    const userId = (request.user as any)?.id

    return prisma.task.create({
      data: {
        title: body.title || 'Aufgabe',
        task_type: body.task_type || 'general',
        priority: body.priority || 'medium',
        status: 'open',
        due_date: body.due_date ? new Date(body.due_date) : null,
        assigned_to: body.assigned_to || userId,
        customer_id: body.customer_id || null,
        organization_id: orgId,
        notes: body.notes || null,
      },
    })
  })

  // Dashboard
  app.get('/api/tasks/stats', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [total, byStatus, byPriority, overdue] = await Promise.all([
      prisma.task.count({ where: { organization_id: orgId, archived: false } }),
      prisma.task.groupBy({ by: ['status'], where: { organization_id: orgId, archived: false }, _count: true }),
      prisma.task.groupBy({ by: ['priority'], where: { organization_id: orgId, archived: false }, _count: true }),
      prisma.task.count({ where: { organization_id: orgId, archived: false, status: { in: ['open', 'in_progress'] }, due_date: { lt: new Date() } } }),
    ])
    return { total, byStatus, byPriority, overdue }
  })
}

export default tasksRoutes
