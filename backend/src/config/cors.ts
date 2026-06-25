import type { FastifyCorsOptions } from '@fastify/cors';

// ---------------------------------------------------------------------------
// VSVV Backend — CORS Configuration
// ---------------------------------------------------------------------------

/**
 * CORS configuration for the Fastify server.
 * In production, restrict the origin to the actual frontend domain.
 */
export const corsConfig: FastifyCorsOptions = {
  // In production, ALWAYS set CORS_ORIGIN to the explicit frontend domain.
  // Wildcard '*' is ONLY safe in local development behind nginx.
  origin: process.env.CORS_ORIGIN || 'http://localhost:3004',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Organization-Id',
    'X-Service-Role',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours — browser preflight cache
};
