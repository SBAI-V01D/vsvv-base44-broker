import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

import { env } from './config/env.js';
import { corsConfig } from './config/cors.js';
import { prisma } from './lib/prisma.js';
import { createCrudRoutes } from './lib/crud-factory.js';
import { ENTITY_REGISTRY } from './lib/entity-registry.js';
import { initSocketServer, closeSocketServer } from './lib/socket.js';
import { startAuditWorker, stopAuditWorker } from './workers/audit.worker.js';

// Middleware
import { PUBLIC_ROUTES, requireAuth } from './middleware/auth.js';
import { requireRole } from './middleware/rbac.js';
import type { Role } from './middleware/rbac.js';

// Auth routes
import authRoutes from './modules/auth/auth.routes.js';
// Health routes
import healthRoutes from './modules/health/health.routes.js';
// Upload routes
import uploadRoutes from './modules/upload/upload.routes.js';
// Functions routes
import functionsRoutes from './modules/functions/functions.routes.js';
// Custom business-logic route modules
import contractsRoutes from './modules/contracts/contracts.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';
import leadsRoutes from './modules/leads/leads.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';
import commissionsRoutes from './modules/commissions/commissions.routes.js';
import documentRoutes from './modules/document/document.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import backupRoutes from './modules/backup/backup.routes.js';
import enterpriseRoutes from './modules/enterprise/enterprise.routes.js';
import krankenkassenRoutes from './modules/krankenkassen/krankenkassen.routes.js';
import portalRoutes from './modules/portal/portal.routes.js';
import integrationsRoutes from './modules/integrations/integrations.routes.js';

// ---------------------------------------------------------------------------
// VSVV Backend — Fastify Application Bootstrap
// ---------------------------------------------------------------------------

// Augment @fastify/jwt's FastifyJWT interface so UserType resolves to our shape
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      role: string;
      organization_id: string;
      [key: string]: unknown;
    };
  }
}

// Extend the Fastify instance with custom decorators
declare module 'fastify' {
  interface FastifyRequest {
    /** Organization ID injected by requireTenant middleware */
    orgId?: string;
  }

  interface FastifyInstance {
    /** JWT-based authentication guard — can be used as per-route preHandler */
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /**
     * Role-based access control guard.
     * Must be used *after* `requireAuth`.
     * Returns a preHandler function that checks the user's role.
     */
    requireRole: (
      roles: Role[],
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// ---------------------------------------------------------------------------
// App factory — allows clean instantiation for testing
// ---------------------------------------------------------------------------

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ----- Plugins -----------------------------------------------------------

  await app.register(cors, corsConfig);
  await app.register(sensible);

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_EXPIRY },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ----- Decorators --------------------------------------------------------

  /**
   * Authentication guard — extracts and verifies the JWT Bearer token.
   * Skips public routes (login, register, refresh, forgot-password, reset-password, health).
   * Attaches decoded payload to `request.user` on success.
   * Returns 401 on missing / invalid / expired token.
   */
  app.decorate('requireAuth', requireAuth);

  /**
   * Role-based access control guard — must be used *after* `requireAuth`.
   * Factory function that returns a preHandler checking the user's role
   * against a list of allowed roles. Returns 403 if not authorized.
   */
  app.decorate('requireRole', requireRole);

  // ----- Global Auth Hook --------------------------------------------------

  /**
   * Global preHandler: applies requireAuth to every route automatically.
   * Public routes (from the PUBLIC_ROUTES whitelist) are skipped inside
   * the requireAuth middleware. Individual routes can still opt in via
   * per-route preHandler for explicit documentation.
   */
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const urlPath = request.url.split('?')[0];
    const isPublic = PUBLIC_ROUTES.some((route) => urlPath.startsWith(route));
    if (isPublic) return;

    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  });

  // ----- Entity CRUD Routes -------------------------------------------------

  // Register all entity CRUD routes from the registry
  for (const config of ENTITY_REGISTRY) {
    await app.register(createCrudRoutes(config));
  }

  // ----- Route Modules -----------------------------------------------------

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '' });
  await app.register(uploadRoutes);
  await app.register(functionsRoutes);
  await app.register(contractsRoutes);
  await app.register(tasksRoutes);
  await app.register(leadsRoutes);
  await app.register(applicationsRoutes);
  await app.register(commissionsRoutes);
  await app.register(documentRoutes);
  await app.register(documentsRoutes);
  await app.register(adminRoutes);
  await app.register(auditRoutes);
  await app.register(backupRoutes);
  await app.register(enterpriseRoutes);
  await app.register(krankenkassenRoutes);
  await app.register(portalRoutes);
  await app.register(integrationsRoutes);

  // ----- Graceful Shutdown -------------------------------------------------

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal} — shutting down gracefully`);
    await closeSocketServer();
    await stopAuditWorker();
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return app;
}

// ---------------------------------------------------------------------------
// Start server (only when run directly, not during tests)
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 Server running on ${env.HOST}:${env.PORT}`);
    app.log.info(`   Environment: ${env.NODE_ENV}`);

    // Initialize Socket.io on top of Fastify's HTTP server
    initSocketServer(app);
    // Start background workers
    startAuditWorker();
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }
}

start();
