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
import { createWorker, QueueName } from '../lib/queue.js';
import { extractFromDocument } from '../services/ai-extraction.js';
import { emitEntityEvent, emitToOrganization } from '../lib/socket.js';

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
// Helpers
// ---------------------------------------------------------------------------

const DOC_TYPE_MAP: Record<string, string> = {
  antrag: 'antrag',
  anlage: 'anlage',
  police: 'police',
  abrechnung: 'abrechnung',
}

function mapDocType(aiType: string | undefined | null): 'antrag' | 'anlage' | 'police' | 'abrechnung' | 'unbekannt' {
  if (!aiType) return 'unbekannt'
  const lower = aiType.toLowerCase().trim()
  return (DOC_TYPE_MAP[lower] as 'antrag' | 'anlage' | 'police' | 'abrechnung' | 'unbekannt') || 'unbekannt'
}

// ---------------------------------------------------------------------------
// Worker Handler
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main Document Handler
// ---------------------------------------------------------------------------

async function handleDocumentJob(job: Job<DocumentJobData>): Promise<void> {
  const data = job.data as DocumentJobData
  const { documentId, fileKey, mimeType, organizationId, userId } = data

  console.info(`[DOCUMENT WORKER] Processing document ${documentId} (${fileKey})`);

  // 1. Update processing stage
  await prisma.document.update({
    where: { id: documentId },
    data: { processing_stage: 'parsed' },
  });
  emitToOrganization('extraction:status', { documentId, stage: 'parsed' }, organizationId);

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
  const engineResult = result.engineResult;
  const qualityScore = result.qualityScore;
  const extractionVersion = result.version;

  const extractedData = {
    success: result.success,
    policies: result.policies,
    confidence: result.confidence,
    classification: engineResult?.classification || null,
    persons: engineResult?.persons || [],
    products: engineResult?.products || [],
    quality_score: qualityScore || null,
    version: extractionVersion || null,
    raw_response: result.rawResponse,
  };

  const docType = engineResult?.classification?.document_type || result.policies[0]?.documentType;
  const primaryInsurer = engineResult?.insurer || result.policies[0]?.insurer || null;

  await prisma.document.update({
    where: { id: documentId },
    data: {
      processing_stage: 'entities_detected',
      classification_status: qualityScore?.status === 'high_quality' ? 'klassifiziert' : 'pruefung_erforderlich',
      classification_confidence: result.confidence,
      doc_type: mapDocType(docType),
    },
  });

  // 4. Create extraction correction log with full engine result
  await prisma.extractionCorrectionLog.create({
    data: {
      insurer: primaryInsurer || 'unbekannt',
      document_type: mimeType,
      file_url: fileKey,
      original_extraction: extractedData as any,
      error_categories: qualityScore?.warnings || [],
      ai_analysis: JSON.stringify({
        quality_score: qualityScore,
        version: extractionVersion,
        classification: engineResult?.classification,
      }),
      organization_id: organizationId,
    },
  });

  // 5. Emit socket events for real-time frontend update
  emitEntityEvent('document', 'update', {
    id: documentId,
    processing_stage: 'entities_detected',
    extraction_result: extractedData,
    quality_score: qualityScore,
    version: extractionVersion,
  }, organizationId, userId);
  emitToOrganization('extraction:complete', {
    documentId,
    stage: 'entities_detected',
    confidence: result.confidence,
    quality_score: qualityScore,
    version: extractionVersion,
  }, organizationId);

  console.info(`[DOCUMENT WORKER] ✅ Extraction complete for ${documentId} (confidence: ${result.confidence}, quality: ${qualityScore?.status || 'unknown'})`);
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
