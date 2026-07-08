import type { FastifyCorsOptions } from '@fastify/cors';

// ---------------------------------------------------------------------------
// VSVV Backend — CORS Configuration
// ---------------------------------------------------------------------------

/**
 * CORS configuration for the Fastify server.
 * In production, restrict the origin to the actual frontend domain.
 */
export const corsConfig: FastifyCorsOptions = {
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Organization-Id',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours — browser preflight cache
};
