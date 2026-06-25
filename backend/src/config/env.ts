import { z } from 'zod';

// ---------------------------------------------------------------------------
// VSVV Backend — Environment Variable Validation
// All env vars are parsed and validated at import time via Zod.
// Access the validated `env` singleton throughout the app.
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // ----- Application -----
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().positive().max(65535)),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  // ----- Database -----
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

  // ----- Redis -----
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // ----- JWT -----
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // ----- MinIO (S3-compatible storage) -----
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z
    .string()
    .default('9000')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().positive().max(65535)),
  MINIO_USE_SSL: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  MINIO_ACCESS_KEY: z.string().min(1, 'MINIO_ACCESS_KEY is required'),
  MINIO_SECRET_KEY: z.string().min(1, 'MINIO_SECRET_KEY is required'),
  MINIO_BUCKET: z.string().default('vsvv-documents'),

  // ----- SMTP / Email -----
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z
    .string()
    .default('1025')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().positive().max(65535)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@vsvv.ch'),

  // ----- CORS -----
  CORS_ORIGIN: z.string().default('*'),
});

/** Type definition inferred from the Zod schema */
export type Env = z.infer<typeof envSchema>;

/**
 * Parsed and validated environment variables.
 * Throws at import time if required vars are missing or invalid.
 */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const env: Readonly<Env> = loadEnv();
