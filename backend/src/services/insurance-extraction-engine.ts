// ============================================================================
// VSVV Premium Broker — InsuranceExtractionEngine v1.0.0
//
// SINGLE SOURCE OF TRUTH for all document intelligence in the VSVV system.
//
// Rules:
//   1.  Strict extraction — only what is visible in the document
//   2.  Evidence-first — every extracted value must have supporting evidence
//   3.  Per-field confidence — no blanket confidence score
//   4.  Person + role separation — each person extracted individually
//   5.  Product separation — each product is its own record
//   6.  KVG / VVG strict differentiation
//   7.  No auto-completion of missing values
//   8.  Quality scoring for every extraction
//   9.  Version metadata for full traceability
// ============================================================================

import OpenAI from 'openai';
import { env } from '../config/env.js';
import { getFileUrl, getFileBuffer } from '../services/file-storage.js';

// ============================================================================
// VERSION CONSTANTS
// ============================================================================

export const ENGINE_VERSION = '1.0.0';
export const PROMPT_VERSION = 'insurance-strict-v1';
export const SCHEMA_VERSION = 'insurance-schema-v1';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractionEvidence {
  field: string;
  value: string | number | null;
  source_text: string | null;
  page: number | null;
  confidence: number;
}

export interface ExtractedPerson {
  person_name: string;
  roles: string[];
  birthdate: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip_code: string | null;
  city: string | null;
  ahv_number: string | null;
  nationality: string | null;
  confidence: number;
  evidence: ExtractionEvidence[];
}

export interface ExtractedProduct {
  product_name: string | null;
  insurance_type: 'kvg' | 'vvg' | 'leben' | 'sach' | 'haftpflicht' | 'motor' | 'unfall' | 'rechtsschutz' | 'bvg' | 'sonstige' | null;
  coverage_type: string | null;
  insured_person: string | null;
  premium_amount: number | null;
  premium_frequency: 'monatlich' | 'jaehrlich' | 'einmalig' | null;
  deductible: number | null;
  model: string | null;
  start_date: string | null;
  end_date: string | null;
  cancellation_deadline: string | null;
  confidence: number;
  evidence: ExtractionEvidence[];
}

export type DocumentType =
  | 'police'
  | 'offerte'
  | 'antrag'
  | 'neuantrag'
  | 'aenderungsantrag'
  | 'erneuerungsantrag'
  | 'praemienrechnung'
  | 'leistungsabrechnung'
  | 'korrespondenz'
  | 'kuendigung'
  | 'vertragsaenderung'
  | 'versicherungsnachweis'
  | 'unbekannt';

export type PersonRole =
  | 'Versicherungsnehmer'
  | 'versicherte Person'
  | 'Praemienzahler'
  | 'Antragsteller'
  | 'Ehepartner'
  | 'Kind'
  | 'gesetzlicher Vertreter'
  | 'Kontaktperson';

export interface DocumentClassification {
  document_type: DocumentType;
  document_type_confidence: number;
  document_type_evidence: ExtractionEvidence[];
}

export interface CustomerMatchResult {
  matched_customer_id: string | null;
  match_confidence: number;
  match_reasons: string[];
  requires_confirmation: boolean;
}

export interface ExtractionQualityScore {
  quality_score: number;
  status: 'high_quality' | 'review_recommended' | 'manual_review_required';
  warnings: string[];
}

export interface ExtractionVersion {
  extraction_engine_version: string;
  prompt_version: string;
  schema_version: string;
  model_version: string;
  timestamp: string;
}

export interface InsuranceExtractionResult {
  success: boolean;
  error?: string;

  classification: DocumentClassification;
  persons: ExtractedPerson[];
  products: ExtractedProduct[];

  insurer: string | null;
  policy_number: string | null;
  application_number: string | null;

  premium_total_monthly: number | null;
  premium_total_yearly: number | null;

  coverage_confidence: 'confirmed' | 'requires_review';

