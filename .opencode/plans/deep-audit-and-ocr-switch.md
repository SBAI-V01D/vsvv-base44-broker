# Deep Audit & OCR Switch Implementation Plan

## Phase 1: AI Model Switch (ava-nucl3us → ava:ocr) ✅ DONE
- `backend/.env`: `AI_MODEL=ava:ocr`
- `backend/src/config/env.ts`: default changed to `'ava:ocr'`
- Backend container restarted

## Phase 2: Documents Module Custom Routes
- `backend/src/modules/documents/documents.routes.ts` — Link/Unlink, Reclassify, Bulk Archive, Stats, Per-Customer
- Register in `backend/src/app.ts`

## Phase 3: Deep Audit & Scan
- `backend/src/services/deep-audit-engine.ts` — Scanner Engine
- `backend/src/workers/audit.worker.ts` — BullMQ worker
- `backend/src/modules/audit/audit.routes.ts` — Scan trigger/report endpoints
- `src/pages/EnterpriseAudit.jsx` — Frontend dashboard

## Phase 4: Verification
- TypeScript check (backend)
- Frontend build
- Docker rolling update
- Smoke test
- Git commit
