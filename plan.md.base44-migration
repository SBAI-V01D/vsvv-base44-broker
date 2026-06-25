# 🏗️ VSVV Premium Broker → 100% Base44-freie Fullstack Docker Lösung

## Migrationsplan v1.0 — Stand: 2026-06-23

---

## 1. ZIEL & RAHMEN

| Aspekt | Ziel |
|--------|------|
| **Architektur** | Monorepo: `frontend/` (React/Vite) + `backend/` (Node/TypeScript + Fastify) + `database/` (PostgreSQL + Prisma) |
| **Deployment** | Docker Compose (dev) → Kubernetes Helm (prod) |
| **Auth** | Eigenes JWT (Access + Refresh Tokens) + RBAC (7 Rollen) |
| **Real-time** | Socket.io (ersetzt Base44 Subscriptions) |
| **External APIs** | PrimAI (BAG), Swiss Post, E-Mail (SendGrid/Postmark), PDF (Puppeteer) |
| **Parität** | 100% Features, 100% UI-Look, 0% Base44-Abhängigkeit |

---

## 2. ZIEL-ARCHITEKTUR

```
┌──────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ Frontend │──▶│ Backend  │──▶│PostgreSQL│   │   Redis  │  │
│  │ (Vite)   │   │(Fastify) │   │  (16)    │   │ (Cache)  │  │
│  │ :5173    │   │ :3000    │   │ :5432    │   │ :6379    │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│                       │                                      │
│                 ┌──────▼──────┐                              │
│                 │   MinIO     │  (Dokumente/Backups)         │
│                 │  :9000      │                              │
│                 └─────────────┘                              │
│  ┌────────────────────────────┐                              │
│  │   MailHog (Dev)            │                              │
│  │   → SendGrid (Prod)        │                              │
│  └────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

| Heutige Base44 | Ziel-Architektur |
|---|---|
| Base44 PostgreSQL | PostgreSQL 16 (Managed/Core) |
| @base44/sdk REST | Fastify + REST API (TypeScript) |
| Base44 Auth (JWT) | Eigenes JWT (Access 15min + Refresh 7d) |
| Base44 Subscriptions | Socket.io (WebSocket) |
| Base44 Serverless Functions (Deno) | Backend Service Endpoints |
| Base44 Entities (auto CRUD) | Prisma ORM + Custom Routes |
| Base44 Integrations (Email) | SendGrid/Mailjet/Postmark |
| Vite + Base44 Plugin | Plain Vite + React |
| @base44/sdk frontend | Eigenes `@vsvv/api-client` Package |

---

## 3. DATENBANK (PHASE 1A — 2-3 Tage)

**Alle Base44 Entities in ein Prisma Schema**:
- `Kunde`, `Vertrag`, `Provision`, `Lead`, `Aufgabe`
- `Antrag`, `Dokument`, `Versicherer`, `BAG_Praemie`
- `Benutzer`, `Rolle`, `Organization`, `Advisor`
- `Ausschreibung`, `Offerte`, `VergleichsAnalyse`
- `EnterpriseIncident`, `AuditLog`, `GovernanceScore`, `BackupLog`
- `EmailCampaign`, `Notification`, `SystemLog`
- `Dossier`, `Verkaufschance`, `MutationRequest`
- `chat_messages`, `import_batch`, `duplicate_alert`, `activity_log`
- PLUS: `refresh_tokens`, `session_store`, `migrations_lock`

**Ca. 50+ Models** – jedes mit `organization_id` für Multi-Tenant.

Prisma Migrations + Seed-Daten (Kantone, BAG-Regionen, PLZ, Versicherer).

---

## 4. AUTH SYSTEM (PHASE 1B — 1-2 Tage)

Base44 Auth → **Eigenes JWT-System**

```
POST /api/auth/login          → { email, password } → { accessToken, refreshToken, user }
POST /api/auth/register        → { email, password, role } → { user }
POST /api/auth/refresh         → { refreshToken } → { new accessToken }
POST /api/auth/logout          → invalidate refresh token
POST /api/auth/forgot-password → { email } → send reset link
POST /api/auth/reset-password  → { token, password } → ok
GET  /api/auth/me              → current user (JWT protected)
```

**Frontend AuthContext.jsx → `useAuth()` hook**:
- `checkAuth()` on mount → API call mit stored token
- `login(email, pw)` → store tokens in httpOnly cookies oder localStorage
- `logout()` → clear tokens, redirect
- `refreshAccessToken()` → silent refresh bei 401
- RBAC: 1:1 Übernahme aus `lib/rbac.js` (7 Rollen)

**Portal-Auth**: Eigenständig – `portal_customer_id` + `portal_session_token` + BCrypt.

---

## 5. BACKEND API (PHASE 2 — 5-7 Tage)

**Stack**: Fastify + TypeScript + Prisma + Socket.io

```
backend/
├── prisma/
│   ├── schema.prisma         # Alle Models
│   ├── seed.ts               # Kantone, PLZ, Versicherer
│   └── migrations/           # Automatisch generiert
├── src/
│   ├── app.ts                # Fastify App Setup
│   ├── config/
│   │   ├── env.ts            # Zod-validierte Env-Vars
│   │   └── cors.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT-Verifikation
│   │   ├── rbac.ts           # Role Check
│   │   ├── tenant.ts         # organization_id Isolation
│   │   └── audit.ts          # Audit Log Middleware
│   ├── modules/
│   │   ├── auth/             # Login, Register, Refresh, Reset
│   │   ├── customers/        # CRUD + Family + Visibility
│   │   ├── contracts/        # CRUD + Renewal + Cancellation
│   │   ├── applications/     # CRUD + Status Workflow
│   │   ├── commissions/      # CRUD + Storno + KPI Engine
│   │   ├── documents/        # CRUD + Upload + Klassifikation
│   │   ├── tasks/            # CRUD + Due-Date + Workflow
│   │   ├── leads/            # CRUD + Scoring
│   │   ├── krankenkassen/    # BAG Vergleich (queryBAGLive Proxy)
│   │   ├── ausschreibungen/  # RFP Module
│   │   ├── portal/           # Customer Portal API
│   │   ├── enterprise/       # CentralAnalysisEngine, Incidents
│   │   ├── audit/            # AuditLog CRUD + Query
│   │   ├── backup/           # createBackup, restore
│   │   └── admin/            # UserMgmt, TeamAccess, Settings
│   ├── services/
│   │   ├── email.ts          # SendGrid/Mailjet Adapter
│   │   ├── pdf.ts            # Puppeteer/PDFKit Generator
│   │   ├── storage.ts        # MinIO/S3 Adapter
│   │   └── bag.ts            # PrimAI API Proxy
│   ├── guards/               # Enterprise Guards (1:1 aus Base44)
│   │   ├── contractLifecycle.ts
│   │   ├── dataAccess.ts
│   │   ├── documentAccess.ts
│   │   ├── commissionAccess.ts
│   │   └── pipelineStuck.ts
│   ├── engines/              # Business Logic Engines
│   │   ├── commissionEngine.ts  # calcCommissionFields, calcKPIs
│   │   ├── centralAnalysis.ts   # centralAnalysisEngine 1:1
│   │   ├── healthScore.ts
│   │   └── dossierCalc.ts
│   ├── workers/              # Hintergrund-Jobs (BullMQ)
│   │   ├── emailCampaigns.ts
│   │   ├── backupScheduler.ts
│   │   ├── renewalNotifier.ts
│   │   ├── birthdayNotifier.ts
│   │   ├── documentProcessor.ts
│   │   └── wiedervorlage.ts
│   └── socket/
│       └── index.ts          # Socket.io Server + Events
├── Dockerfile
├── package.json
└── tsconfig.json
```

### CRUD Pattern (jedes Modul)

```typescript
// backend/src/modules/customers/customers.routes.ts
import { FastifyPluginAsync } from 'fastify'

const customersRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/customers — list with filters, pagination
  app.get('/api/customers', {
    preHandler: [app.requireAuth, app.requireRole(['admin', 'management', 'broker'])]
  }, async (req, reply) => {
    const { search, status, advisor_id, page, limit } = req.query
    const customers = await prisma.kunde.findMany({
      where: { organizationId: req.user.orgId, archived: false, ...filters },
      include: { verträge: true, leads: true },
      orderBy: { createdAt: 'desc' },
      take: limit, skip: (page - 1) * limit
    })
    return { data: customers }
  })

  // GET /api/customers/:id — detail
  app.get('/api/customers/:id', { preHandler: [app.requireAuth] }, async (req, reply) => {
    const customer = await prisma.kunde.findFirst({
      where: { id: req.params.id, organizationId: req.user.orgId }
    })
    if (!customer) return reply.code(404).send({ error: 'not_found' })
    return { data: customer }
  })

  // POST /api/customers — create
  // PATCH /api/customers/:id
  // DELETE /api/customers/:id (soft)
}
```

---

## 6. FRONTEND MIGRATION (PHASE 3 — 3-5 Tage)

### 6.1 API-Client erstellen (ersetzt @base44/sdk)

```typescript
// src/api/client.ts
import { createClient } from '@/api/client'

