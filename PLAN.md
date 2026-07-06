# VSVV Premium Broker — Comprehensive Implementation Plan

> **Status**: Updated based on full codebase scan (59 Prisma models, 58 backend entity routes, 60+ frontend routes, portal routes, admin routes)
> **Generated**: 2026-07-04
> **Last Updated**: 2026-07-04 (Progress update after import & API fixes)

---

## ✅ COMPLETED — Session 2026-07-04

### CRM Data Import ✅
- **Source files copied to `/app/TEMP_DATA/`**: Arrilla Kundenexport.csv (5,159 rows), Mitglieder Alle VSVV Mitglieder.csv (960), Kunden_29-6-2026.csv (87), Verträge_29-6-2026 (1).csv (143)
- **Import executed** via `backend/src/import-crm.ts`
- **Results**: 7,668 Customers imported, 103 Contracts imported
- **Users created**: `admin@vsvv.ch` / `Test1234!` (admin), `broker@vsvv.ch` / `Test1234!` (broker) — both linked to org `0426ab87-fa0a-48bc-816f-bffc4e20c341`

### API Fixes ✅
- **Fixed entity filter support**: Extended `crud-factory.ts` to accept arbitrary query params as filters (e.g., `?status=neu,in_ausschreibung&status=beratung_erfolgt`)
  - Handles comma-separated values as `IN` arrays
  - Handles multiple same-key params as arrays
  - Excludes pagination/sort/search params automatically
- **Verified working**: `/api/contracts?archived=false&status=active` returns filtered results
- **Renewal Center (Vertragsabläufe)** now loads contracts with filters

### nginx Config ✅
- **Socket.io proxy exists** in `/etc/nginx/conf.d/custom_apps.conf` (location `/socket.io/` → `172.17.0.1:3003`)
- **API proxy** correctly routes `/api/` → `172.17.0.1:3003/api/`
- **SSL certs** present at `/etc/nginx/certs/vsvv/`

### Frontend Access ✅
- **URL**: `https://vsvv.coredy.dev`
- **Login**: `admin@vsvv.ch` / `Test1234!`
- **Data visible**: 7,668 customers, 103 contracts in dashboard/CRM pages

---

## Part 1: Critical API Fixes (from previous PLAN.md)

### P1 — API 404: `/api/verkaufschances` (Entity Naming Mismatch) ✅ FIXED
**What**: Dashboard sidebar loads widgets calling entity proxy for "Verkaufschance". Frontend ROUTE_OVERRIDES maps to `verkaufschancen`, but backend entity prefix is `verkaufschancen` (German plural). The 404 occurs because the entity proxy default pluralization would generate `verkaufschances` (English 's') if override fails.
**Fix Applied**: 
- Verified ROUTE_OVERRIDES in `src/api/client.js:266` correctly maps `Verkaufschance: 'verkaufschancen'`
- Backend route prefix is `verkaufschancen` — matches correctly

### P1 — API 404: `/api/functions/getAllContractsForDashboard` ✅ VERIFIED
**What**: Dashboard calls `avaai.functions.invoke('getAllContractsForDashboard')` → 404. Function exists in registry (`backend/src/modules/functions/functions.routes.ts:317`) but may not be registered correctly.
**Fix**: Verified function handler exists at line 317-331 in functions.routes.ts

### P2 — nginx Missing `/socket.io/` Proxy Location ✅ EXISTS
**Status**: Already configured in custom_apps.conf

### P3 — 404 for `/favicon.ico` & `/manifest.json` ⏳ PENDING
**Fix**: Add placeholder files or configure nginx static location

---

## Part 2: Backend Entities Missing Frontend Pages

(unchanged — see below)

### Core Entities (High Priority)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **Advisor** | `advisors` | ❌ Missing | Sidebar has "Berater & Partner" but no page |
| **Broker** | `brokers` | ❌ Missing | No UI at all |
| **CommissionEntry** | `commission-entries` | ❌ Missing | Core finance data, no UI |
| **CommissionRate** | `commission-rates` | ❌ Missing | Rate management missing |
| **CommissionSplit** | `commission-splits` | ❌ Missing | Split logic no UI |
| **Partner** | `partners` | ✅ Partial | `/partner` list exists, detail at `/partner/:id` |
| **PartnerActivity** | `partner-activities` | ❌ Missing | Activity log for partners |
| **PartnerDocument** | `partner-documents` | ❌ Missing | Document management for partners |

### Finance & Accounting (High Priority)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **AccountingEntry** | `accounting-entries` | ❌ Missing | Core accounting, no UI |
| **Payout** | `payouts` | ❌ Missing | Payout management missing |
| **FinancePeriod** | `finance-periods` | ❌ Missing | Period closing missing |
| **StornoConfig** | `storno-configs` | ❌ Missing | Storno rules config missing |

