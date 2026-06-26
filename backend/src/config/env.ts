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

  // ----- S3 / MinIO (S3-kompatibler Object Storage, z.B. Exoscale SOS) -----
  //
  // Zwei Naming-Schemata werden unterstützt:
  // 1. Standard (Exoscale-style): S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
  // 2. Legacy (MinIO-style):    MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET
  //
  // Production-Konfiguration (Exoscale):
  //   S3_ENDPOINT=https://sos-ch-dk-2.exo.io
  //   S3_REGION=ch-dk-2
  //   S3_BUCKET=vsvv-premium-broker-app-documentuploads
  //   S3_ACCESS_KEY_ID=EXO...
  //   S3_SECRET_ACCESS_KEY=...
  //
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

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
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
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
  // SECURITY: In production, ALWAYS set CORS_ORIGIN to the explicit
  // frontend domain (e.g. 'https://app.vsvv.ch'). Wildcard '*' allows
  // any website to make cross-origin API calls.
  CORS_ORIGIN: z.string().default('http://localhost:3004'),
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

// ---------------------------------------------------------------------------
// Resolved S3 Config — merges Exoscale (S3_*) and MinIO-style vars
// ---------------------------------------------------------------------------

export interface S3Config {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
}

/**
 * Resolves S3 storage configuration from env vars.
 * Supports both Exoscale-style (S3_*) and MinIO-style (MINIO_*) variables.
 * Exoscale-style takes precedence when S3_ENDPOINT is set.
 */
function resolveS3Config(envData: Env): S3Config {
  // Exoscale-style config (S3_ENDPOINT = full URL like https://sos-ch-dk-2.exo.io)
  if (envData.S3_ENDPOINT) {
    const accessKey = envData.S3_ACCESS_KEY_ID || envData.MINIO_ACCESS_KEY;
    const secretKey = envData.S3_SECRET_ACCESS_KEY || envData.MINIO_SECRET_KEY;

    if (!accessKey || !secretKey) {
      throw new Error(
        'S3_ENDPOINT gsetzt aber kei Credentials.\n' +
        'Setz S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY oder MINIO_ACCESS_KEY + MINIO_SECRET_KEY.',
      );
    }

    const url = new URL(envData.S3_ENDPOINT);
    return {
      endpoint: url.hostname,
      port: parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80),
      useSSL: url.protocol === 'https:',
      accessKey,
      secretKey,
      bucket: envData.S3_BUCKET || envData.MINIO_BUCKET,
      region: envData.S3_REGION || 'ch-dk-2',
    };
  }

  // Fallback to MinIO-style config
  if (!envData.MINIO_ACCESS_KEY || !envData.MINIO_SECRET_KEY) {
    throw new Error(
      'S3 Storage: Kei S3_ENDPOINT und kei MINIO Credentials.\n' +
      'Setz entweder Exoscale-Vars (S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)\n' +
      'oder MinIO-Vars (MINIO_ACCESS_KEY, MINIO_SECRET_KEY).',
    );
  }

  return {
    endpoint: envData.MINIO_ENDPOINT,
    port: envData.MINIO_PORT ?? 9000,
    useSSL: envData.MINIO_USE_SSL,
    accessKey: envData.MINIO_ACCESS_KEY!,
    secretKey: envData.MINIO_SECRET_KEY!,
    bucket: envData.MINIO_BUCKET,
    region: envData.S3_REGION || 'eu-central-1',
  };
}

export const s3Config: Readonly<S3Config> = resolveS3Config(env);
