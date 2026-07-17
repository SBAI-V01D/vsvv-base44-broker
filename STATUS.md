# VSVV Premium Broker — Project Status

Generated: 2026-07-17T13:58:00Z
Commit: `c314be1`
Tags: `v0.1.0`, `v1.0.0-endpoint-fix`, `v1.0.1`, `v1.0.2`, `v1.1.0-schema-fix`, `v1.2.0-ui-forms`

---

## Infrastructure (Docker)

| Service | Container | Status | Port |
|---|---|---|---|
| Frontend (React/Vite) | avaai-frontend | ✅ Up | 3004 |
| Backend (Fastify 5) | avaai-backend | ✅ Healthy | 3003 |
| PostgreSQL 16 | vsvv-db | ✅ Healthy | 5432 |
| Redis 7 (BullMQ) | avaai-redis | ✅ Healthy | 6379 |
| MinIO (S3) | avaai-minio | ✅ Healthy | 9000-9001 |
| MailHog (SMTP) | avaai-mailhog | ✅ Healthy | 1025/8025 |

---

## Backend Architecture

### Tech Stack
- **Runtime:** Node.js 22, TypeScript 5.9
- **Framework:** Fastify 5
- **ORM:** Prisma 6 (PostgreSQL 16)
- **Queue:** BullMQ 5 (Redis)
- **Storage:** MinIO (S3-compatible)
- **AI:** OpenAI-compatible API (`aipi.coredy.ai`)
- **Auth:** JWT (fastify-jwt) + RBAC

### Module Overview (20 Backend Modules)

| Module | Status | CRUD | Custom Routes |
|---|---|---|---|
| `admin` | ✅ | Entity Registry | Admin operations |
| `applications` | ✅ | Entity Registry + Factory | Status transitions, auto-contract, stats |
| `audit` | ✅ | Entity Registry | Search, Compliance-Check, **Deep Scan** |
| `auth` | ✅ | Custom | Login, Register, Refresh, Reset |
| `backup` | ✅ | Entity Registry | Backup management |
| `commissions` | ✅ | Entity Registry | Commission entries, splits |
| `contracts` | ✅ | Entity Registry + Factory | Renewal, Cancellation, Upsell, Dashboard |
| `customers` | ✅ | Entity Registry + Factory | Stats, family, timeline |
| `document` | ✅ | Custom | Extraction trigger, status, batch |
| **`documents`** | ✅ **NEW** | Custom | **Link, reclassify, bulk ops, stats** |
| `enterprise` | ✅ | Entity Registry | Incidents, improvements |
| `functions` | ✅ | Custom | Serverless function invocations |
| `health` | ✅ | Custom | Health check endpoint |
| `integrations` | ✅ | Entity Registry | External integrations |
| `krankenkassen` | ✅ | Entity Registry | Insurance comparisons |
| `leads` | ✅ | Entity Registry + Factory | Autopilot, offers |
| `portal` | ✅ | Custom | Customer portal |
| `tasks` | ✅ | Entity Registry + Factory | Task management |
| `upload` | ✅ | Custom | File upload/download |
| `verkaufschancen` | ✅ | Entity Registry | Sales opportunities |

### Services (5)

| Service | Description |
|---|---|
| `ai-extraction.ts` | Legacy wrapper for backward compatibility |
| `insurance-extraction-engine.ts` | AI document extraction (OCR + structured JSON) |
| **`deep-audit-engine.ts`** | **NEW — 7 scanners: integrity, orphans, compliance, duplicates, PDF integrity, audit trail, AI findings** |
| `file-storage.ts` | MinIO file management |
| `data-retention.ts` | Data retention policies |

### Workers (3)

| Worker | Queue | Description |
|---|---|---|
| `document.worker.ts` | `avaai-document` | Async AI document extraction (concurrency: 3) |
| **`audit.worker.ts`** | `avaai-audit` | **NEW — Async deep audit scan (concurrency: 1)** |
| `email.worker.ts` | `avaai-email` | Transactional email sending |

### AI Configuration

- **Model:** `ava:ocr` (uOCR q4, SBAI GPU Exoscale)
- **Base URL:** `https://aipi.coredy.ai/ollama/v1`
- **Extraction Engine:** v1.0.0 — strict evidence-first extraction
- **Supported formats:** PDF, PNG, JPG, TIFF, BMP

---

## Frontend Architecture

### Tech Stack
- **UI:** React 18, Vite 6, Tailwind CSS
- **State:** @tanstack/react-query
- **Routing:** react-router-dom v6
- **UI Library:** Radix UI primitives + shadcn/ui
- **Icons:** lucide-react
- **Charts:** recharts

### Pages (74)

**Core Business**
- `Customers.jsx` — Customer management + segments + merge
- `Contracts.jsx` — Contract management + renewal/upsell/cancellation
- `Applications.jsx` — Kanban + status workflow
- `Documents.jsx` — Document management + AI extraction

**Analytics & Intelligence**
- `Dashboard.jsx`, `AdvancedDashboard.jsx`, `CEOCockpit.jsx`
- `CustomerIntelligenceWorkspace.jsx`, `CoverageIntelligence.jsx`
- `Pipeline.jsx`, `PipelinePerformance.jsx`

**Finance**
- `CommissionsAndCourtage.jsx`, `FinanceDashboard.jsx`
- `AccountingEntries.jsx`, `Payouts.jsx`, `FinancePeriods.jsx`

**Compliance & Audit**
- `EnterpriseAudit.jsx`, `AiReviewCenter.jsx`, `EnterpriseSystemCheck.jsx`
- `GovernanceRules.jsx`, `DuplicateAlerts.jsx`, `SystemLogs.jsx`

**Insurance**
- `KrankenkassenVergleich.jsx`, `Ausschreibungen.jsx`, `VersichererDBPage.jsx`
- `InsuranceLearningCenter.jsx`, `Offers.jsx`, `Claims.jsx`

**Admin**
- `AdminHub.jsx`, `AdminEnterpriseControlCenter.jsx`, `AdminLogs.jsx`
- `AdminSecurity.jsx`, `AdminTeamAccess.jsx`, `AdminBackup.jsx`

---

## Deep Audit & Scan (NEW)

### API Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/audit/scan` | Trigger async deep audit scan |
| `GET` | `/api/audit/scan/status` | Latest scan results |
| `GET` | `/api/audit/scan/history` | Scan history (last 20) |

### 7 Scanners
1. **Data Integrity** — Customers without email, contracts without end date, stuck applications
2. **Orphans** — Contracts/applications/documents without customer
3. **Compliance** — Governance rules active, customers without mandate
4. **Duplicates** — Open duplicate alerts, email-based duplicates
5. **PDF Integrity** — Corrupt PDF detection via header check
6. **Audit Trail** — Missing audit logs, critical audit events
7. **AI Findings** — Unresolved critical findings

### Score Calculation
Per-category scoring (0-100) with severity penalties:
- `blocking`: -30 points
- `critical`: -15 points
- `warning`: -5 points
- `info`: -1 point

---

## Prisma Data Model

- **60 models**, **129 enums**
- Multi-tenant via `organization_id` on all entities
- Soft-delete (archived + archived_at) on all models
- Full audit trail with `AuditLog` model
- Governance rules engine with `GovernanceRule` model
- AI findings with `AiFinding` model

---

## Security

- JWT authentication with refresh token rotation
- RBAC with 7 roles: admin, management, broker, backoffice, finance, support, compliance
- Tenant isolation via `organization_id` middleware
- Rate limiting (100 req/min)
- Sensitive field stripping (password_hash, reset_token_hash)
- Soft-delete on all entities
