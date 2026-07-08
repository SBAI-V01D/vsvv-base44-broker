// ============================================================================
// VSVV Backend — Role-Based Access Control Middleware
// Mirrors the 7-role system defined in src/lib/rbac.js (frontend).
// Backend enforcement via requireRole preHandler factory.
// ============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';

// ---------------------------------------------------------------------------
// Role Definitions — matching src/lib/rbac.js
// ---------------------------------------------------------------------------

export const ROLES = {
  ADMIN: 'admin',
  MANAGEMENT: 'management',
  BROKER: 'broker',
  BACKOFFICE: 'backoffice',
  FINANCE: 'finance',
  SUPPORT: 'support',
  COMPLIANCE: 'compliance',
} as const;

/** Union type of all valid role string values */
export type Role = (typeof ROLES)[keyof typeof ROLES];

/** All roles as an array — useful for validation */
export const ALL_ROLES: Role[] = Object.values(ROLES);

// ---------------------------------------------------------------------------
// requireRole — returns a preHandler that enforces role membership
// ---------------------------------------------------------------------------

/**
 * Factory that returns a Fastify preHandler function.
 * Checks that `request.user.role` is included in the allowed roles list.
 * Responds with 403 Forbidden if the user's role is not permitted.
 *
 * @param allowedRoles - Array of roles that are allowed to access the route.
 *
 * @example
 *   ```typescript
 *   app.get('/api/finance/reports', {
 *     preHandler: [app.requireAuth, app.requireRole(['admin', 'finance'])],
 *     async handler(request, reply) { ... }
 *   })
 *   ```
 */
export function requireRole(
  allowedRoles: Role[],
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(request.user.role as Role)) {
      reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }
  };
}

/**
 * Pre-built role checks for common permission groups.
 * Convenience wrappers that compose `requireRole` with common role sets.
 */
export const roleGuard = {
  /** Admin only — full system access */
  adminOnly: () => requireRole([ROLES.ADMIN]),

  /** Management and above — strategic oversight */
  management: () => requireRole([ROLES.ADMIN, ROLES.MANAGEMENT]),

  /** Finance operations — financial data access */
  finance: () => requireRole([ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.FINANCE]),

  /** Backoffice operations — customer and document management */
  backoffice: () => requireRole([ROLES.ADMIN, ROLES.MANAGEMENT, ROLES.BACKOFFICE]),

  /** Compliance — audit log and system monitoring access */
  compliance: () => requireRole([ROLES.ADMIN, ROLES.COMPLIANCE]),

  /** Support — customer-facing support access */
  support: () => requireRole([ROLES.ADMIN, ROLES.SUPPORT]),
};
