import type { FastifyPluginAsync } from 'fastify'
import { createCrudRoutes } from '../../lib/crud-factory.js'
import { prisma } from '../../lib/prisma.js'

const krankenkassenRoutes: FastifyPluginAsync = async (app) => {
  await app.register(
    createCrudRoutes({
      model: 'krankenkassenVergleich',
      prefix: 'krankenkassen-vergleiche',
      searchFields: ['status', 'versicherer'],
      sortableFields: ['created_at', 'updated_at', 'vergleichsdatum', 'status'],
      defaultSort: { field: 'created_at', order: 'desc' },
      permissions: {
        list: ['admin', 'management', 'broker', 'backoffice'],
        get: ['admin', 'management', 'broker', 'backoffice'],
        create: ['admin', 'management', 'backoffice'],
        update: ['admin', 'management', 'broker'],
        delete: ['admin'],
      },
      include: {
        customer: { select: { id: true, first_name: true, last_name: true, birthdate: true, city: true } },
        vergleichs_analysen: { take: 5, orderBy: { created_at: 'desc' } },
      },
    }, { skipCrud: true }),
  )

  // BAG-Prämiendaten abrufen
  app.get('/api/krankenkassen/bag-data', { preHandler: [app.requireAuth] }, async (request) => {
    const { year, canton, age_group } = request.query as Record<string, string>
    const where: Record<string, any> = {}
    if (year) where.jahr = Number(year)
    if (canton) where.kanton = canton
    if (age_group) where.altersklasse = age_group

    return prisma.bAGPraemienDaten.findMany({
      where,
      orderBy: [{ jahr: 'desc' }],
      take: 100,
    })
  })

  // Vergleich durchführen
  app.post('/api/krankenkassen/vergleich/:id/durchfuehren', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const vergleich = await prisma.krankenkassenVergleich.findUnique({
      where: { id },
      include: { customer: true },
    })
    if (!vergleich) return reply.status(404).send({ error: 'Vergleich nicht gefunden' })

    await prisma.krankenkassenVergleich.update({
      where: { id },
      data: { status: 'durchgefuehrt', vergleichsdatum: new Date() },
    })

    return { message: 'Vergleich durchgeführt', vergleich }
  })

  // Analyse-Status
  app.post('/api/krankenkassen/analyse/:id/status', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, notes } = request.body as { status: string; notes?: string }

    return prisma.vergleichsAnalyse.update({
      where: { id },
      data: {
        status: status as any,
        notizen: notes || undefined,
      },
    })
  })
}

export default krankenkassenRoutes
