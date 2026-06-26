// ============================================================================
// avaSysAIByNik Backend — Multi-Tenant Isolation Middleware
// Ensures every request has an orgId context and injects it into the request.
// Must run AFTER requireAuth so that request.user is available.
// ============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';

// ---------------------------------------------------------------------------
// requireTenant — ensures orgId is set on the request
// ---------------------------------------------------------------------------

/**
 * PreHandler that extracts `organization_id` from the authenticated user
 * and injects it into `request.orgId` for downstream use.
 *
 * All Prisma queries in tenant-scoped modules MUST filter by `orgId`
 * to enforce multi-tenant data isolation.
 *
 * Usage:
 *   `preHandler: [app.requireAuth, requireTenant]`
 *
 * @example
 *   ```typescript
 *   app.get('/api/customers', {
 *     preHandler: [app.requireAuth, requireTenant],
 *     async handler(request, reply) {
 *       const customers = await prisma.customer.findMany({
 *         where: { organization_id: request.orgId },
 *       })
 *       return { customers }
 *     },
 *   })
 *   ```
 */
export async function requireTenant(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Guard: requireAuth must have run first
  if (!request.user) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required before tenant resolution',
    });
    return;
  }

  // Guard: user must belong to an organization
  if (!request.user.organization_id) {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'User does not belong to an organization',
    });
    return;
  }

  // Inject orgId for downstream Prisma queries
  request.orgId = request.user.organization_id;
}

/**
 * Helper that returns a Prisma `where` clause scoped to the current tenant.
 * Use this in all tenant-scoped repository/service functions.
 *
 * @example
 *   ```typescript
 *   const customers = await prisma.customer.findMany({
 *     where: {
 *       ...tenantWhere(request),
 *       status: 'active',
 *     },
 *   })
 *   ```
 */
export function tenantWhere(request: FastifyRequest): { organization_id: string } {
  if (!request.orgId) {
    throw new Error(
      'Tenant context not available. Ensure requireTenant middleware runs before accessing orgId.',
    );
  }
  return { organization_id: request.orgId };
}
