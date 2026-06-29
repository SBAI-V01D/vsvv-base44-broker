// ============================================================================
// avaai Backend — Document Processing Worker (BullMQ)
//
// Consumes the "avaai:document" queue. Processes each job by:
//   1. Fetching the Document record from the DB
//   2. Calling the AI extraction service (aipi.coredy.ai)
//   3. Updating the Document with extracted data
//   4. Creating an ExtractionCorrectionLog entry for audit/review
//   5. Emitting a Socket.io event for real-time frontend updates
// ============================================================================

import { type Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import { createWorker, addJob, QueueName } from '../lib/queue.js';
import { extractFromDocument } from '../services/ai-extraction.js';
import { emitEntityEvent } from '../lib/socket.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentJobData {
  documentId: string;
  fileKey: string;
  mimeType: string;
  organizationId: string;
  userId: string;
}

export interface ExtractionResult {
  success: boolean;
  policies: Array<Record<string, unknown>>;
  confidence: number;
  error?: string;
  rawResponse?: string;
}

// ---------------------------------------------------------------------------
// Worker Handler
// ---------------------------------------------------------------------------

async function handleDocumentJob(job: Job<DocumentJobData>): Promise<void> {
  const { documentId, fileKey, mimeType, organizationId, userId } = job.data;

  console.info(`[DOCUMENT WORKER] Processing document ${documentId} (${fileKey})`);

  // 1. Update processing stage
  await prisma.document.update({
    where: { id: documentId },
    data: { processing_stage: 'parsed' },
  });

  // 2. Call AI extraction service
  const result = await extractFromDocument(fileKey, mimeType);

  if (!result.success) {
    console.warn(`[DOCUMENT WORKER] Extraction failed for ${documentId}: ${result.error}`);

    // Log the failure
    await prisma.extractionCorrectionLog.create({
      data: {
        insurer: 'unknown',
        document_type: mimeType,
        file_url: fileKey,
        original_extraction: result.rawResponse ? JSON.parse(result.rawResponse) : null,
        error_categories: ['extraction_failed'],
        ai_analysis: result.error,
        organization_id: organizationId,
      },
    });

    // Don't throw — extraction failure with retry exhausted is acceptable
    // The document stays in 'parsed' stage for manual review
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processing_stage: 'uploaded', // reset for manual retry
        classification_status: 'pruefung_erforderlich',
      },
    });

    emitEntityEvent('document', 'update', { id: documentId, processing_stage: 'uploaded', extraction_error: result.error }, organizationId, userId);
    return;
  }

  // 3. Update document with extracted data
  const extractedData = {
    policies: result.policies,
    confidence: result.confidence,
  };

  await prisma.document.update({
    where: { id: documentId },
    data: {
      processing_stage: 'entities_detected',
      classification_status: 'klassifiziert',
      classification_confidence: result.confidence,
      // Extract the first policy's insurer as doc_type hint
      doc_type: result.policies[0]?.documentType as any ?? 'unbekannt',
    },
  });

  // 4. Create extraction correction log (for review trail)
  await prisma.extractionCorrectionLog.create({
    data: {
      insurer: result.policies[0]?.insurer ?? 'unbekannt',
      document_type: mimeType,
      file_url: fileKey,
      original_extraction: extractedData as any,
      error_categories: [],
      ai_analysis: result.rawResponse,
      organization_id: organizationId,
    },
  });

  // 5. Emit socket event for real-time frontend update
  emitEntityEvent('document', 'update', {
    id: documentId,
    processing_stage: 'entities_detected',
    extraction_result: extractedData,
  }, organizationId, userId);

  console.info(`[DOCUMENT WORKER] ✅ Extraction complete for ${documentId} (confidence: ${result.confidence})`);

  // 6. If high confidence, auto-create contract if it doesn't exist
  if (result.confidence >= 0.8 && result.policies[0]?.insurer) {
    try {
      await addJob(QueueName.DOCUMENT, 'auto-create-contract', {
        documentId,
        policy: result.policies[0],
        organizationId,
        userId,
      });
      console.info(`[DOCUMENT WORKER] Auto-contract job queued for ${documentId}`);
    } catch (err) {
      // Non-critical — contract creation can be done manually
      console.warn(`[DOCUMENT WORKER] Failed to queue auto-contract: ${err}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Worker Registration
// ---------------------------------------------------------------------------

let _worker: ReturnType<typeof createWorker> | null = null;

/**
 * Start the document processing worker.
 * Call this during app bootstrap.
 */
export function startDocumentWorker(): void {
  if (_worker) {
    console.warn('[DOCUMENT WORKER] Already running');
    return;
  }

  _worker = createWorker({
    queueName: QueueName.DOCUMENT,
    handler: handleDocumentJob,
    concurrency: 3, // process 3 documents simultaneously
  });

  console.info('[DOCUMENT WORKER] Started — waiting for jobs...');
}

/**
 * Stop the document worker gracefully.
 */
export async function stopDocumentWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
    console.info('[DOCUMENT WORKER] Stopped');
  }
}
