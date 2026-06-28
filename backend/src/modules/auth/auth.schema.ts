// ============================================================================
// avaai Backend — Auth Validation Schemas (Zod)
// All request bodies for the auth module are validated here.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The 7 RBAC roles from src/lib/rbac.js */
const ROLES = [
  'admin',
  'management',
  'broker',
  'backoffice',
  'finance',
  'support',
  'compliance',
] as const;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Login — validates email + password credentials.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Register — creates a new user account.
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters'),
  role: z
    .enum(ROLES)
    .default('broker'),
  organization_id: z
    .string()
    .min(1, 'Organization ID is required')
    .optional(),
});

/**
 * Refresh — validates a refresh token string.
 */
export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
});

/**
 * Forgot Password — validates the user's email.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),
});

/**
 * Reset Password — validates the reset token and new password.
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
