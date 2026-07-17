// ============================================================================
// VSVV Backend — JWT Authentication Middleware
// Provides requireAuth preHandler and extractUser helper.
// Public routes are whitelisted to bypass authentication.
// ============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';

// ---------------------------------------------------------------------------
// Public Routes Whitelist — routes that bypass JWT authentication
// ---------------------------------------------------------------------------
export const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/admin/health',
  '/api/portal/login',
  '/api/portal/setup-password',
];

// ---------------------------------------------------------------------------
// extractUser — decode JWT without throwing (returns null on failure)
// ---------------------------------------------------------------------------

/**
 * Attempts to verify the JWT from the Authorization header.
 * Returns the decoded user payload or `null` if the token is missing / invalid.
 * Useful for routes where auth is optional (e.g., public pages that show user info).
 */
export async function extractUser(
  request: FastifyRequest,
): Promise<{ id: string; email: string; role: string; organization_id: string } | null> {
  try {
    await request.jwtVerify();
    return request.user;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// requireAuth — preHandler that enforces JWT authentication
// ---------------------------------------------------------------------------

/**
 * Authentication preHandler for Fastify.
 *
 * Skips JWT verification for whitelisted public routes.
 * For all other routes, verifies the Bearer token via `@fastify/jwt`
 * and attaches the decoded payload to `request.user`.
 *
 * Usage (per-route):
 *   `preHandler: [app.requireAuth]`
 *
 * Or registered as a global hook in app.ts:
 *   `app.addHook('preHandler', app.requireAuth)`
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Skip authentication for public routes
  const urlPath = request.url.split('?')[0];
  const isPublic = PUBLIC_ROUTES.some((route) => urlPath.startsWith(route));
  if (isPublic) {
    return;
  }

  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}
