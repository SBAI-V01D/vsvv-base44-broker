import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'

const backupRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'backupLog',
      prefix: 'backup-logs',
      searchFields: ['status', 'type'],
      sortableFields: ['created_at', 'updated_at'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin'],
        get: ['admin'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin'],
      },
    }),
  )

  // Backup auslösen (Log-Eintrag)
  app.post('/api/backup/trigger', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const { type = 'incremental' } = request.body as { type?: string }

    return prisma.backupLog.create({
      data: {
        organization_id: orgId,
        backup_type: type as any,
        status: 'completed',
        timestamp: new Date(),
      },
    })
  })

  // Letzte Backups
  app.get('/api/backup/history', { preHandler: [app.requireAuth] }, async (request) => {
    const orgId = (request.user as any)?.organization_id
    const [full, incremental] = await Promise.all([
      prisma.backupLog.findMany({ where: { organization_id: orgId, backup_type: 'full' }, orderBy: { created_at: 'desc' }, take: 10 }),
      prisma.backupLog.findMany({ where: { organization_id: orgId, backup_type: 'incremental' }, orderBy: { created_at: 'desc' }, take: 10 }),
    ])
    return { full, incremental }
  })
}

export default backupRoutes
