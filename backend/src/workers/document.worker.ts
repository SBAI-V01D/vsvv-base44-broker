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

export interface AutoContractJobData {
  documentId: string;
  policy: {
    insurer: string | null;
    policyNumber: string | null;
    policyHolder: string | null;
    insuredPersons: string[];
    premium: number | null;
    premiumInterval: string | null;
    coverage: string[];
    deductible: number | null;
    model: string | null;
    startDate: string | null;
    endDate: string | null;
    documentType: string | null;
  };
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
  police: 'unbekannt',
  abrechnung: 'unbekannt',
}

function mapDocType(aiType: string | undefined | null): 'antrag' | 'anlage' | 'unbekannt' {
  if (!aiType) return 'unbekannt'
  const lower = aiType.toLowerCase().trim()
  return (DOC_TYPE_MAP[lower] as 'antrag' | 'anlage' | 'unbekannt') || 'unbekannt'
}

// ---------------------------------------------------------------------------
// Worker Handler
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Auto-Contract Handler
// ---------------------------------------------------------------------------

async function handleAutoContract(job: Job<AutoContractJobData>): Promise<void> {
  const { documentId, policy, organizationId } = job.data;

  console.info(`[AUTO-CONTRACT] Creating contract from document ${documentId}`);

  if (!policy.policyHolder && !policy.policyNumber) {
    console.warn(`[AUTO-CONTRACT] Kei Policy-Holder oder -Nummer — übersprunge`);
    return;
  }

  // 1. Find the document
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    console.warn(`[AUTO-CONTRACT] Dokument ${documentId} nöd gfunde`);
    return;
  }

  // 2. Find or create customer
  let customerId: string | undefined | null = doc.customer_id || doc.primary_customer_id;

  if (!customerId && policy.policyHolder) {
    // Try to find customer by name
    const nameParts = policy.policyHolder.split(' ').filter(Boolean)
    const lastName = nameParts.pop() || ''
    const firstName = nameParts.join(' ')

    const customer = await prisma.customer.findFirst({
      where: {
        organization_id: organizationId,
        OR: [
          { last_name: { contains: lastName, mode: 'insensitive' } },
          { first_name: { contains: firstName, mode: 'insensitive' } },
        ],
      },
      orderBy: { created_at: 'desc' },
    })

    if (customer) {
      customerId = customer.id
      // Link document to customer
      await prisma.document.update({
        where: { id: documentId },
        data: { customer_id: customer.id, customer_name: policy.policyHolder, processing_stage: 'customer_mapped' },
      })
    }
  }

  // 3. Check if contract already exists
  if (policy.policyNumber) {
    const existing = await prisma.contract.findFirst({
      where: { policy_number: policy.policyNumber, organization_id: organizationId },
    })
    if (existing) {
      console.info(`[AUTO-CONTRACT] Vertrag ${policy.policyNumber} existiert bereits`)
      // Link document to existing contract
      await prisma.document.update({
        where: { id: documentId },
        data: { linked_contract_id: existing.id, processing_stage: 'policy_created' },
      })
      return
    }
  }

  // 4. Create/update customer if needed
  if (!customerId) {
    const newCust = await prisma.customer.create({
      data: {
        first_name: policy.policyHolder || 'Unbekannt',
        last_name: policy.policyHolder || `Aus Dokument ${documentId.slice(0, 8)}`,
        customer_type: 'private',
        status: 'active',
        organization_id: organizationId,
      },
    })
    customerId = newCust.id
    await prisma.document.update({
      where: { id: documentId },
      data: { customer_id: newCust.id, customer_name: policy.policyHolder, processing_stage: 'customer_mapped' },
    })
  }

  const isHealth = ['helsana', 'css', 'swica', 'sanitas', 'kpt', 'assura', 'sympany', 'ökk', 'atupri', 'aquilana', 'philos', 'innova', 'sanag', 'egk', 'moove', 'globe']
    .some(h => policy.insurer?.toLowerCase().includes(h))

  const contract = await prisma.contract.create({
    data: {
      policy_number: policy.policyNumber || `AUTO-${documentId.slice(0, 8)}`,
      insurer: policy.insurer || 'Unbekannt',
      customer_id: customerId!,
      insurance_type: isHealth ? 'health' : 'other',
      premium_monthly: policy.premiumInterval === 'monatlich' ? (policy.premium ?? 0) : (policy.premium ? policy.premium / 12 : null),
      premium_yearly: policy.premiumInterval === 'jaehrlich' ? (policy.premium ?? 0) : (policy.premium ? policy.premium * 12 : null),
      start_date: policy.startDate ? new Date(policy.startDate) : null,
      end_date: policy.endDate ? new Date(policy.endDate) : null,
      status: 'active',
      organization_id: organizationId,
    },
  })

  // Link document to contract and advance processing stage
  await prisma.document.update({
    where: { id: documentId },
    data: { linked_contract_id: contract.id, processing_stage: 'policy_created' },
  })
  emitToOrganization('extraction:complete', { documentId, stage: 'policy_created', contractId: contract.id }, organizationId)

  console.info(`[AUTO-CONTRACT] ✅ Vertrag ${contract.id} erstellt (Police: ${policy.policyNumber || 'N/A'})`)
}

// ---------------------------------------------------------------------------
// Main Document Handler (routes by job name)
// ---------------------------------------------------------------------------

async function handleDocumentJob(job: Job<DocumentJobData | AutoContractJobData>): Promise<void> {
  // Route by job name
  if (job.name === 'auto-create-contract') {
    return handleAutoContract(job as Job<AutoContractJobData>)
  }

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
      // Map AI documentType to valid enum value
      doc_type: mapDocType(result.policies[0]?.documentType),
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

  // 5. Emit socket events for real-time frontend update
  emitEntityEvent('document', 'update', {
    id: documentId,
    processing_stage: 'entities_detected',
    extraction_result: extractedData,
  }, organizationId, userId);
  emitToOrganization('extraction:complete', { documentId, stage: 'entities_detected', confidence: result.confidence }, organizationId);

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
