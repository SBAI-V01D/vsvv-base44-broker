// ============================================================================
// avaai Backend — File Upload Routes
//
// POST   /api/upload/file      — Upload a single file
// POST   /api/upload/files     — Upload multiple files
// GET    /api/upload/:key      — Get a fresh presigned download URL
// DELETE /api/upload/:key      — Delete a file
//
// IMPORTANT: Presigned URLs expire (default 1h). Always use the download
// endpoint to get a fresh URL before accessing file content.
// Do NOT store presigned URLs long-term — store `file_key` instead.
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { uploadFile, uploadFiles, deleteFile, getFileUrl } from '../../services/file-storage.js';
import { requireTenant } from '../../middleware/tenant.js';
import { prisma } from '../../lib/prisma.js';
import { emitEntityEvent } from '../../lib/socket.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const uploadRoutes: FastifyPluginAsync = async (app) => {
  // Register multipart support
  await app.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 10,
    },
  });

  // ---------------------------------------------------------------------------
  // POST /api/upload/file — Single file upload
  // ---------------------------------------------------------------------------
  app.post(
    '/api/upload/file',
    {
      preHandler: [app.requireAuth, requireTenant],
    },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'no_file', message: 'No file provided' });
      }

      const buffer = await data.toBuffer();
      const result = await uploadFile(
        buffer,
        data.filename,
        data.mimetype,
        request.orgId,
      );

      // Create a Document record in the database
      const document = await prisma.document.create({
        data: {
          name: data.filename,
          file_key: result.key,
          file_url: result.url,
          file_size: result.size,
          mime_type: result.mimeType,
          organization_id: request.orgId!,
          uploaded_by: request.user.id,
          uploaded_at: new Date(),
        },
      });

      // Broadcast via Socket.io
      emitEntityEvent(
        'Document',
        'create',
        document as Record<string, unknown>,
        request.orgId ?? '',
        request.user.id,
      );

      return reply.code(201).send({
        data: {
          ...result,
          documentId: document.id,
        },
      });
    },
  );

  // ---------------------------------------------------------------------------
  // POST /api/upload/files — Multiple file upload
  // ---------------------------------------------------------------------------
  app.post(
    '/api/upload/files',
    {
      preHandler: [app.requireAuth, requireTenant],
    },
    async (request, reply) => {
      const files: Array<{ buffer: Buffer; originalName: string; mimeType: string }> = [];
      const parts = request.files();

      for await (const part of parts) {
        const buffer = await part.toBuffer();
        files.push({
          buffer,
          originalName: part.filename,
          mimeType: part.mimetype,
        });
      }

      if (files.length === 0) {
        return reply.code(400).send({ error: 'no_files', message: 'No files provided' });
      }

      const results = await uploadFiles(files, request.orgId);

      // Create Document records for each uploaded file
      const documents = await Promise.all(
        results.map((result) =>
          prisma.document.create({
            data: {
              name: result.originalName,
              file_key: result.key,
              file_url: result.url,
              file_size: result.size,
              mime_type: result.mimeType,
              organization_id: request.orgId!,
              uploaded_by: request.user.id,
              uploaded_at: new Date(),
            },
          }),
        ),
      );

      // Broadcast via Socket.io for each document
      for (const doc of documents) {
        emitEntityEvent(
          'Document',
          'create',
          doc as Record<string, unknown>,
          request.orgId ?? '',
          request.user.id,
        );
      }

      return reply.code(201).send({
        files: results.map((r, i) => ({
          ...r,
          documentId: documents[i].id,
        })),
      });
    },
  );

  // ---------------------------------------------------------------------------
  // GET /api/upload/:orgId/:fileId — Get a fresh presigned download URL
  //
  // The key is split into orgId/fileId to avoid slash issues in route params.
  // Presigned URLs expire after 1 hour by default. This endpoint generates
  // a new one on-the-fly so stored document references never go stale.
  // ---------------------------------------------------------------------------
  app.get(
    '/api/upload/:orgId/:fileId',
    {
      preHandler: [app.requireAuth, requireTenant],
    },
    async (request, reply) => {
      const { orgId, fileId } = request.params as { orgId: string; fileId: string };
      const key = `${orgId}/${fileId}`;

      // Verify the file belongs to this tenant
      const document = await prisma.document.findFirst({
        where: {
          file_key: key,
          organization_id: request.orgId!,
          archived: false,
        },
      });

      if (!document) {
        return reply.code(404).send({ error: 'not_found', message: 'File not found' });
      }

      // Generate a fresh presigned URL
      const freshUrl = await getFileUrl(key, 3600);

      return {
        url: freshUrl,
        key: document.file_key,
        name: document.name,
        mime_type: document.mime_type,
        size: document.file_size,
        expires_in_seconds: 3600,
      };
    },
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/upload/:orgId/:fileId — Delete a file
  // ---------------------------------------------------------------------------
  app.delete(
    '/api/upload/:orgId/:fileId',
    {
      preHandler: [app.requireAuth, requireTenant],
    },
    async (request, reply) => {
      const { orgId, fileId } = request.params as { orgId: string; fileId: string };
      const key = `${orgId}/${fileId}`;

      // Verify the file belongs to this tenant
      const document = await prisma.document.findFirst({
        where: {
          file_key: key,
          organization_id: request.orgId!,
        },
      });

      if (!document) {
        return reply.code(404).send({ error: 'not_found', message: 'File not found' });
      }

      await deleteFile(key);

      // Soft-delete the document record
      const deleted = await prisma.document.update({
        where: { id: document.id },
        data: {
          archived: true,
          archived_at: new Date(),
          archived_by: request.user.id,
        },
      });

      // Broadcast via Socket.io
      emitEntityEvent(
        'Document',
        'delete',
        deleted as Record<string, unknown>,
        request.orgId ?? '',
        request.user.id,
      );

      return { message: 'File deleted', documentId: document.id };
    },
  );
};

export default uploadRoutes;
