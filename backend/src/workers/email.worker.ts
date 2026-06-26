// ============================================================================
// avaai Backend — Email Worker (BullMQ)
//
// Processes email jobs from the 'avaai:email' queue.
// Supports: password reset, notifications, campaign emails.
//
// Start with: node dist/workers/email.worker.js
// Or programmatically: startEmailWorker()
// ============================================================================

import nodemailer from 'nodemailer';
import { createWorker, QueueName, type WorkerDefinition } from '../lib/queue.js';
import { env } from '../config/env.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
  /** Organization ID for audit logging */
  organization_id?: string;
  /** User ID who triggered this email */
  triggered_by?: string;
}

// ---------------------------------------------------------------------------
// Transporter (lazy-initialized)
// ---------------------------------------------------------------------------

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }
  return _transporter;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handleEmail(job: { data: EmailJobData }): Promise<void> {
  const { to, subject, body, html, attachments } = job.data;

  if (!to || !subject) {
    throw new Error('Email job missing required fields: to, subject');
  }

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text: body,
    html: html || body.replace(/\n/g, '<br>'),
    attachments: attachments as any,
  });

  console.debug(`[EMAIL] Sent to ${to}: ${info.messageId}`);
}

// ---------------------------------------------------------------------------
// Worker Definition
// ---------------------------------------------------------------------------

export const emailWorkerDefinition: WorkerDefinition = {
  queueName: QueueName.EMAIL,
  handler: handleEmail,
  concurrency: 10,
};

/**
 * Start the email worker (standalone entry point).
 */
export function startEmailWorker() {
  const worker = createWorker(emailWorkerDefinition);
  console.log('[WORKER] Email worker started');
  return worker;
}

// Allow running directly
if (require.main === module) {
  startEmailWorker();
}