  quality_score: ExtractionQualityScore;
  version: ExtractionVersion;

  raw_response?: string;

  // Legacy compatibility map (for phased migration)
  legacy_policies: Array<Record<string, unknown>>;
  legacy_confidence: number;
}

// ---------------------------------------------------------------------------
// OpenAI Client
// ---------------------------------------------------------------------------

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: env.AI_BASE_URL,
      apiKey: env.AI_API_KEY,
      timeout: 300_000,
      maxRetries: 3,
    });
  }
  return _client;
}

// ============================================================================
// STRICT SYSTEM PROMPT
// ============================================================================

// Build once to avoid repeated string concatenation
function buildSystemPrompt(): string {
  return [
    '# ROLLE',
    'Du bist ein Schweizer Versicherungsexperte für revisionssichere Dokumentenextraktion.',
    'Deine Aufgabe ist es, NUR Informationen aus dem Dokument zu extrahieren, die dort tatsächlich sichtbar sind.',
    '',
    '# STRICT MODUS',
    '- Extrahiere NUR Informationen, die im Dokument eindeutig belegbar sind.',
    '- Fehlende Werte IMMER auf null setzen — NIEMALS ergänzen, raten oder hochrechnen.',
    '- Keine Produkte erfinden, die nicht explizit genannt sind.',
    '- Keine Deckungen vermuten.',
    '- Keine Versicherungsmodelle erraten.',
    '- Keine Personenrollen ohne Evidence vergeben.',
    '- Keine Familienbeziehungen frei interpretieren.',
    '- Keine Prämien hochrechnen (Monat → Jahr oder umgekehrt).',
    '- Keine nicht sichtbaren Vertragsdaten ergänzen.',
    '',
    '# EVIDENCE-PFLICHT',
    'Jeder extrahierte Wert MUSS source_text enthalten — das exakte Zitat aus dem Dokument.',
    'Wenn source_text nicht ermittelbar ist, setze confidence = 0.',
    'Pflichtfelder für Evidence (wenn vorhanden):',
    '- Name, Geburtsdatum, Versicherer, Policennummer, Antragsnummer',
    '- Produktname, Prämie, Franchise, Versicherungsmodell, Deckung',
    '- Vertragsbeginn, Vertragsende, Kündigungsfrist',
    '',
    '# DOKUMENTKLASSIFIKATION',
    'Erkenne den Dokumenttyp anhand des Inhalts:',
    '- police: Versicherungspolice mit Policennummer und Vertragsbedingungen',
    '- offerte: Angebot oder Offerte (noch nicht abgeschlossen)',
    '- antrag: Allgemeiner Antrag',
    '- neuantrag: Neuantrag für eine neue Versicherung',
    '- aenderungsantrag: Änderung eines bestehenden Vertrags',
    '- erneuerungsantrag: Verlängerung/Erneuerung',
    '- praemienrechnung: Rechnung oder Zahlungsaufforderung',
    '- leistungsabrechnung: Abrechnung erbrachter Leistungen',
    '- korrespondenz: Allgemeiner Brief oder Mitteilung',
    '- kuendigung: Kündigungsschreiben',
    '- vertragsaenderung: Vertragsänderung',
    '- versicherungsnachweis: Bestätigung über bestehenden Versicherungsschutz',
    '- unbekannt: Wenn der Typ nicht eindeutig bestimmbar ist',
    '',
    '# PERSONEN- UND ROLLEN-EXTRAKTION',
    'Jede im Dokument genannte Person separat extrahieren.',
    'Mögliche Rollen: Versicherungsnehmer, versicherte Person, Praemienzahler, Antragsteller, Ehepartner, Kind, gesetzlicher Vertreter, Kontaktperson.',
    'Eine Person kann mehrere Rollen haben.',
    'Rollen NUR vergeben wenn:',
    '1. ausdrücklich im Dokument genannt ODER',
    '2. aus eindeutiger Dokumentstruktur hervorgehend (z.B. Spalte "Versicherte Person")',
    '',
    '# PRODUKT-EXTRAKTION',
    'Jedes Versicherungsprodukt separat extrahieren — KEINE Zusammenfassung.',
    'Beispiel Krankenversicherung:',
    '- Person 1: KVG Grundversicherung (eigenes Produkt)',
    '- Person 1: VVG Zusatzversicherung 1 (eigenes Produkt)',
    '- Person 1: VVG Zusatzversicherung 2 (eigenes Produkt)',
    '- Person 2: KVG Grundversicherung (eigenes Produkt)',
    '',
    '# KVG / VVG LOGIK',
    'KVG: Grundversicherung, Versicherungsmodell, Franchise, Unfalldeckung, monatliche Prämie',
    'VVG: ambulante Zusatzversicherung, Spitalversicherung, Zahnversicherung, Kapitalversicherung, weitere Zusatzprodukte',
    'VVG-Produkte NICHT aus Produktnamen ableiten — nur extrahieren wenn im Dokument belegt.',
    '',
    '# CONFIDENCE REGELN',
    '- confidence = 1.0: Wert steht exakt so im Dokument',
    '- confidence = 0.8-0.99: Wert klar erkennbar, kleine Unsicherheit (z.B. OCR)',
    '- confidence = 0.5-0.79: Wert erkennbar aber nicht 100% sicher',
    '- confidence = 0.1-0.49: Schwache Indizien, eher raten',
    '- confidence = 0: Wert nicht vorhanden / erfunden',
    'Eine Deckung gilt nur als bestätigt wenn confidence >= 0.90.',
    '',
    '# QUALITÄT',
    '- Dokumentqualität (erkennbar an OCR/Lesbarkeit)',
    '- Anteil belegter Felder',
    '- Durchschnittliche Confidence',
    '- Widersprüchliche Daten',
    '',
    'Antworte NUR mit dem JSON-Objekt. Kein zusätzlicher Text.',
  ].join('\n');
}

