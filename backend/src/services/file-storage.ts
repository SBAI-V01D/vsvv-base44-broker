// ============================================================================
// avaSysAIByNik Backend — File Storage Service (S3 kompatibel — Exoscale / MinIO)
//
// Provides file upload, download, and management via S3-compatible object storage.
// Uses presigned URLs for secure direct access.
// ============================================================================

import { Client as MinioClient } from 'minio';
import { s3Config } from '../config/env.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// ---------------------------------------------------------------------------
// S3 Client Singleton
// ---------------------------------------------------------------------------

let _client: MinioClient | null = null;

function getClient(): MinioClient {
  if (!_client) {
    _client = new MinioClient({
      endPoint: s3Config.endpoint,
      port: s3Config.port,
      useSSL: s3Config.useSSL,
      accessKey: s3Config.accessKey,
      secretKey: s3Config.secretKey,
      region: s3Config.region,
    });
  }
  return _client;
}

const BUCKET_NAME = s3Config.bucket;

// ---------------------------------------------------------------------------
// Ensure bucket exists on first use
// Silently handles cases where the API key has no create-bucket permission
// (e.g. Exoscale SOS with restricted IAM keys) — if creation fails, we
// assume the bucket was pre-created manually.
// ---------------------------------------------------------------------------

let _bucketEnsured = false;

async function ensureBucket(): Promise<void> {
  const client = getClient();

  try {
    const exists = await client.bucketExists(BUCKET_NAME);
    if (exists) return; // already there
  } catch {
    // bucketExists failed (e.g. no permission) — try makeBucket as fallback
  }

  try {
    await client.makeBucket(BUCKET_NAME, s3Config.region);
  } catch (err: unknown) {
    // If creation fails with AccessDenied/BucketAlreadyOwnedByYou, that's OK —
    // the bucket either exists or was pre-created. Just proceed.
    if (err instanceof Error) {
      const code = (err as { code?: string }).code;
      if (code !== 'AccessDenied' && code !== 'BucketAlreadyOwnedByYou' && code !== 'BucketAlreadyExists') {
        throw err;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  mimeType: string;
  originalName: string;
}

/**
 * Upload a single file to MinIO.
 *
 * @param buffer - File buffer
 * @param originalName - Original file name
 * @param mimeType - MIME type of the file
 * @param organizationId - Tenant organization ID (for folder prefix)
 * @returns UploadResult with key, URL, and metadata.
 *          NOTE: `url` is a short-lived presigned URL (1h) for immediate use.
 *          For persistent access, store `key` and call `getFileUrl()` at access time.
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  organizationId?: string,
): Promise<UploadResult> {
  if (!_bucketEnsured) {
    await ensureBucket();
    _bucketEnsured = true;
  }

  const client = getClient();
  const ext = path.extname(originalName);
  const uuid = randomUUID();
  const folder = organizationId ? `${organizationId}/` : '';
  const key = `${folder}${uuid}${ext}`;

  await client.putObject(BUCKET_NAME, key, buffer, buffer.length, {
    'Content-Type': mimeType,
    'X-Amz-Meta-Original-Name': encodeURIComponent(originalName),
  });

  // Generate a presigned URL valid for 1 hour for immediate use
  const url = await client.presignedGetObject(BUCKET_NAME, key, 60 * 60);

  return {
    key,
    url,
    bucket: BUCKET_NAME,
    size: buffer.length,
    mimeType,
    originalName,
  };
}

/**
 * Upload multiple files.
 */
export async function uploadFiles(
  files: Array<{ buffer: Buffer; originalName: string; mimeType: string }>,
  organizationId?: string,
): Promise<UploadResult[]> {
  return Promise.all(
    files.map((f) => uploadFile(f.buffer, f.originalName, f.mimeType, organizationId)),
  );
}

/**
 * Delete a file from MinIO.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  await client.removeObject(BUCKET_NAME, key);
}

/**
 * Get a presigned URL for downloading a file.
 */
export async function getFileUrl(key: string, expirySeconds = 3600): Promise<string> {
  const client = getClient();
  return client.presignedGetObject(BUCKET_NAME, key, expirySeconds);
}

export default {
  uploadFile,
  uploadFiles,
  deleteFile,
  getFileUrl,
};