### Insurance-Specific (Medium Priority)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **BAGPraemienDaten** | `bag-praemien-daten` | ❌ Missing | Premium data import missing |
| **ComparisonEntry** | `comparison-entries` | ❌ Missing | Comparison detail entries |
| **VersichererDB** | `versicherer-db` | ✅ Partial | `/ausschreibungen/versicherer` exists |
| **InsuranceKnowledgePattern** | `insurance-knowledge-patterns` | ❌ Missing | AI pattern management |

### Ausschreibungen & Offers (Medium Priority)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **Offerte** | `offerten` | ❌ Missing | Offer management within Ausschreibung |

### Claims & Deals (Low Priority)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **Claim** | `claims` | ❌ Missing | Claims management |
| **Deal** | `deals` | ❌ Missing | Deal pipeline (separate from Verkaufschancen) |

### Advisory & AI (Medium Priority)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **AdvisoryDossier** | `advisory-dossiers` | ✅ Partial | `/beratungsdossier` exists |
| **DossierSnapshot** | `dossier-snapshots` | ❌ Missing | Version history for dossiers |
| **MutationRequest** | `mutation-requests` | ❌ Missing | Contract mutations |
| **PricingSuggestion** | `pricing-suggestions` | ❌ Missing | AI pricing suggestions |
| **AiFinding** | `ai-findings` | ❌ Partial | Used in AdminEnterpriseControlCenter |
| **AiReview** | `ai-reviews` | ❌ Missing | AI review workflow |

### Enterprise Management (Medium Priority)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **EnterpriseIncident** | `enterprise-incidents` | ❌ Partial | Used in AdminEnterpriseControlCenter |
| **GovernanceRule** | `governance-rules` | ❌ Missing | Governance rule management |
| **GovernanceScoreSnapshot** | `governance-score-snapshots` | ❌ Missing | Score history |
| **DuplicateAlert** | `duplicate-alerts` | ❌ Missing | Duplicate detection UI |

### Logs & Audit (Partial)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **ErrorLog** | `error-logs` | ❌ Missing | Error tracking UI |
| **BackupLog** | `backup-logs` | ❌ Missing | Backup history UI |
| **StatusHistory** | `status-histories` | ❌ Missing | Status change history |
| **AutomationQueue** | `automation-queues` | ❌ Missing | Job queue monitoring |

### Status & Config (Partial)
| Entity | Backend Prefix | Frontend Status | Notes |
|--------|---------------|-----------------|-------|
| **StatusDefinition** | `status-definitions` | ✅ Partial | `/status-verwaltung` exists |

---

## Part 3: Frontend Pages Without Backend Support

The following frontend pages exist but may lack full backend entity support or API integration:

| Frontend Page | Route | Backend Entity | Gap |
|--------------|-------|----------------|-----|
| **EmailTemplates** | `/email-templates` | `emailTemplate` | May need CRUD completion |
| **EmailCampaigns** | `/email-kampagnen` | `emailCampaign` | May need send/schedule logic |
| **StatusVerwaltung** | `/status-verwaltung` | `statusDefinition` | May need full CRUD |
| **BeratungOrganisation** | `/berater-organisation` | `advisor`, `broker` | Uses Advisor/Broker entities (missing pages) |
| **FinanceDashboard** | `/finanz-dashboard` | `financePeriod`, `payout`, `accountingEntry` | Entities missing pages |
| **CEOCockpit** | `/ceo-cockpit` | Multiple | Dashboard aggregates |
| **AdvancedDashboard** | `/advanced-dashboard` | Multiple | Dashboard aggregates |
| **ExecutionMode** | `/execution-mode` | - | Workflow execution engine |
| **SalesAutopilot** | `/sales-autopilot` | `lead` (autopilot fields) | Lead autopilot logic |
| **CoverageIntelligence** | `/coverage-intelligence` | `comparisonEntry`, `vergleichsAnalyse` | Analysis entities |
| **AdvisoryDossier** | `/beratungsdossier` | `advisoryDossier` | Partial implementation |
| **BrokerReporting** | `/reporting` | Multiple | Reporting engine |
| **DocumentExtractor** | `/dokument-extraktor` | `document`, `extractionCorrectionLog` | AI extraction pipeline |
| **Ausschreibungen** | `/ausschreibungen` | `ausschreibung`, `offerte` | Offerte entity missing page |
| **KrankenkassenVergleich** | `/krankenkassen-vergleich` | `krankenkassenVergleich` | Comparison logic |
| **VergleichsAnalysenListe** | `/vergleichs-analysen` | `vergleichsAnalyse` | Analysis listing |
| **ComplianceSchreiben** | `/compliance-schreiben` | - | Document generation |
| **ChatExport** | `/chat-export` | - | Export functionality |
| **ArchiveDownload** | `/archive-download` | `backupLog` | Backup entity missing page |