const SYSTEM_PROMPT = buildSystemPrompt();

// ============================================================================
// USER PROMPT BUILDER
// ============================================================================

const USER_PROMPT = `Extrahiere die Versicherungsdaten aus diesem Dokument im strikten JSON-Format.

WICHTIG:
- NUR Informationen extrahieren die im Dokument sichtbar sind
- Jeder Wert muss source_text als Beleg haben
- Fehlende Felder auf null setzen
- Jedes Produkt einzeln aufführen
- Personen inklusive aller Rollen extrahieren`;

// ============================================================================
// JSON SCHEMA for structured output
// ============================================================================

const JSON_SCHEMA: OpenAI.ChatCompletionCreateParams['response_format'] = {
  type: 'json_object',
};

// ============================================================================
// MAIN EXTRACTION ENGINE
// ============================================================================

/**
 * Analyze a document from a file key (S3/MinIO).
 */
export async function analyzeDocument(
  fileKey: string,
  mimeType: string,
): Promise<InsuranceExtractionResult> {
  const fileUrl = await getFileUrl(fileKey, 300);
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const fileBuffer = Buffer.from(await response.arrayBuffer());
  return analyzeBuffer(fileBuffer, mimeType);
}

/**
 * Analyze a document from an in-memory buffer.
 */
