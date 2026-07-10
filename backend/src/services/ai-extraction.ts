// ============================================================================
// avaai Backend — AI Document Extraction Service
//
// DEPRECATED — wraps InsuranceExtractionEngine for backward compatibility.
// New code should import from insurance-extraction-engine.ts directly.
//
// This module converts the engine's InsuranceExtractionResult back into the
// legacy ExtractionResult / ExtractedPolicy format so existing call sites
// (document.worker.ts, functions.routes.ts, document.routes.ts) continue to
// work without modification during the migration window.
// ============================================================================

export type {
  InsuranceExtractionResult,
  ExtractionEvidence,
  ExtractedPerson,
  ExtractedProduct,
  DocumentClassification,
  DocumentType,
  PersonRole,
  ExtractionQualityScore,
  ExtractionVersion,
  CustomerMatchResult,
} from './insurance-extraction-engine.js';

import {
  analyzeDocument as engineAnalyzeDocument,
  analyzeBuffer as engineAnalyzeBuffer,
} from './insurance-extraction-engine.js';

// ---------------------------------------------------------------------------
// Legacy Types (preserved for backward compatibility)
// ---------------------------------------------------------------------------

export interface ExtractedPolicy {
  insurer: string | null;
  policyNumber: string | null;
  policyHolder: string | null;
  insuredPersons: string[];
  premium: number | null;
  premiumInterval: 'monatlich' | 'jaehrlich' | null;
  coverage: string[];
  deductible: number | null;
  model: string | null;
  startDate: string | null;
  endDate: string | null;
  documentType: 'antrag' | 'police' | 'abrechnung' | 'unbekannt';
}

export interface ExtractionResult {
  success: boolean;
  policies: ExtractedPolicy[];
  confidence: number;
  error?: string;
  rawResponse?: string;
  // Engine metadata (optional — only present when engine produced the result)
  engineResult?: import('./insurance-extraction-engine.js').InsuranceExtractionResult;
  qualityScore?: import('./insurance-extraction-engine.js').ExtractionQualityScore;
  version?: import('./insurance-extraction-engine.js').ExtractionVersion;
  persons?: import('./insurance-extraction-engine.js').ExtractedPerson[];
  products?: import('./insurance-extraction-engine.js').ExtractedProduct[];
}

// ---------------------------------------------------------------------------
// Legacy Document Type Mapping
// ---------------------------------------------------------------------------

const DOC_TYPE_LEGACY_MAP: Record<string, 'antrag' | 'police' | 'abrechnung' | 'unbekannt'> = {
  police: 'police',
  offerte: 'antrag',
  antrag: 'antrag',
  neuantrag: 'antrag',
  aenderungsantrag: 'antrag',
  erneuerungsantrag: 'antrag',
  praemienrechnung: 'abrechnung',
  leistungsabrechnung: 'abrechnung',
  korrespondenz: 'unbekannt',
  kuendigung: 'unbekannt',
  vertragsaenderung: 'unbekannt',
  versicherungsnachweis: 'police',
  unbekannt: 'unbekannt',
};

// ---------------------------------------------------------------------------
// Public API — Engine Delegates
// ---------------------------------------------------------------------------

/**
 * Extract insurance document data from a file key (S3).
 * Delegates to InsuranceExtractionEngine, then converts result to legacy format.
 */
export async function extractFromDocument(
  fileKey: string,
  mimeType: string,
): Promise<ExtractionResult> {
  try {
    const engineResult = await engineAnalyzeDocument(fileKey, mimeType);
    return toLegacyResult(engineResult);
  } catch (error: any) {
    return {
      success: false,
      policies: [],
      confidence: 0,
      error: error.message || 'Unknown AI Extraction Error',
    };
  }
}

/**
 * Extract from a file buffer (for direct API calls).
 * Delegates to InsuranceExtractionEngine, then converts result to legacy format.
 */
export async function extractFromBuffer(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractionResult> {
  const resolvedMime = mimeType || getMimeFromExtension(fileName);

  try {
    const engineResult = await engineAnalyzeBuffer(fileBuffer, resolvedMime);
    return toLegacyResult(engineResult);
  } catch (error: any) {
    return {
      success: false,
      policies: [],
      confidence: 0,
      error: error.message || 'Unknown AI Extraction Error',
    };
  }
}

// ---------------------------------------------------------------------------
// Legacy Converter
// ---------------------------------------------------------------------------

function toLegacyResult(engineResult: import('./insurance-extraction-engine.js').InsuranceExtractionResult): ExtractionResult {
  if (!engineResult.success) {
    return {
      success: false,
      policies: [],
      confidence: 0,
      error: engineResult.error || 'Extraction failed',
      engineResult,
      qualityScore: engineResult.quality_score,
      version: engineResult.version,
    };
  }

  // Convert the engine's legacy_policies field (already mapped in the engine)
  const policies: ExtractedPolicy[] = engineResult.legacy_policies.length > 0
    ? engineResult.legacy_policies.map((p: any) => ({
        insurer: p.insurer || engineResult.insurer,
        policyNumber: p.policyNumber || engineResult.policy_number,
        policyHolder: p.policyHolder || null,
        insuredPersons: p.insuredPersons || [],
        premium: p.premium,
        premiumInterval: p.premiumInterval as 'monatlich' | 'jaehrlich' | null,
        coverage: p.coverage || [],
        deductible: p.deductible,
        model: p.model,
        startDate: p.startDate,
        endDate: p.endDate,
        documentType: mapLegacyDocType(engineResult.classification.document_type),
      }))
    : [];

  return {
    success: true,
    policies,
    confidence: engineResult.legacy_confidence,
    rawResponse: engineResult.raw_response,
    engineResult,
    qualityScore: engineResult.quality_score,
    version: engineResult.version,
    persons: engineResult.persons,
    products: engineResult.products,
  };
}

function mapLegacyDocType(docType: string): 'antrag' | 'police' | 'abrechnung' | 'unbekannt' {
  return DOC_TYPE_LEGACY_MAP[docType] || 'unbekannt';
}

// ---------------------------------------------------------------------------
// MIME Helper
// ---------------------------------------------------------------------------

function getMimeFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'tiff':
    case 'tif': return 'image/tiff';
    case 'bmp': return 'image/bmp';
    default: return 'application/octet-stream';
  }
}

export {
  engineAnalyzeDocument as analyzeDocumentEngine,
  engineAnalyzeBuffer as analyzeBufferEngine,
};
