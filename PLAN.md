# PLAN: AI Document Tensorract — KI-Dokumenten-Extraktion

**Stand:** 2026-06-28
**Status:** Genehmigt → Implementierung läuft
**AI-Endpoint:** `https://aipi.coredy.ai/ollama/v1/` — Model: `ava-nucl3us`
**SDK:** OpenAI (openai npm package)

---

## 1. PROBLEM

Versicherungsdokument (PDF/PNG/JPG) werde hochglade, aber **kein AI-Extraction-Prozess** existiert im Backend. D'Frontend-Seite `DocumentExtractor.jsx` rüeft externi Functions uf (`avaai.functions.invoke('extractInsuranceDocument')`), wo nie implementiert worde sind.

**Fehlend:**
- AI-Pipeline: Upload → Queue → Extraction → DB
- BullMQ Document Worker (nume `.gitkeep`)
- Strukturierte Extraktion vo Versicherungsdaten (Versicherer, Police-Nr., Prämie, Deckung)

---

## 2. LÖSUNG — ARCHITEKTUR

```
📄 Frontend Upload      🪣 S3 (MinIO)        📨 BullMQ Queue
      │                      │                     │
      ├── POST /api/upload/file ──→ S3 ──→ Document record (stage: uploaded)
      │                                           │
      └── POST /api/document/extract ─────────────┘
                                                      ↓
                                   🧠 Worker: document.worker.ts
                                      (konsumiert avaai:document Queue)
                                                      ↓
                              ┌─────────────────────────────────┐
                              │  ai-extraction.ts Service       │
                              │  • OpenAI SDK → aipi.coredy.ai  │
                              │  • Model: ava-nucl3us           │
                              │  • Vision: PDF→Image→Base64     │
                              │  • Prompt: Schweizer KV/VVG     │
                              │  • Structured JSON Output       │
                              └─────────────────────────────────┘
                                                      ↓
                              💾 DB Updates:
                              • Document.extracted_data (Json?)
                              • Document.processing_stage → parsed
                              • ExtractionCorrectionLog (Review-Trail)
                              • Socket.io Event → Frontend
```

---

## 3. PHASEN

### Phase 1: Backend Core

| # | Datei | Beschrieb |
|---|-------|-----------|
| 1.0 | `backend/package.json` | `openai` installiere |
| 1.1 | `backend/src/services/ai-extraction.ts` | **NEU** — OpenAI Vision Extraction + JSON Mode |
| 1.2 | `backend/src/workers/document.worker.ts` | **NEU** — BullMQ Worker für Document Queue |
| 1.3 | `backend/src/modules/document/document.routes.ts` | **NEU** — `POST /api/document/extract`, Status, Batch |
| 1.4 | `backend/src/modules/functions/functions.routes.ts` | **EDIT** — `extractInsuranceDocument` etc. intern registriere |
| 1.5 | `backend/src/app.ts` | **EDIT** — Worker starte, Routes registriere |
| 1.6 | `backend/prisma/schema.prisma` | **EDIT** — `Document.extracted_data Json?` |

### Phase 2: Infra

| # | Datei | Beschrieb |
|---|-------|-----------|
| 2.0 | `backend/.env.example` | `AI_API_KEY` + `AI_BASE_URL` + `AI_MODEL` ergänze |
| 2.1 | `backend/Dockerfile` | `poppler-utils` für PDF→Image |

### Phase 3: Frontend

| # | Datei | Beschrieb |
|---|-------|-----------|
| 3.0 | `src/pages/DocumentExtractor.jsx` | **EDIT** — API-Calls uf interni Endpunkte |
| 3.1 | `src/components/extraction/ExtractionReviewPanel.jsx` | **NEU** — Korrektur-UI |
| 3.2 | `src/components/extraction/ExtractionConfidenceBar.jsx` | **NEU** — Konfidenz-Visualisierung |

---

## 4. DETAILS — AI EXTRACTION SERVICE

```typescript
// Model: ava-nucl3us
// Base URL: https://aipi.coredy.ai/ollama/v1/

interface ExtractionResult {
  insurer?: string;           // Versicherer (z.B. "AXA", "SwissLife")
  policyNumber?: string;      // Police-Nummer
  policyHolder?: string;      // Versicherte Person
  premium?: number;           // Prämie (CHF)
  premiumInterval?: string;   // monatlich / jährlich
  coverage?: string[];        // Deckungsarten
  deductible?: number;        // Franchise
  model?: string;             // Modell (z.B. "HMO", "Standard")
  startDate?: string;         // Versicherungsbeginn
  endDate?: string;           // Versicherungsende
  documentType?: string;      // antrag / police / abrechnung
  confidence: number;         // Gesamt-Konfidenz 0-1
  rawResponse?: string;       // Original AI-Response für Debug
}
```

### Prompt Strategie
- System-Prompt: Schweizer Versicherungsexperte
- Dokument als base64 Image (erschti Site) + fileType
- JSON Mode (response_format: { type: "json_object" })
- Confidence-Score pro extrahiertem Feld
- Fallback: Falls Vision fehlschlaht → Retry mit 3 Versuche

---

## 5. DATEI-LISTE (VOLLSTÄNDIG)

| Datei | Aktion |
|-------|--------|
| `PLAN.auth-flow-repair.done.md` | **RENAME** — Alti Plan-Datei |
| `PLAN.md` | **NEU** — Das Dokument |
| `backend/package.json` | **EDIT** — `openai` dependency |
| `backend/src/services/ai-extraction.ts` | **NEU** |
| `backend/src/workers/document.worker.ts` | **NEU** |
| `backend/src/modules/document/document.routes.ts` | **NEU** |
| `backend/src/modules/functions/functions.routes.ts` | **EDIT** |
| `backend/src/app.ts` | **EDIT** |
| `backend/prisma/schema.prisma` | **EDIT** — `extracted_data` Feld |
| `backend/.env.example` | **EDIT** |
| `backend/Dockerfile` | **EDIT** |
| `src/pages/DocumentExtractor.jsx` | **EDIT** |
| `src/components/extraction/ExtractionReviewPanel.jsx` | **NEU** |
| `src/components/extraction/ExtractionConfidenceBar.jsx` | **NEU** |

---

## 6. EXIT CRITERIA

- [ ] PDF/PNG/JPG Upload → Automatische AI Extraction via aipi.coredy.ai
- [ ] Versicherer + Police-Nr. + Prämie korrekt extrahiert
- [ ] BullMQ Retry (3x) bi API-Fehler
- [ ] Socket.io Live-Update Frontend
- [ ] Manuelli Korrektur via ReviewPanel
- [ ] Konfidenz-Score pro Feld
- [ ] `extractInsuranceDocument` → interner Handler