export const api = createClient({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  onUnauthorized: () => navigateToLogin(),
})

// Usage (exakt gleiches Interface wie Base44):
const customers = await api.entities.Customer.list({ status: 'active' })
const contract = await api.entities.Contract.get(id)
await api.entities.Task.create({ title: 'Neu', status: 'open' })
await api.functions.invoke('calculateCommissions', { contractId: id })
```

### 6.2 Migrations-Pfad pro Datei

| Base44 SDK Aufruf | Ersetzen mit |
|---|---|
| `base44.entities.X.list()` | `api.entities.X.list(filters)` |
| `base44.entities.X.get(id)` | `api.entities.X.get(id)` |
| `base44.entities.X.create(data)` | `api.entities.X.create(data)` |
| `base44.entities.X.update(id, data)` | `api.entities.X.update(id, data)` |
| `base44.entities.X.delete(id)` | `api.entities.X.delete(id)` |
| `base44.entities.X.filter(query)` | `api.entities.X.list(query)` |
| `base44.entities.X.subscribe(cb)` | `socket.on('entity:X', cb)` |
| `base44.auth.me()` | `api.auth.me()` |
| `base44.auth.logout()` | `api.auth.logout()` |
| `base44.auth.redirectToLogin()` | `navigate('/login')` |
| `base44.functions.invoke(name, params)` | `api.functions.invoke(name, params)` |
| `base44.integrations.*` | `api.functions.invoke('sendEmail', {...})` |

### 6.3 Globale Ersetzungen (Codemod)

```bash
# Regex-basierte 1:1 Replacements:
s/base44\.entities\.(\w+)\.list/api.entities.$1.list/g
s/base44\.entities\.(\w+)\.get/api.entities.$1.get/g
s/base44\.entities\.(\w+)\.create/api.entities.$1.create/g
s/base44\.entities\.(\w+)\.update/api.entities.$1.update/g
s/base44\.entities\.(\w+)\.delete/api.entities.$1.delete/g
s/base44\.entities\.(\w+)\.filter/api.entities.$1.list/g
s/base44\.auth\.me/api.auth.me/g
s/base44\.auth\.logout/api.auth.logout/g
s/base44\.auth\.redirectToLogin/api.auth.redirectToLogin/g
s/base44\.functions\.invoke/api.functions.invoke/g
s/@\/api\/base44Client/@\/api\/client/g
s/import.*from ['"]@\/api\/base44Client['"]/import { api } from '@/api\/client'/g
```

### 6.4 Was bleibt gleich

- **100% der Komponenten** (`components/`, `pages/`, `hooks/`, `lib/`)
- **100% des UI/CSS** (Tailwind + Radix + Design Tokens)
- **100% der Business Logic** (`lib/commissionEngine.js`, `lib/rbac.js`, `lib/kkvConfig.js`)
- **100% der Routen** (React Router – nur `AuthContext` wird getauscht)

**Nur ersetzt werden:** `src/api/base44Client.js` + `src/lib/AuthContext.jsx` + `src/lib/query-client.js` + `src/hooks/useRealtimeSync.js`

---

## 7. MIGRATION DER 200+ SERVERLESS FUNCTIONS (PHASE 4 — 5-7 Tage)

| Kategorie | Functions | Ziel-Modul | Implementierung |
|---|---|---|---|
| **Guards** (10) | `guardDataAccess`, `guardDocumentAccess`, `guardCommissionAccess`, `guardContractLifecycle`, `guardPortalAccess`, `guardPortalLogin`, `guardDoublePayment`, `guardFamilyContractIntegrity`, `guardPipelineStuck` | `src/guards/*.ts` | Middleware/Service, synchrone Prüfung |
| **Engines** (3) | `centralAnalysisEngine`, `commissionEngine` (Frontend Lib), `healthScore` | `src/engines/*.ts` | Service-Klasse mit Cache |
| **CRUD Custom** (25) | `getAllContractsForDashboard`, `getPortalData`, `getUserVisibleData`, `matchCustomerAndFamily`, `createFamilyMember`, `diagnoseCustomerVisibility` | `src/modules/*/*.routes.ts` | Prisma Queries |
| **Automation** (30) | `sendEmailCampaign`, `sendScheduledCampaigns`, `checkPoliciesExpiry`, `checkPoliciesRenewal`, `notifyExpiringContracts`, `birthdayEmailReminder`, `mandatePendingReminder`, `wiedervorlageReminders` | `src/workers/*.ts` | BullMQ Queue + Cron |
| **Audit** (5) | `auditLogWrite`, `createAuditLog`, `auditDataConsistency`, `validateFinancialConsistency` | `middleware/audit.ts` + `modules/audit/` | Auto-Middleware + Manuell |
| **Validation** (15) | `validateTenantIntegrity`, `validateSystemIntegrity`, `validateEnterpriseChange`, `validateImportBatch`, `validateDashboardKPIs` | `src/engines/validation.ts` | Service + Report |
| **Repair** (15) | `repairFamilyContractIntegrity`, `repairBrokenRelations`, `repairMissingAdvisorAssignments`, `repairApprovalMetadata`, `restoreAdvisorAssignmentsFromJunction` | `src/modules/admin/repair.routes.ts` | Admin-only Endpoints |
| **Backup** (3) | `createBackup`, `createIncrementalBackup`, `deleteRecentImport` | `src/modules/backup/` | pg_dump + MinIO |
| **Portal** (5) | `inviteCustomerToPortal`, `updatePortalPassword`, `uploadPortalDocument`, `resendMessage` | `src/modules/portal/` | Custom |
| **BAG** (3) | `queryBAGLive`, `analyzeKrankenkassenVergleich`, `debugKKVLivePipeline` | `src/services/bag.ts` | PrimAI Proxy |
| **Contracts** (20) | `calculateRenewalPriority`, `renewPolicy`, `acceptRenewalOffer`, `cancelPolicy`, `approveMutationRequest`, `generateBAGTemplate`, `generateDossierPdf` | `src/modules/contracts/` + `src/services/pdf.ts` | Business Logic |
| **AI** (10) | `aiIncidentResolver`, `aiCorrectionLogger`, `learnAndGenerateImprovements`, `systemExcellenceReport` | `src/engines/aiReview.ts` | LLM-Agent + Report |
| **Cleanup** (10) | `cleanupAllImports`, `safeBatchCleanup`, `brokerOpsCleanup`, `safeImportWithBatchTracking` | `src/modules/admin/cleanup.routes.ts` | Scheduled |
| **Enterprise** (15) | `enterpriseValidationSuite`, `enterpriseSystemCheck`, `enforceGovernance`, `enforceGovernanceCheck`, `governanceRecovery`, `correlateIncidents`, `observeProductionProcesses` | `src/modules/enterprise/` | Governance Engine |
| **Frontend Libs** (30+) | `commissionEngine.js`, `kkvConfig.js`, `customerMatcher.js`, `dossierCalc.js`, `healthScore.js`, `customerSearch.js`, `fieldLearning.js`, `postalCodeLookup.js` | Bleibt in `src/lib/` | Kein Change nötig! |

---

## 8. REALTIME-SYSTEM (PHASE 5 — 1 Tag)

**Statt Base44 Subscriptions → Socket.io**:

```typescript
// backend/src/socket/index.ts
import { Server } from 'socket.io'

export function setupSocket(httpServer, prisma) {
  const io = new Server(httpServer, { cors: { origin: '*' } })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    const user = await verifyToken(token)
    if (!user) return next(new Error('unauthorized'))
    socket.data.user = user
    next()
  })

  io.on('connection', (socket) => {
    socket.join(`org:${socket.data.user.organizationId}`)
    socket.on('subscribe:entity', (entity) => {
      socket.join(`entity:${entity}`)
    })
  })

  // Prisma-Change-Hooks (via @prisma/client extension)
  prisma.$use(async (params, next) => {
    const result = await next(params)
    if (['create', 'update', 'delete'].includes(params.action)) {
      const model = params.model
      io.to(`entity:${model}`).emit(`entity:${model}:changed`, {
        action: params.action,
        data: result
      })
    }
    return result
  })

  return io
}
```

**Frontend**:

```typescript
// src/hooks/useRealtimeSync.js → BEHÄLT Interface, tauscht Implementierung
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from '@/api/socket'

export function useRealtimeSync() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const entities = ['Application', 'Contract', 'Customer', 'Document', 'Task', 'CommissionEntry']
    entities.forEach(entity => {
      socket.emit('subscribe:entity', entity)
      socket.on(`entity:${entity}:changed`, () => {
        queryClient.invalidateQueries({ queryKey: [entity.toLowerCase()] })
      })
    })
    return () => { socket.disconnect() }
  }, [])
}
```

---

## 9. DOCKER SETUP (PHASE 6 — 1 Tag)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: vsvv
      POSTGRES_USER: vsvv
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vsvv"]
  
  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  minio:
    image: minio/minio
    volumes:
      - miniodata:/data
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}

  backend:
    build: ./backend
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }
    environment:
      DATABASE_URL: postgresql://vsvv:${DB_PASSWORD}@postgres:5432/vsvv
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio:9000
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST}
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    depends_on: [backend]
    ports:
      - "5173:80"
    environment:
      VITE_API_URL: /api

  mailhog:
    image: mailhog/mailhog
    ports:
      - "8025:8025"

volumes:
  pgdata:
  redisdata:
  miniodata:
```

---

## 10. MIGRATIONS-ROADMAP (GESAMT)

| Phase | Dauer | Was | Output |
|-------|-------|-----|--------|
| **1a** | 2-3d | DB Schema (Prisma) + Seeds + Docker DB | `prisma/schema.prisma`, `docker-compose.yml` |
| **1b** | 1-2d | Auth System (JWT + RBAC) + Portal Auth | `backend/src/modules/auth/`, `backend/src/middleware/auth.ts` |
| **2a** | 3-5d | API Client/Server CRUD Framework + Entities | `src/api/client.ts`, Core CRUD Routes |
| **2b** | 2-3d | Frontend AuthContext + API-Client Integration | App läuft! Login → Dashboard |
| **3** | 3-5d | Top 50 Serverless Functions migrieren | Guards, BAG, Audit, Engines |
| **4a** | 2-3d | Nächste 100 Functions migrieren | Portal, Automation, Validation |
| **4b** | 2-3d | Restliche 50 Functions migrieren | Repair, Cleanup, Enterprise |
| **5** | 1d | Realtime (Socket.io) | `src/socket/`, Cache-Invalidation |
| **6** | 1d | Docker Finalisierung + CI/CD | `Dockerfile`s, GitHub Actions |
| **7** | 2-3d | Integration Tests + Data Migration | Prod Base44 → Postgres dump → target |
| **8** | 1d | Deploy + Go-Live | Cutover, Smoke Tests |

**Total:** ~20-25 Entwicklungstage (ohne Buffer)

---

## 11. RISIKEN & ENTSCHEIDUNGEN

| Risiko | Lösung |
|--------|--------|
| Base44 verwendet `organization_id` für Multi-Tenant | Tenant-Middleware inject `orgId` in every request + Prisma `where: { orgId }` |
| 200+ Functions, einige schwer lesbar | Jede Function wird zu einem Testfall. Coverage-Ziel: 100% |
| Base44 SDK hat undocumented Features | Falls ein `base44.*` Call keinen 1:1-Ersatz hat → mocken und später manuell nachbauen |
| Legacy-Daten müssen migriert werden | Base44 → JSON Export → pg_restore. `organization_id` Mapping vorher klären |
| `@base44/vite-plugin` Features (HMR, Analytics, VisualEdit) | Alle optional. Nur `hmrNotifier` und `navigationNotifier` brauchen kleinen Ersatz |

---

## 12. START-STRATEGIE

### Tag 1: Foundation bauen

```bash
# 1. Projekt-Struktur
mkdir -p backend/src/{config,middleware,modules,{auth,customers,contracts,applications,commissions,documents,tasks,leads,krankenkassen,portal,enterprise,audit,backup,admin},services,engines,guards,workers}
mkdir -p frontend/src/api
mkdir -p database/init

# 2. Prisma Schema erstellen (alle Models aus SQL_SCHEMA)
cd backend
npx prisma init

# 3. Kern-Services bauen (config, auth middleware, api client)
# 4. Docker Compose aufsetzen
# 5. AuthContext im Frontend ersetzen
# 6. EINE Route zum Laufen bringen (z.B. GET /api/customers)
```

**Erfolgskriterium Tag 1:** `npm run dev` → Login → Dashboard zeigt Kunden an.