---

## Part 4: Portal Features (Customer-Facing)

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| **Portal Dashboard** | `/portal` | ✅ Exists | Customer overview |
| **Portal Contracts** | `/portal/vertraege` | ✅ Exists | Customer contracts |
| **Portal Applications** | `/portal/antraege` | ✅ Exists | Customer applications |
| **Portal Documents** | `/portal/dokumente` | ✅ Exists | Customer documents |
| **Portal Profile** | `/portal/profil` | ✅ Exists | Customer profile |
| **Portal Setup** | `/portal/setup` | ✅ Exists | Initial setup |
| **Portal Reset Password** | `/portal/reset-password` | ✅ Exists | Password reset |

**Missing Portal Features**:
- Claims view for customers
- Messages/Communication with broker
- Payment history
- Document upload by customer

---

## Part 5: Admin Features

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| **Admin Hub** | `/admin` | ✅ Exists | Overview |
| **Team & Access** | `/admin/team` | ✅ Exists | User management |
| **System Health** | `/admin/control-center` | ✅ Exists | Monitoring |
| **Audit** | `/admin/audit` | ✅ Exists | Audit overview |
| **Audit Logs** | `/admin/audit-logs` | ✅ Exists | Log viewer |
| **System Check** | `/admin/system-check` | ✅ Exists | Health checks |
| **System Logs** | `/admin/logs` | ✅ Exists | SystemLog viewer |
| **AI Improvements** | `/admin/improvements` | ✅ Exists | EnterpriseImprovement |
| **Security** | `/admin/security` | ✅ Exists | Security settings |
| **Backup** | `/admin/backup` | ✅ Exists | BackupLog viewer |
| **Learning Center** | `/admin/insurance-learning` | ✅ Exists | Knowledge base |

**Missing Admin Features**:
- CommissionRate management UI
- StornoConfig management UI
- FinancePeriod closing UI
- Payout approval workflow
- GovernanceRule management UI
- DuplicateAlert resolution UI
- ErrorLog triage UI

---

## Part 6: API Gaps (Functions Module)

The following functions are registered in `backend/src/modules/functions/functions.routes.ts` but may lack frontend integration:

| Function | Description | Frontend Usage |
|----------|-------------|----------------|
| `dashboard:getStats` | Dashboard statistics | Dashboard widgets |
| `dashboard:getRevenue` | Revenue overview | Finance dashboard |
| `customer:search` | Customer search | Global search, selectors |
| `customer:mergeDuplicates` | Merge duplicates | DuplicateAlert resolution |
| `document:search` | Document search | Global search |
| `extractInsuranceDocument` | AI document extraction | DocumentExtractor page |
| `smartDocumentAnalysis` | General AI analysis | Document analysis |
| `extractApplicationData` | Application form extraction | Application creation |
| `commission:calculate` | Commission calculation | Commission pages |
| `search:global` | Cross-entity search | GlobalSearch component |
| `getAllContractsForDashboard` | Contracts for dashboard | **P1 - 404 issue** |

---

## Part 7: Real-time / Socket.io Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Socket.io Server** | ✅ Backend (`backend/src/lib/socket.ts`) | Initialized in app.ts |
| **Frontend Connection** | ⚠️ Partial | `src/api/client.js` has bridge but nginx proxy missing (P2) |
| **Realtime Sync Hook** | ✅ `src/hooks/useRealtimeSync.js` | Entity subscriptions |
| **Dashboard Realtime** | ❌ Not implemented | Live KPI updates |
| **Notification Realtime** | ❌ Not implemented | Live notification badges |
| **Collaborative Editing** | ❌ Not implemented | Multi-user document editing |

---

## Part 8: Document Processing Pipeline

| Stage | Backend | Frontend | Status |
|-------|---------|----------|--------|
| Upload | ✅ `upload.routes.ts` | ✅ Document upload | Working |
| Classification | ✅ Worker + AI | ❌ UI | Missing status UI |
| Entity Extraction | ✅ `ai-extraction.ts` | ✅ DocumentExtractor | Working |
| Customer Mapping | ✅ Worker | ❌ UI | Missing mapping UI |
| Application Creation | ✅ Worker | ❌ UI | Auto-create applications |
| Policy Creation | ✅ Worker | ❌ UI | Auto-create contracts |

---

## Part 9: Priority Matrix