export async function analyzeBuffer(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<InsuranceExtractionResult> {
  const client = getClient();
  const startTime = Date.now();

  try {
    let imageBuffer: Buffer;
    let imageMimeType: string;

    if (mimeType === 'application/pdf') {
      imageBuffer = await pdfToPngBuffer(fileBuffer);
      imageMimeType = 'image/png';
    } else if (mimeType.startsWith('image/')) {
      imageBuffer = fileBuffer;
      imageMimeType = mimeType;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const base64 = imageBuffer.toString('base64');
    const imageDataUrl = `data:${imageMimeType};base64,${base64}`;

    const completion = await client.chat.completions.create({
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageDataUrl, detail: 'high' },
            },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
      response_format: JSON_SCHEMA,
      temperature: 0.1,
      max_tokens: 8192,
    });

    const rawText = completion.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('Empty response from AI model');
    }

    const jsonText = stripMarkdownFence(rawText);
    const parsed = JSON.parse(jsonText);

    return buildResult(parsed, rawText, startTime);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown AI Extraction Error',
      classification: {
        document_type: 'unbekannt',
        document_type_confidence: 0,
        document_type_evidence: [],
      },
      persons: [],
      products: [],
      insurer: null,
      policy_number: null,
      application_number: null,
      premium_total_monthly: null,
      premium_total_yearly: null,
      coverage_confidence: 'requires_review',
      quality_score: { quality_score: 0, status: 'manual_review_required', warnings: ['Extraction failed'] },
      version: buildVersion(),
      legacy_policies: [],
      legacy_confidence: 0,
    };
  }
}

// ============================================================================
// RESULT BUILDER
// ============================================================================

function buildVersion(): ExtractionVersion {
  return {
    extraction_engine_version: ENGINE_VERSION,
    prompt_version: PROMPT_VERSION,
    schema_version: SCHEMA_VERSION,
    model_version: env.AI_MODEL,
    timestamp: new Date().toISOString(),
  };
}

function buildResult(
  parsed: Record<string, any>,
  rawText: string,
  startTime: number,
): InsuranceExtractionResult {
  // --- Classification ---
  const docType = parsed.document_type || 'unbekannt';
  const classification: DocumentClassification = {
    document_type: validateDocType(docType),
    document_type_confidence: clamp(parsed.document_type_confidence ?? 0, 0, 1),
    document_type_evidence: parseEvidenceArray(parsed.document_type_evidence),
  };

  // --- Persons ---
  const persons: ExtractedPerson[] = (parsed.persons || []).map((p: any) => ({
    person_name: p.person_name || null,
    roles: Array.isArray(p.roles) ? p.roles.filter(validateRole) : [],
    birthdate: p.birthdate || null,
    email: p.email || null,
    phone: p.phone || null,
    street: p.street || null,
    zip_code: p.zip_code || null,
    city: p.city || null,
    ahv_number: p.ahv_number || null,
    nationality: p.nationality || null,
    confidence: clamp(p.confidence ?? 0, 0, 1),
    evidence: parseEvidenceArray(p.evidence),
  }));

  // --- Products ---
  const products: ExtractedProduct[] = (parsed.products || []).map((p: any) => ({
    product_name: p.product_name || null,
    insurance_type: validateInsuranceType(p.insurance_type),
    coverage_type: p.coverage_type || null,
    insured_person: p.insured_person || null,
    premium_amount: safeNumber(p.premium_amount),
    premium_frequency: validateFrequency(p.premium_frequency),
    deductible: safeNumber(p.deductible),
    model: p.model || null,
    start_date: p.start_date || null,
    end_date: p.end_date || null,
    cancellation_deadline: p.cancellation_deadline || null,
    confidence: clamp(p.confidence ?? 0, 0, 1),
    evidence: parseEvidenceArray(p.evidence),
  }));

  // --- Insurer / Policy ---
  const insurer = parsed.insurer || null;
  const policy_number = parsed.policy_number || null;
  const application_number = parsed.application_number || null;

  // --- Premiums ---
  const premium_total_monthly = safeNumber(parsed.premium_total_monthly);
  const premium_total_yearly = safeNumber(parsed.premium_total_yearly);

  // --- Coverage confidence ---
  const avgProductConf = products.length > 0
    ? products.reduce((s, p) => s + p.confidence, 0) / products.length
    : 0;
  const coverage_confidence: 'confirmed' | 'requires_review' =
    avgProductConf >= 0.90 ? 'confirmed' : 'requires_review';

  // --- Quality score ---
  const quality_score = calculateQualityScore(classification, persons, products);

  // --- Legacy compatibility ---
  const legacy_policies = products.map((p) => ({
    insurer,
    policyNumber: policy_number,
    policyHolder: persons.find(pr => pr.roles.includes('Versicherungsnehmer'))?.person_name || null,
    insuredPersons: persons.filter(pr => pr.roles.includes('versicherte Person')).map(pr => pr.person_name),
    premium: p.premium_amount,
    premiumInterval: p.premium_frequency === 'jaehrlich' ? 'jaehrlich' : 'monatlich',
    coverage: p.coverage_type ? [p.coverage_type] : [],
    deductible: p.deductible,
    model: p.model,
    startDate: p.start_date,
    endDate: p.end_date,
    documentType: classification.document_type,
    product: p.product_name,
    sparte: p.insurance_type,
    premium_monthly: p.premium_frequency === 'monatlich' ? p.premium_amount : null,
    premium_yearly: p.premium_frequency === 'jaehrlich' ? p.premium_amount : null,
    product_short: p.product_name,
    coverage_summary: p.coverage_type,
    franchise: p.deductible,
    confidence: p.evidence.reduce((s, e) => s + e.confidence, 0) / Math.max(p.evidence.length, 1),
  }));

  const legacy_confidence = products.length > 0
    ? products.reduce((s, p) => s + p.confidence, 0) / products.length
    : classification.document_type_confidence;

  return {
    success: true,
    classification,
    persons,
    products,
    insurer,
    policy_number,
    application_number,
    premium_total_monthly,
    premium_total_yearly,
    coverage_confidence,
    quality_score,
    version: buildVersion(),
    raw_response: rawText,
    legacy_policies,
    legacy_confidence,
  };
}

