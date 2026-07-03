# Changelog

All notable changes to the **avaai Premium Broker** platform are documented here.

---

## [1.0.1] — 2026-07-03

### 🚀 Features

- **AI Document Extraction Pipeline** — Full end-to-end document intelligence:
  - BullMQ-based document worker (`document.worker.ts`) for background processing
  - AI extraction service (`ai-extraction.ts`) via `ava-nucl3us` model on `aipi.coredy.ai`
  - Document upload → S3 (MinIO/Exoscale) → Queue → AI Extraction → Database
  - New `POST /api/document/extract` endpoint and `POST /api/upload/file`
  - Frontend `DocumentExtractor.jsx` with extraction confidence indicators
  - Extraction confidence bar component (`ExtractionConfidenceBar.jsx`)

### 🔒 Security

- **XSS Seal** — All auth tokens moved from `localStorage` to `sessionStorage` (browser-sealed, XSS-safe). Removed old window-event-listener pattern.
- **CSP Hardening** — Added `style-src-elem` for Google Fonts, `font-src` for `fonts.gstatic.com` in Nginx config.
- Removed legacy `LoginPage.jsx` (dead code).

### 🐛 Bug Fixes

- **Frontend Build** — Fixed broken module imports after `kunden` module removal. Converted relative paths to `@/` alias paths.
- **Prisma Error Handling** — Added enum defaults for all 60 models, schema validation fixes.
- **57/58 POST Tests passing** — DossierSnapshot default value, AiReview optional, ComparisonEntry skipTenantFilter.

### 🧹 Chores

- **Cleanup** — Removed dev artifacts from repository:
  - `.playwright-mcp/` test snapshots
  - SvelteKit routes (`src/routes/`) — orphaned in React/Vite project
  - Dead code: SvelteKit-style API client, Prisma service stubs in frontend
  - Planning documents (`PLAN*.md`)
  - Duplicate lockfiles (`pnpm-lock.yaml`, `pnpm-workspace.yaml`)
- Added `/.playwright-mcp` to `.gitignore`
- Bumped root version `0.1.0` → `1.0.1`, backend version `1.0.0` → `1.0.1`
- PWA support: `manifest.json`, `favicon.svg` added

---

## [0.1.0] — 2026-06-28

### 🎉 Initial Release

- Multi-tenant CRM for insurance brokers (Customer 360, contracts, applications, tasks, documents, commissions)
- Customer self-service portal (contracts, applications, documents, profile)
- BullMQ job queues (email notifications, document processing pipeline)
- S3-compatible file storage (Exoscale SOS / MinIO)
- DSGVO/FINMA compliance (audit logging, RBAC, service-role access, data retention)
- Stripe payment integration
- Real-time updates via Socket.io
- Commission calculation engine
- Health insurance comparison module (Krankenkassenvergleich)
- Docker Compose stack: PostgreSQL 16, Redis 7, MinIO, MailHog, Nginx
- 59 Prisma models, ~60 enums — comprehensive Swiss insurance brokerage domain model
