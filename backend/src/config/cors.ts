import type { FastifyCorsOptions } from '@fastify/cors';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// VSVV Backend — CORS Configuration
// ---------------------------------------------------------------------------

/** Exposed by @fastify/cors types */
type OriginCallback = (err: Error | null, origin: boolean | string | RegExp | Array<boolean | string | RegExp>) => void;
type OriginFunction = (origin: string | undefined, cb: OriginCallback) => void;

/**
 * Parsed CORS origins from env: comma-separated list
 * Dev default: http://localhost:3004
 * Production: https://app.vsvv.ch (via CORS_ORIGIN in Production-Umgebung)
 */
function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const ALLOWED_ORIGINS = parseOrigins(env.CORS_ORIGIN);

/**
 * CORS origin validator — returns `true` (echo origin) only if the request
 * origin is in the allowed list. For disallowed origins, `false` suppresses
 * the Access-Control-Allow-Origin header entirely — the browser sees
 * "nix für dich" and blocks.
 */
const originCallback: OriginFunction = (
  requestOrigin: string | undefined,
  cb: OriginCallback,
): void => {
  // Requests ohne Origin (z.B. curl, server-to-server) erlaube
  if (!requestOrigin) {
    cb(null, true);
    return;
  }

  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    cb(null, true); // Erlaubt → Origin echo
    return;
  }

  cb(null, false); // Kei CORS-Header für unerlaubti Origins
};

export const corsConfig: FastifyCorsOptions = {
  origin: originCallback,
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
