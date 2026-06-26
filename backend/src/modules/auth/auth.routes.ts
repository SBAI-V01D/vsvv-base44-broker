// ============================================================================
// avaai Backend — Authentication Routes
// Complete auth system: register, login, refresh, logout, me, forgot/reset password.
// JWT access tokens (15min) + refresh tokens (7d) with rotation.
// ============================================================================

import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { ZodError } from 'zod';

import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';
import type {
  LoginInput,
  RegisterInput,
  RefreshInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schema.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Hashes a refresh token for secure storage.
 * We store a SHA-256 hash — never the raw token.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Strips sensitive fields from a User object before returning to the client.
 */
function sanitizeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organization_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization_id: user.organization_id,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Route Plugin
// ---------------------------------------------------------------------------

const authRoutes: FastifyPluginAsync = async (app) => {
  // -------------------------------------------------------------------------
  // POST /api/auth/register — Create a new user account
  // -------------------------------------------------------------------------
  app.post('/api/auth/register', async (request, reply) => {
    let body: RegisterInput;
    try {
      body = registerSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: err.errors.map((e) => e.message).join(', '),
        });
      }
      throw err;
    }

    // Check if email is already registered
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'A user with this email already exists',
      });
    }

    // Hash the password
    const password_hash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password_hash,
        role: body.role,
        organization_id: body.organization_id ?? null,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return reply.status(201).send({ user: sanitizeUser(user) });
  });

  // -------------------------------------------------------------------------
  // POST /api/auth/login — Authenticate and return JWT tokens
  // -------------------------------------------------------------------------
  app.post('/api/auth/login', async (request, reply) => {
    let body: LoginInput;
    try {
      body = loginSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: err.errors.map((e) => e.message).join(', '),
        });
      }
      throw err;
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    // Generic error to avoid user enumeration
    if (!user || !user.password_hash) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account is deactivated. Contact your administrator.',
      });
    }

    // JWT payload — shared between access and refresh tokens
    const jwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id ?? '',
    };

    // Sign tokens
    const accessToken = await reply.jwtSign(jwtPayload);
    const refreshToken = await reply.jwtSign(jwtPayload, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    });

    // Store refresh token hash in the database
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        token_hash: tokenHash,
        user_id: user.id,
        organization_id: user.organization_id,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization_id: user.organization_id,
      },
    };
  });

  // -------------------------------------------------------------------------
  // POST /api/auth/refresh — Rotate refresh token, issue new tokens
  // -------------------------------------------------------------------------
  app.post('/api/auth/refresh', async (request, reply) => {
    let body: RefreshInput;
    try {
      body = refreshSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: err.errors.map((e) => e.message).join(', '),
        });
      }
      throw err;
    }

    // Hash the incoming token to look it up
    const tokenHash = hashToken(body.refreshToken);

    // Find the stored token — must exist, not revoked, and not expired
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token_hash: tokenHash,
        revoked: false,
        expires_at: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }

    // Check if the user account is still active
    if (!storedToken.user.is_active) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account is deactivated',
      });
    }

    // Revoke the old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new tokens
    const user = storedToken.user;
    const jwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id ?? '',
    };

    const accessToken = await reply.jwtSign(jwtPayload);
    const newRefreshToken = await reply.jwtSign(jwtPayload, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    });

    // Store the new refresh token
    const newTokenHash = hashToken(newRefreshToken);
    await prisma.refreshToken.create({
      data: {
        token_hash: newTokenHash,
        user_id: user.id,
        organization_id: user.organization_id,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  });

  // -------------------------------------------------------------------------
  // POST /api/auth/logout — Revoke the current refresh token
  // -------------------------------------------------------------------------
  app.post('/api/auth/logout', async (request, reply) => {
    const { refreshToken } = (request.body ?? {}) as {
      refreshToken?: string;
    };

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);

      // Revoke all matching non-revoked tokens
      const result = await prisma.refreshToken.updateMany({
        where: { token_hash: tokenHash, revoked: false },
        data: { revoked: true },
      });

      if (result.count === 0) {
        app.log.warn('Logout attempt with unknown or already revoked token');
      }
    }

    return { message: 'logged_out' };
  });

  // -------------------------------------------------------------------------
  // GET /api/auth/me — Return the currently authenticated user
  // -------------------------------------------------------------------------
  app.get(
    '/api/auth/me',
    {
      preHandler: [app.requireAuth],
    },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organization_id: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return { user: sanitizeUser(user) };
    },
  );

  // -------------------------------------------------------------------------
  // POST /api/auth/forgot-password — Request a password reset
  // -------------------------------------------------------------------------
  app.post('/api/auth/forgot-password', async (request, reply) => {
    let body: ForgotPasswordInput;
    try {
      body = forgotPasswordSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: err.errors.map((e) => e.message).join(', '),
        });
      }
      throw err;
    }

    // Always return the same message — do not reveal if the email exists
    const genericMessage =
      'If the email exists, a password reset link has been sent';

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      // User not found — still return success to avoid enumeration
      return { message: genericMessage };
    }

    // Generate a cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);

    // Store the hashed token with a 1-hour expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token_hash: resetTokenHash,
        reset_token_expires_at: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      },
    });

    // NOTE: We log ONLY the user ID, NEVER the token itself.
    // Logging reset tokens is a security risk — logs may be ingested by
    // third-party services (e.g., Datadog, Splunk), exposing account access.
    if (env.NODE_ENV === 'development') {
      app.log.info(
        `[DEV] Password reset token generated for user: ${user.id}`,
      );
    }

    // TODO: In production, send an email via the notification service
    // await emailService.sendPasswordReset(user.email, resetToken)

    return { message: genericMessage };
  });

  // -------------------------------------------------------------------------
  // POST /api/auth/reset-password — Execute a password reset
  // -------------------------------------------------------------------------
  app.post('/api/auth/reset-password', async (request, reply) => {
    let body: ResetPasswordInput;
    try {
      body = resetPasswordSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Validation Error',
          message: err.errors.map((e) => e.message).join(', '),
        });
      }
      throw err;
    }

    // Hash the provided token and look up the user
    const resetTokenHash = hashToken(body.token);

    const user = await prisma.user.findFirst({
      where: {
        reset_token_hash: resetTokenHash,
        reset_token_expires_at: { gt: new Date() },
      },
    });

    if (!user) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid or expired reset token',
      });
    }

    // Hash the new password
    const password_hash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

    // Update password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        reset_token_hash: null,
        reset_token_expires_at: null,
      },
    });

    // Revoke all existing refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { user_id: user.id, revoked: false },
      data: { revoked: true },
    });

    return { message: 'password_reset' };
  });
};

export default authRoutes;