// ============================================================================
// QUALITY SCORE CALCULATOR
// ============================================================================

function calculateQualityScore(
  classification: DocumentClassification,
  persons: ExtractedPerson[],
  products: ExtractedProduct[],
): ExtractionQualityScore {
  const warnings: string[] = [];

  // Classification quality
  const classConf = classification.document_type_confidence;
  if (classification.document_type === 'unbekannt') {
    warnings.push('Dokumenttyp nicht eindeutig erkennbar');
  }
  if (classConf < 0.7) {
    warnings.push('Dokumentklassifikation unsicher');
  }

  // Person quality
  if (persons.length === 0) {
    warnings.push('Keine Personen extrahiert');
  }
  const avgPersonConf = persons.length > 0
    ? persons.reduce((s, p) => s + p.confidence, 0) / persons.length
    : 0;
  if (avgPersonConf < 0.7 && persons.length > 0) {
    warnings.push('Personenerkennung unsicher');
  }

  // Product quality
  if (products.length === 0) {
    warnings.push('Keine Produkte extrahiert');
  }
  const avgProductConf = products.length > 0
    ? products.reduce((s, p) => s + p.confidence, 0) / products.length
    : 0;
  if (avgProductConf < 0.7 && products.length > 0) {
    warnings.push('Produkterkennung unsicher');
  }

  // Evidence quality
  const allEvidence = [
    ...classification.document_type_evidence,
    ...persons.flatMap(p => p.evidence),
    ...products.flatMap(p => p.evidence),
  ];
  const evidenceWithSource = allEvidence.filter(e => e.source_text);
  if (allEvidence.length > 0 && evidenceWithSource.length / allEvidence.length < 0.5) {
    warnings.push('Weniger als 50% der Werte haben Quelltext-Belege');
  }

  // Contradiction detection
  const productNames = new Set(products.map(p => p.product_name).filter(Boolean));
  if (productNames.size > 0 && productNames.size < products.length) {
    warnings.push('Produktnamen nicht eindeutig');
  }

  // Score
  const scores: number[] = [];
  scores.push(classConf * 100);
  if (persons.length > 0) scores.push(avgPersonConf * 100);
  if (products.length > 0) scores.push(avgProductConf * 100);
  scores.push(Math.min(100, (allEvidence.length / Math.max(persons.length + products.length, 1)) * 50));

  const rawScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  const quality_score = clamp(Math.round(rawScore), 0, 100);

  let status: 'high_quality' | 'review_recommended' | 'manual_review_required';
  if (quality_score >= 90) {
    status = 'high_quality';
  } else if (quality_score >= 75) {
    status = 'review_recommended';
  } else {
    status = 'manual_review_required';
  }

  return { quality_score, status, warnings };
}

