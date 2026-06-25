// ============================================================================
// VSVV Backend — BullMQ Queue Configuration
//
// Provides a centralized queue factory for async job processing.
// Supported queues:
//   - email:    Send transactional emails (password reset, notifications)
//   - document: Document processing (OCR, PDF generation)
//   - audit:    Batch audit log writes (fire-and-forget with backpressure)
//   - cleanup:  Data retention / purging (scheduled)
//
// Prerequisites:
//   - Redis server running (configured via REDIS_URL env var)
//   - BullMQ 5.x + ioredis 5.x (included in package.json)
// ============================================================================

import { Queue, Worker, type Job, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Redis Connection
// ---------------------------------------------------------------------------

let _connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // Reconnect strategy
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    }) as IORedis;
  }
  return _connection;
}

// ---------------------------------------------------------------------------
// Queue Definitions
// ---------------------------------------------------------------------------

export enum QueueName {
  EMAIL = 'vsvv:email',
  DOCUMENT = 'vsvv:document',
  AUDIT = 'vsvv:audit',
  CLEANUP = 'vsvv:cleanup',
}

// ---------------------------------------------------------------------------
// Queue Factory
// ---------------------------------------------------------------------------

const _queues = new Map<QueueName, Queue>();

/**
 * Get or create a BullMQ queue by name.
 */
export function getQueue(name: QueueName): Queue {
  if (_queues.has(name)) {
    return _queues.get(name)!;
  }

  const queue = new Queue(name, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: getConnection() as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000, // 1s, 2s, 4s
      },
      removeOnComplete: {
        age: 7 * 24 * 3600, // keep for 7 days
        count: 1000,
      },
      removeOnFail: {
        age: 30 * 24 * 3600, // keep for 30 days
      },
    },
  });

  _queues.set(name, queue);
  return queue;
}

// ---------------------------------------------------------------------------
// Job Helpers
// ---------------------------------------------------------------------------

/**
 * Add a job to a queue.
 */
export async function addJob<T = unknown>(
  queueName: QueueName,
  jobName: string,
  data: T,
  options?: JobsOptions,
): Promise<Job<T>> {
  const queue = getQueue(queueName);
  return queue.add(jobName, data, options);
}

/**
 * Add a batch of jobs to a queue.
 */
export async function addJobsBatch<T = unknown>(
  queueName: QueueName,
  jobs: Array<{ name: string; data: T; opts?: JobsOptions }>,
): Promise<Job<T>[]> {
  const queue = getQueue(queueName);
  return queue.addBulk(jobs);
}

// ---------------------------------------------------------------------------
// Worker Factory
// ---------------------------------------------------------------------------

export interface WorkerDefinition {
  queueName: QueueName;
  handler: (job: Job) => Promise<void>;
  concurrency?: number;
}

/**
 * Create and start a BullMQ worker for a given queue.
 */
export function createWorker(def: WorkerDefinition): Worker {
  const worker = new Worker(
    def.queueName,
    async (job: Job) => {
      try {
        await def.handler(job);
      } catch (error: any) {
        console.error(`[QUEUE:${def.queueName}] Job ${job.id} (${job.name}) failed:`, error.message);
        throw error; // BullMQ will retry based on job options
      }
    },
    {
      connection: getConnection() as any,
      concurrency: def.concurrency ?? 5,
      // Graceful shutdown
      stalledInterval: 30000,
      maxStalledCount: 3,
    },
  );

  worker.on('completed', (job) => {
    console.debug(`[QUEUE:${def.queueName}] Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[QUEUE:${def.queueName}] Job ${job?.id} (${job?.name}) failed:`, error.message);
  });

  return worker;
}

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------

/**
 * Close all queues and Redis connection gracefully.
 * Call during app shutdown (SIGTERM/SIGINT).
 */
export async function closeQueueConnections(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const [name, queue] of _queues.entries()) {
    closePromises.push(
      queue.close().catch(() => {
        console.warn(`[QUEUE] Failed to close queue: ${name}`);
      }),
    );
  }

  await Promise.all(closePromises);
  _queues.clear();

  if (_connection) {
    await _connection.quit().catch(() => {});
    _connection = null;
  }
}

export default {
  QueueName,
  getQueue,
  addJob,
  addJobsBatch,
  createWorker,
  closeQueueConnections,
};
