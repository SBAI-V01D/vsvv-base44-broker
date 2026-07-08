// ============================================================================
// VSVV Backend — File Storage Service (MinIO)
//
// Provides file upload, download, and management via MinIO (S3-compatible).
// Uses presigned URLs for secure direct access.
// ============================================================================

import { Client as MinioClient } from 'minio';
import { env } from '../config/env.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// ---------------------------------------------------------------------------
// MinIO Client Singleton
// ---------------------------------------------------------------------------

let _client: MinioClient | null = null;

function getClient(): MinioClient {
  if (!_client) {
    _client = new MinioClient({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return _client;
}

const BUCKET_NAME = env.MINIO_BUCKET;
const REGION = 'eu-central-1';

// ---------------------------------------------------------------------------
// Ensure bucket exists on first use
// ---------------------------------------------------------------------------

async function ensureBucket(): Promise<void> {
  const client = getClient();
  const exists = await client.bucketExists(BUCKET_NAME);
  if (!exists) {
    await client.makeBucket(BUCKET_NAME, REGION);
  }
}

let bucketEnsured = false;

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
 * @returns UploadResult with key, URL, and metadata
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  organizationId?: string,
): Promise<UploadResult> {
  if (!bucketEnsured) {
    await ensureBucket();
    bucketEnsured = true;
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

  // Generate a presigned URL valid for 1 hour
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
