// ============================================================================
// VSVV Backend — Service-Role Access Control Middleware
//
// Enforces that the `X-Service-Role: true` header can ONLY be used by users
// with the 'admin' role. This prevents privilege escalation where non-admin
// users could bypass RBAC by simply adding this header.
//
// The frontend's `asServiceRole` proxy uses this header for admin operations.
// Without this middleware, any authenticated user could access admin-only data.
// ============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * PreHandler that validates the X-Service-Role header.
 *
 * - If the header is absent: allows the request to proceed (normal operation).
 * - If the header is present and user is admin: allows the request.
 * - If the header is present and user is NOT admin: responds 403 Forbidden.
 *
 * Usage:
 *   `preHandler: [app.requireAuth, requireTenant, requireServiceRole]`
 *
 * Or register it globally in app.ts for all admin-proxy routes.
 */
export async function requireServiceRole(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const serviceRoleHeader = request.headers['x-service-role'];

  // Header not present — normal request, no restrictions
  if (!serviceRoleHeader || serviceRoleHeader !== 'true') {
    return;
  }

  // Header IS set to 'true' — verify admin role
  if (!request.user) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required for service-role access',
    });
    return;
  }

  if (request.user.role !== 'admin') {
    reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Service-role access requires admin privileges',
    });
    return;
  }
}
