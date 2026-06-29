// ============================================================================
// avaai Backend — AI Document Extraction Service
//
// Uses OpenAI SDK against aipi.coredy.ai (Ollama-compatible, model ava-nucl3us)
// to extract structured insurance data from uploaded documents (PDF, PNG, JPG).
//
// Flow:
//   1. Download file from S3 via presigned URL
//   2. Convert PDF first page to PNG (if PDF)
//   3. Send image as base64 to Vision API
//   4. Parse structured JSON response
//   5. Return typed ExtractionResult with confidence scores
// ============================================================================

import OpenAI from 'openai';
import { env } from '../config/env.js';
import { getFileUrl } from '../services/file-storage.js';

// ---------------------------------------------------------------------------
// Types
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
  confidence: number;           // overall confidence 0-1
  error?: string;
  rawResponse?: string;         // original AI response for debugging
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
      timeout: 60_000, // 60s timeout for vision requests
      maxRetries: 2,
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// System Prompt — Swiss Insurance Expert
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Du bist ein Schweizer Versicherungsexperte. Analysiere das gezeigte Versicherungsdokument und extrahiere alle relevanten Daten im JSON-Format.

Das Dokument ist ein PDF (erste Seite) oder Bild einer Versicherungspolice, eines Antrags oder einer Abrechnung aus der Schweiz.

Extrahiere folgende Felder als JSON-Array "policies" (auch wenn nur eine Police vorhanden ist):

- insurer: Versicherer-Name (z.B. "AXA", "SwissLife", "Mobiliar", "CSS", "Helsana", "Generali", "Allianz", "Zürich")
- policyNumber: Police-/Vertragsnummer
- policyHolder: Name der versicherten Hauptperson
- insuredPersons: Array aller versicherten Personen (auch Familienmitglieder)
- premium: Prämienbetrag in CHF (als Zahl, ohne Währungssymbol)
- premiumInterval: "monatlich" oder "jaehrlich"
- coverage: Array der versicherten Leistungen/Deckungen (z.B. ["Krankheitskosten", "Spital", "Zahn"])
- deductible: Franchise in CHF (als Zahl)
- model: Versicherungsmodell (z.B. "HMO", "Standard", "Hausarzt", "Telmed")
- startDate: Versicherungsbeginn als ISO-Datum (YYYY-MM-DD)
- endDate: Versicherungsende als ISO-Datum (YYYY-MM-DD, falls vorhanden)
- documentType: Typ des Dokuments ("antrag", "police", "abrechnung", "unbekannt")

Gib NUR das JSON-Objekt zurück, ohne zusätzlichen Text. Das Format:
{
  "policies": [...],
  "confidence": 0.95
}

confidence ist deine Einschätzung (0-1) wie zuverlässig die Extraktion ist.
Wenn du dir bei einem Feld unsicher bist, setze den Wert auf null.`;

// ---------------------------------------------------------------------------
// PDF → PNG Conversion (first page only)
// ---------------------------------------------------------------------------

/**
 * Convert first page of a PDF to PNG buffer.
 * Requires `pdftoppm` (poppler-utils) to be installed in the container.
 * Falls back to returning the raw buffer for non-PDF files.
 */
async function pdfToPngBuffer(pdfBuffer: Buffer): Promise<Buffer> {
  const { spawn } = await import('node:child_process');
  const { Readable } = await import('node:stream');

  return new Promise((resolve, reject) => {
    const proc = spawn('pdftoppm', [
      '-png',         // output as PNG
      '-r', '200',    // 200 DPI (good balance quality/size)
      '-f', '1',      // first page
      '-l', '1',      // last page (only first)
      '-singlefile',  // single file output
      '-scale-to', '1024', // max width
    ]);

    const chunks: Buffer[] = [];
    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on('data', (data: Buffer) => {
      // pdftoppm sometimes writes to stderr even on success
      // We only reject when the process exits with non-zero
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`pdftoppm exit code ${code}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });

    proc.on('error', (err) => {
      reject(new Error(`pdftoppm not available: ${err.message}. Install poppler-utils.`));
    });

    // Pipe PDF buffer to stdin
    const stdin = new Readable();
    stdin.push(pdfBuffer);
    stdin.push(null);
    stdin.pipe(proc.stdin);
  });
}