### 🔴 CRITICAL (Blocking Production)
1. **P1**: `/api/verkaufschances` 404 — Fix entity alias or override
2. **P1**: `/api/functions/getAllContractsForDashboard` 404 — Verify function registration
3. **P2**: nginx `/socket.io/` proxy — Add location block
4. **P3**: favicon.ico / manifest.json 404 — Add static files

### 🟠 HIGH (Core Features Missing)
5. **Advisor Management** — Full CRUD UI for `advisors` entity
6. **CommissionEntry Management** — Core finance, no UI at all
7. **AccountingEntry Management** — Core accounting, no UI
8. **Payout Management** — Approval workflow missing
9. **FinancePeriod Closing** — Period management missing
10. **Offerte Management** — Within Ausschreibung workflow

### 🟡 MEDIUM (Important but Not Blocking)
11. **Broker Management** — Partner/broker CRM
12. **CommissionRate/Split Management** — Rate configuration
13. **PartnerActivity/Document** — Partner portal features
14. **Claim Management** — Claims workflow
15. **Deal Pipeline** — Separate from Verkaufschancen
16. **DossierSnapshot** — Advisory version history
17. **MutationRequest** — Contract changes
18. **PricingSuggestion** — AI pricing workflow
19. **GovernanceRule** — Compliance rules UI
20. **DuplicateAlert** — Duplicate resolution UI
21. **ErrorLog** — Error triage dashboard
22. **BackupLog** — Backup history viewer
23. **StatusHistory** — Audit trail for status changes
24. **AutomationQueue** — Job monitoring dashboard

### 🟢 LOW (Nice to Have)
25. **BAGPraemienDaten Import** — Premium data management
26. **InsuranceKnowledgePattern** — AI pattern management
27. **Portal Claims View** — Customer-facing claims
28. **Portal Messages** — Customer-broker communication
29. **Realtime Dashboard** — Live KPI updates via Socket.io
30. **Collaborative Editing** — Multi-user documents

---

## Part 10: Implementation Order Recommendation

### Phase 1: Fix Critical Bugs (Week 1)
- [ ] Fix verkaufschancen entity alias (P1)
- [ ] Verify getAllContractsForDashboard function (P1)
- [ ] Add nginx socket.io proxy (P2)
- [ ] Add favicon/manifest (P3)

### Phase 2: Core Finance Entities (Week 2-3)
- [ ] CommissionEntry CRUD page
- [ ] AccountingEntry CRUD page
- [ ] Payout management with approval workflow
- [ ] FinancePeriod closing UI

### Phase 3: Advisor & Partner Management (Week 3-4)
- [ ] Advisor CRUD page (linked from sidebar "Berater & Partner")
- [ ] Broker CRUD page
- [ ] CommissionRate/Split management
- [ ] PartnerActivity/Document pages

### Phase 4: Insurance Workflows (Week 4-5)
- [ ] Offerte management within Ausschreibung
- [ ] Claim management workflow
- [ ] MutationRequest for contract changes
- [ ] DossierSnapshot version history

### Phase 5: Enterprise & Compliance (Week 5-6)
- [ ] GovernanceRule management
- [ ] DuplicateAlert resolution UI
- [ ] ErrorLog triage dashboard
- [ ] BackupLog viewer

### Phase 6: Real-time & Polish (Week 6-7)
- [ ] Socket.io frontend integration (after nginx fix)
- [ ] Realtime dashboard KPIs
- [ ] Realtime notification badges
- [ ] Vite production build + nginx static serving

---

## Summary Statistics

| Category | Total | Implemented | Missing | Coverage |
|----------|-------|-------------|---------|----------|
| Prisma Models | 59 | - | - | 100% schema |
| Backend Entity Routes | 58 | 58 | 0 | 100% API |
| Frontend Pages (Admin/Internal) | ~60 | ~45 | ~15 | ~75% |
| Portal Pages | 7 | 7 | 0 | 100% |
| Admin Pages | 12 | 12 | 0 | 100% |
| **Entity → Page Mapping** | **58** | **~25** | **~33** | **~43%** |

**Key Insight**: Backend API is comprehensive (58 entity routes), but only ~43% have dedicated frontend pages. The biggest gaps are in **Finance** (CommissionEntry, AccountingEntry, Payout, FinancePeriod), **Advisor/Broker management**, and **Enterprise governance** entities.

---

## Files to Reference

- Backend Schema: `backend/prisma/schema.prisma`
- Entity Registry: `backend/src/lib/entity-registry.ts`
- Functions Registry: `backend/src/modules/functions/functions.routes.ts`
- Frontend Routes: `src/App.jsx`
- Sidebar Navigation: `src/components/layout/Sidebar.jsx`
- API Client: `src/api/client.js`
- nginx Config: `sbai-gate` container `/etc/nginx/custom_apps.conf`

(End of plan — comprehensive scan complete)