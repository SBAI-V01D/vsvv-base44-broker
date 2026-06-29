// ============================================================================
// avaai Backend — Document Extraction API Routes
//
// Provides endpoints to trigger document extraction and check status.
// The actual extraction runs asynchronously via BullMQ.
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { addJob, QueueName } from '../../lib/queue.js';

const documentRoutes: FastifyPluginAsync = async (app) => {
  // ---------------------------------------------------------------------------
  // POST /api/document/extract — Trigger extraction for an existing document
  //
  // Body: { documentId: string }
  // Queue: avaai:document → Worker extracts via AI Vision
  // Returns: { queued: true, jobId: string }
  // ---------------------------------------------------------------------------
  app.post(
    '/api/document/extract',
    {
      preHandler: [app.requireAuth],
    },
    async (request, reply) => {
      const { documentId } = request.body as { documentId: string };
      const userId = request.user?.id;
      const orgId = request.user?.organization_id;

      if (!documentId) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'documentId is required',
        });
      }

      // Verify document exists
      const doc = await prisma.document.findFirst({
        where: { id: documentId, organization_id: orgId, archived: false },
      });

      if (!doc) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Document not found',
        });
      }

      if (!doc.file_key) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Document has no file_key (not uploaded)',
        });
      }

      // Queue extraction job
      const job = await addJob(
        QueueName.DOCUMENT,
        'extract-document',
        {
          documentId: doc.id,
          fileKey: doc.file_key,
          mimeType: doc.mime_type || 'application/octet-stream',
          organizationId: orgId,
          userId,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      return reply.code(202).send({
        queued: true,
        jobId: job.id,
        documentId: doc.id,
      });
    },
  );

  // ---------------------------------------------------------------------------
  // GET /api/document/extract/:id/status — Check extraction status
  // ---------------------------------------------------------------------------
  app.get(
    '/api/document/extract/:id/status',
    {
      preHandler: [app.requireAuth],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const orgId = request.user?.organization_id;

      const doc = await prisma.document.findFirst({
        where: { id, organization_id: orgId },
        select: {
          id: true,
          processing_stage: true,
          classification_status: true,
          classification_confidence: true,
          doc_type: true,
        },
      });

      if (!doc) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Document not found',
        });
      }

      return reply.send({ data: doc });
    },
  );

  // ---------------------------------------------------------------------------
  // GET /api/document/extract/:id/result — Get extraction result
  // ---------------------------------------------------------------------------
  app.get(
    '/api/document/extract/:id/result',
    {
      preHandler: [app.requireAuth],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const orgId = request.user?.organization_id;

      // Get the latest extraction log for this document
      const extractionLog = await prisma.extractionCorrectionLog.findFirst({
        where: {
          file_url: { contains: id }, // file_key contains document ID
          organization_id: orgId,
        },
        orderBy: { created_at: 'desc' },
      });

      if (!extractionLog) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'No extraction result found for this document',
        });
      }

      return reply.send({
        data: {
          insurer: extractionLog.insurer,
          document_type: extractionLog.document_type,
          original_extraction: extractionLog.original_extraction,
          ai_analysis: extractionLog.ai_analysis,
          reviewed: extractionLog.reviewed,
          created_at: extractionLog.created_at,
        },
      });
    },
  );

  // ---------------------------------------------------------------------------
  // POST /api/document/extract/batch — Batch extraction trigger
  //
  // Body: { documentIds: string[] }
  // Queues all documents for extraction
  // ---------------------------------------------------------------------------
  app.post(
    '/api/document/extract/batch',
    {
      preHandler: [app.requireAuth],
    },
    async (request, reply) => {
      const { documentIds } = request.body as { documentIds: string[] };
      const userId = request.user?.id;
      const orgId = request.user?.organization_id;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'documentIds array is required',
        });
      }

      if (documentIds.length > 50) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Maximum 50 documents per batch',
        });
      }

      // Find all valid documents
      const docs = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          organization_id: orgId,
          archived: false,
          file_key: { not: null },
        },
      });

      // Queue each document
      const queued = [];
      for (const doc of docs) {
        if (!doc.file_key) continue;
        const job = await addJob(
          QueueName.DOCUMENT,
          'extract-document',
          {
            documentId: doc.id,
            fileKey: doc.file_key,
            mimeType: doc.mime_type || 'application/octet-stream',
            organizationId: orgId,
            userId,
          },
          { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
        );
        queued.push({ documentId: doc.id, jobId: job.id });
      }

      return reply.code(202).send({
        queued: queued.length,
        total: documentIds.length,
        notFound: documentIds.length - docs.length,
        jobs: queued,
      });
    },
  );
};

export default documentRoutes;
