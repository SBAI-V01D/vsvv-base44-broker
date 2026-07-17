import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../../lib/prisma.js'
import { requireTenant, tenantWhere } from '../../middleware/tenant.js'
import { emitEntityEvent } from '../../lib/socket.js'

const documentsRoutes: FastifyPluginAsync = async (app) => {

  // PATCH /api/documents/:id/link — Link to customer/contract/application
  app.patch(
    '/api/documents/:id/link',
    { preHandler: [app.requireAuth, requireTenant] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as {
        customer_id?: string
        contract_id?: string
        linked_application_id?: string
      }

      const doc = await prisma.document.findFirst({
        where: { id, ...tenantWhere(request) },
      })
      if (!doc) return reply.code(404).send({ error: 'Document not found' })

      const data: Record<string, unknown> = {}
      if (body.customer_id !== undefined) data.customer_id = body.customer_id
      if (body.contract_id !== undefined) data.linked_contract_id = body.contract_id
      if (body.linked_application_id !== undefined) data.linked_application_id = body.linked_application_id

      const updated = await prisma.document.update({ where: { id }, data })
      emitEntityEvent('Document', 'update', updated as any, request.orgId ?? '', request.user?.id ?? '')
      return { data: updated }
    },
  )

  // PATCH /api/documents/:id/reclassify — Manual reclassification
  app.patch(
    '/api/documents/:id/reclassify',
    { preHandler: [app.requireAuth, requireTenant] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { doc_type, category } = request.body as {
        doc_type?: string
        category?: string
      }

      const doc = await prisma.document.findFirst({
        where: { id, ...tenantWhere(request) },
      })
      if (!doc) return reply.code(404).send({ error: 'Document not found' })

      const data: Record<string, unknown> = { classification_status: 'manuell' }
      if (doc_type) data.doc_type = doc_type
      if (category) data.category = category

      const updated = await prisma.document.update({ where: { id }, data })
      emitEntityEvent('Document', 'update', updated as any, request.orgId ?? '', request.user?.id ?? '')
      return { data: updated }
    },
  )

  // POST /api/documents/bulk/archive — Bulk archive
  app.post(
    '/api/documents/bulk/archive',
    { preHandler: [app.requireAuth, requireTenant] },
    async (request, reply) => {
      const { ids } = request.body as { ids: string[] }
      if (!ids?.length) return reply.code(400).send({ error: 'ids array required' })

      const result = await prisma.document.updateMany({
        where: { id: { in: ids }, ...tenantWhere(request) },
        data: { archived: true, archived_at: new Date(), archived_by: request.user?.id },
      })
      return { data: { archivedCount: result.count } }
    },
  )

  // POST /api/documents/bulk/delete — Bulk hard-delete (admin only)
  app.post(
    '/api/documents/bulk/delete',
    { preHandler: [app.requireAuth, requireTenant, app.requireRole(['admin'])] },
    async (request, reply) => {
      const { ids } = request.body as { ids: string[] }
      if (!ids?.length) return reply.code(400).send({ error: 'ids array required' })

      const result = await prisma.document.deleteMany({
        where: { id: { in: ids }, ...tenantWhere(request) },
      })
      return { data: { deletedCount: result.count } }
    },
  )

  // GET /api/documents/stats — Document statistics
  app.get(
    '/api/documents/stats',
    { preHandler: [app.requireAuth, requireTenant] },
    async (request) => {
      const where = { organization_id: request.orgId!, archived: false }

      const [total, byDocType, byCategory, byStage, byStatus] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.groupBy({ by: ['doc_type'], where, _count: true }),
        prisma.document.groupBy({ by: ['category'], where, _count: true }),
        prisma.document.groupBy({ by: ['processing_stage'], where, _count: true }),
        prisma.document.groupBy({ by: ['classification_status'], where, _count: true }),
      ])

      return { total, byDocType, byCategory, byStage, byStatus }
    },
  )

  // GET /api/documents/by-customer/:customerId — All docs for a customer
  app.get(
    '/api/documents/by-customer/:customerId',
    { preHandler: [app.requireAuth, requireTenant] },
    async (request) => {
      const { customerId } = request.params as { customerId: string }
      return prisma.document.findMany({
        where: { customer_id: customerId, organization_id: request.orgId!, archived: false },
        orderBy: { created_at: 'desc' },
      })
    },
  )
}

export default documentsRoutes