// ---------------------------------------------------------------------------
// Image to Base64 Data URL
// ---------------------------------------------------------------------------

function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

// ---------------------------------------------------------------------------
// Main Extraction Function
// ---------------------------------------------------------------------------

/**
 * Extract insurance document data from a file URL.
 *
 * @param fileKey  - S3 file key (orgId/uuid.ext)
 * @param mimeType - MIME type of the file (application/pdf, image/png, etc.)
 * @returns ExtractionResult with structured data
 */
export async function extractFromDocument(
  fileKey: string,
  mimeType: string,
): Promise<ExtractionResult> {
  const client = getClient();

  try {
    // 1. Get presigned download URL
    const fileUrl = await getFileUrl(fileKey, 300); // 5min expiry
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const fileBuffer = Buffer.from(await response.arrayBuffer());

    // 2. Convert to image if PDF
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

    // 3. Prepare image as data URL
    const imageDataUrl = bufferToDataUrl(imageBuffer, imageMimeType);

    // 4. Call AI Vision API
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
            {
              type: 'text',
              text: 'Extrahiere die Versicherungsdaten aus diesem Dokument im JSON-Format.',
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // low temperature for consistent extraction
      max_tokens: 4096,
    });

    const rawText = completion.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error('Empty response from AI model');
    }

    // 5. Parse JSON response
    const parsed = JSON.parse(rawText) as {
      policies?: ExtractedPolicy[];
      confidence?: number;
    };

    if (!parsed.policies || parsed.policies.length === 0) {
      return {
        success: false,
        policies: [],
        confidence: 0,
        error: 'Keine Versicherungsdaten im Dokument gefunden',
        rawResponse: rawText,
      };
    }

    return {
      success: true,
      policies: parsed.policies,
      confidence: parsed.confidence ?? 0.7,
      rawResponse: rawText,
    };
  } catch (error: any) {
    return {
      success: false,
      policies: [],
      confidence: 0,
      error: error.message,
    };
  }
}

/**
 * Extract from a file that's already in memory (for direct API calls).
 */
export async function extractFromBuffer(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractionResult> {
  // Determine MIME type from extension if not provided
  const resolvedMime = mimeType || getMimeFromExtension(fileName);

  // Use the same logic but bypass S3 download
  const client = getClient();

  try {
    let imageBuffer: Buffer;
    let imageMimeType: string;

    if (resolvedMime === 'application/pdf') {
      imageBuffer = await pdfToPngBuffer(fileBuffer);
      imageMimeType = 'image/png';
    } else if (resolvedMime.startsWith('image/')) {
      imageBuffer = fileBuffer;
      imageMimeType = resolvedMime;
    } else {
      throw new Error(`Unsupported file type: ${resolvedMime}`);
    }

    const imageDataUrl = bufferToDataUrl(imageBuffer, imageMimeType);

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
            {
              type: 'text',
              text: 'Extrahiere die Versicherungsdaten aus diesem Dokument im JSON-Format.',
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4096,
    });

    const rawText = completion.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('Empty response from AI model');

    const parsed = JSON.parse(rawText) as {
      policies?: ExtractedPolicy[];
      confidence?: number;
    };

    if (!parsed.policies || parsed.policies.length === 0) {
      return { success: false, policies: [], confidence: 0, error: 'Keine Daten gefunden', rawResponse: rawText };
    }

    return { success: true, policies: parsed.policies, confidence: parsed.confidence ?? 0.7, rawResponse: rawText };
  } catch (error: any) {
    return { success: false, policies: [], confidence: 0, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Helpers
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
