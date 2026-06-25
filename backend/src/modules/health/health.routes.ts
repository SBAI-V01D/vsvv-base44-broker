// ============================================================================
// VSVV Backend — Health Check Route
// Provides enhanced health check with database connectivity verification.
// Excluded from JWT auth via PUBLIC_ROUTES whitelist in src/middleware/auth.ts.
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../lib/prisma.js';

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/health', async (_request, reply) => {
    const dbStart = Date.now();
    let dbConnected = false;
    let dbLatency = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbConnected = true;
    } catch {
      dbLatency = Date.now() - dbStart;
    }

    const status = dbConnected ? 'ok' : 'degraded';
    const statusCode = dbConnected ? 200 : 503;

    return reply.code(statusCode).send({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        connected: dbConnected,
        latency_ms: dbLatency,
      },
    });
  });
};

export default healthRoutes;