// ============================================================================
// PDF → PNG CONVERSION
// ============================================================================

async function pdfToPngBuffer(pdfBuffer: Buffer): Promise<Buffer> {
  async function tryConvert(args: string[]): Promise<Buffer> {
    const { spawn } = await import('node:child_process');
    const { Readable } = await import('node:stream');
    return new Promise((resolve, reject) => {
      const proc = spawn('pdftoppm', args);
      const chunks: Buffer[] = [];
      let stderr = '';
      proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
      proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`pdftoppm exit code ${code}: ${stderr}`));
          return;
        }
        resolve(Buffer.concat(chunks));
      });
      proc.on('error', (err) => {
        reject(new Error(`pdftoppm not available: ${err.message}. Install poppler-utils.`));
      });
      const stdin = new Readable();
      stdin.push(pdfBuffer);
      stdin.push(null);
      stdin.pipe(proc.stdin);
    });
  }
  try {
    return await tryConvert([
      '-png', '-r', '200', '-f', '1', '-l', '1',
      '-singlefile', '-scale-to', '1024', '-auto-rotate',
    ]);
  } catch {
    return tryConvert([
      '-png', '-r', '150', '-f', '1', '-l', '1',
      '-singlefile', '-scale-to', '1024',
    ]);
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const KNOWN_DOC_TYPES: Set<string> = new Set([
  'police', 'offerte', 'antrag', 'neuantrag', 'aenderungsantrag',
  'erneuerungsantrag', 'praemienrechnung', 'leistungsabrechnung',
  'korrespondenz', 'kuendigung', 'vertragsaenderung',
  'versicherungsnachweis', 'unbekannt',
]);

const KNOWN_ROLES: Set<string> = new Set([
  'Versicherungsnehmer', 'versicherte Person', 'Praemienzahler',
  'Antragsteller', 'Ehepartner', 'Kind', 'gesetzlicher Vertreter',
  'Kontaktperson',
]);

const KNOWN_INSURANCE_TYPES: Set<string> = new Set([
  'kvg', 'vvg', 'leben', 'sach', 'haftpflicht', 'motor', 'unfall',
  'rechtsschutz', 'bvg', 'sonstige',
]);

const KNOWN_FREQUENCIES: Set<string> = new Set(['monatlich', 'jaehrlich', 'einmalig']);

function validateDocType(v: string): DocumentType {
  const lower = v?.toLowerCase().trim() || 'unbekannt';
  return KNOWN_DOC_TYPES.has(lower) ? lower as DocumentType : 'unbekannt';
}

function validateRole(v: string): v is PersonRole {
  return KNOWN_ROLES.has(v);
}

function validateInsuranceType(v: string | null): ExtractedProduct['insurance_type'] {
  if (!v) return null;
  const lower = v.toLowerCase().trim();
  return KNOWN_INSURANCE_TYPES.has(lower) ? lower as ExtractedProduct['insurance_type'] : 'sonstige';
}

function validateFrequency(v: string | null): ExtractedProduct['premium_frequency'] {
  if (!v) return null;
  const lower = v.toLowerCase().trim();
  return KNOWN_FREQUENCIES.has(lower) ? lower as ExtractedProduct['premium_frequency'] : null;
}

function parseEvidenceArray(arr: any): ExtractionEvidence[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((e: any) => ({
    field: e.field || '',
    value: e.value ?? null,
    source_text: e.source_text || null,
    page: e.page != null ? Number(e.page) : null,
    confidence: clamp(e.confidence ?? 0, 0, 1),
  }));
}

function safeNumber(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function stripMarkdownFence(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
}

// ============================================================================
// CUSTOMER MATCHER (stateless, post-extraction)
// ============================================================================

/**
 * Match extracted persons against existing CRM customers.
 * This is called AFTER stateless extraction — never before.
 * Matching is conservative: never auto-assign based on name alone.
 */
export function matchCustomer(
  persons: ExtractedPerson[],
  customers: Array<{
    id: string;
    customer_number?: string | null;
    first_name?: string;
    last_name?: string;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    street?: string | null;
    zip_code?: string | null;
    city?: string | null;
    birthdate?: Date | string | null;
  }>,
): CustomerMatchResult {
  if (persons.length === 0 || customers.length === 0) {
    return {
      matched_customer_id: null,
      match_confidence: 0,
      match_reasons: [],
      requires_confirmation: true,
    };
  }

  const matchReasons: string[] = [];
  let bestScore = 0;
  let bestId: string | null = null;

  for (const person of persons) {
    for (const customer of customers) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Customer number match
      if (customer.customer_number && person.evidence.some(e => e.value === customer.customer_number)) {
        score = 100;
        reasons.push('Kundennummer stimmt überein');
      }

      // 2. Email match
      if (customer.email && person.email && customer.email.toLowerCase() === person.email.toLowerCase()) {
        score = Math.max(score, 95);
        reasons.push('E-Mail-Adresse stimmt überein');
      }

      // 3. Phone match
      const phoneFields = [customer.phone, customer.mobile].filter(Boolean).map(p => p?.replace(/\s+/g, ''));
      const personPhone = person.phone?.replace(/\s+/g, '');
      if (personPhone && phoneFields.some(p => p === personPhone)) {
        score = Math.max(score, 95);
        reasons.push('Telefonnummer stimmt überein');
      }

      // 4. Name + Birthdate
      const personNameLower = person.person_name?.toLowerCase() || '';
      const custNameLower = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase().trim();
      const nameMatch = personNameLower.includes(custNameLower) || custNameLower.includes(personNameLower);

      if (nameMatch && customer.birthdate && person.birthdate) {
        const normPersonBd = person.birthdate.replace(/-/g, '');
        const normCustBd = typeof customer.birthdate === 'string'
          ? customer.birthdate.replace(/-/g, '')
          : customer.birthdate instanceof Date
            ? customer.birthdate.toISOString().slice(0, 10).replace(/-/g, '')
            : '';
        if (normPersonBd === normCustBd) {
          score = Math.max(score, 90);
          reasons.push('Name + Geburtsdatum stimmen überein');
        }
      }

      // 5. Full address match
      if (nameMatch && customer.street && person.street && customer.zip_code && person.zip_code) {
        if (customer.street.toLowerCase().includes(person.street.toLowerCase()) &&
            customer.zip_code === person.zip_code) {
          score = Math.max(score, 85);
          reasons.push('Name + Adresse stimmen überein');
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestId = customer.id;
        matchReasons.length = 0;
        matchReasons.push(...reasons);
      }
    }
  }

  // Name-only matches (no other fields) are never auto-assigned
  const requiresConfirmation = bestScore < 90 || customers.length === 0;

  return {
    matched_customer_id: bestId,
    match_confidence: bestScore,
    match_reasons: matchReasons,
    requires_confirmation: requiresConfirmation,
  };
}

export default {
  analyzeDocument,
  analyzeBuffer,
  matchCustomer,
  ENGINE_VERSION,
  PROMPT_VERSION,
  SCHEMA_VERSION,
};
