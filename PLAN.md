# VSVV Premium Broker — Implementation Plan

> **Stand**: 2026-07-06 — Nach Full Import + Feature-Audit
> **Status**: 7 von 19 Backend-Modulen implementiert, 12 Modules leer

---

## ✅ Erledigt

### CRM Datenimport
- `backend/src/full-import.ts`: Kompletter Import (multiline CSV, Excel, PDF)
- Organisation **VSVV** mit 5'007 Kunden, 97 Verträgen, 4 Beratern, 7 PDF-Dokumenten
- Login: `admin@vsvv.ch` / `admin123` • `broker@vsvv.ch` / `broker123`

### KI-Dokumentupload
- **Pipeline komplett**: Upload → S3 → PDF→PNG → Vision API → Strukturierte Extraktion → Auto-Contract
- 14 Frontend-Komponenten (Upload Wizard, Review, Validation)
- BullMQ Worker mit Retries, Audit-Log, Socket.io-Echtzeit-Updates

### Bereits aktiv (7 Module)
| Modul | Routen | Beschreibung |
|-------|--------|-------------|
| auth | ✅ | Login, Register, Refresh, Logout, Password-Reset |
| customers | ✅ | CRUD + Filter |
| document | ✅ | KI-Extraktion, Batch-Verarbeitung |
| upload | ✅ | Multipart-Upload nach S3 |
| functions | ✅ | Dashboard, Document Analysis, Commission |
| health | ✅ | Healthcheck |
| verkaufschancen | ✅ | CRUD |

---

## 🔴 Phase 1: 12 Leere Module implementieren

Jedes dieser Module hat einen Ordner mit `.gitkeep` — es fehlen `*.routes.ts` + ggf. Business-Logik.

### 1.1 `applications` — Antrags-Workflow

**Frontend existiert**: `/antraege`, `/antrag/:id`, `SmartDocumentReview` erstellt Applications

**Was fehlt im Modul:**
- Status-Übergänge: `new → in_progress → waiting → approved/rejected`
- Validierung: Pflichtfelder pro Sparte/Produkt
- Automatische Verknüpfung: Application → Contract (bei approval)
- History-Log via `StatusHistory`
- Benachrichtigung bei Statusänderung

**Aufwand**: 3-4 Tage

### 1.2 `contracts` — Vertrags-Renewal & Kündigungen

**Frontend existiert**: Vertragsabläufe (Renewal Center), Kündigungsdialog

**Was fehlt im Modul:**
- Renewal-Stages: `early → prepare → offer → negotiate → accepted`
- Kündigungs-Workflow: Prüfung → Retention → Bestätigung
- Upsell-Stages: `identified → offered → accepted`
- Storno-Berechnung (12 Monate Risiko)
- `cancellation_deadline`-Checker (automatische Prüfung)

**Aufwand**: 4-5 Tage

### 1.3 `commissions` — Provisions-Verwaltung

**Frontend teilweise**: Finanz-Dashboard, Commission-Komponenten in `commissionEngine.js`

**Was fehlt im Modul:**
- Provision berechnen (aus Vertragsprämie × Rate)
- Split-Logik: Berater (70%) / Teamlead (30%)
- Status-Workflow: `pending → invoiced → earned → paid`
- Storno-Rückforderung (10% Rückstellung)
- Courtage-/Provisions-Abrechnung pro Periode

**Aufwand**: 5-6 Tage

### 1.4 `leads` — Lead-Autopilot

**Frontend existiert**: `/leads`, `/sales-autopilot`

**Was fehlt im Modul:**
- Autopilot-Logik: automatische Kampagnen-Steuerung
- Lead-Qualifizierung: Scoring, Status-Übergänge
- Angebots-Workflow: `preparing → ready → sent → accepted/rejected`
- Integration mit EmailCampaign

**Aufwand**: 3-4 Tage

### 1.5 `audit` — Audit-Trail & Compliance

**Frontend existiert**: `/admin/audit`, `/admin/audit-logs`

**Was fehlt im Modul:**
- AuditLog-Abfragen mit Filter (entity_type, event_type, date range)
- Compliance-Regeln prüfen (GovernanceRules)
- Report-Export (PDF/CSV)
- Datenintegritäts-Checks (orphan records, tenant isolation)

**Aufwand**: 2-3 Tage

### 1.6 `tasks` — Aufgaben-Management

**Frontend existiert**: `/aufgaben`

**Was fehlt im Modul:**
- Task-Zuweisung an User/Team
- Fälligkeits-Checker + Benachrichtigung
- Status-Workflow: `open → in_progress → completed`
- Automatische Task-Erstellung (bei Renewal, Dokument-Upload, etc.)

**Aufwand**: 2-3 Tage

### 1.7 `portal` — Kunden-Portal API

**Frontend existiert**: `/portal/*` (Dashboard, Verträge, Anträge, Dokumente, Profil)

**Was fehlt im Modul:**
- Portal-Login (customer JWT, nicht user JWT)
- Customer-eigene Daten abrufen (nur eigene Verträge/Dokumente)
- Portal-Passwort-Reset
- Portal-Setup-Flow

**Aufwand**: 3-4 Tage

### 1.8 `krankenkassen` — Krankenkassen-Vergleich

**Frontend existiert**: `/krankenkassen-vergleich`, `/vergleichs-analysen`

**Was fehlt im Modul:**
- BAG-Prämiendaten importieren/verwalten
- Vergleichslogik: Prämie × Modell × Franchise × Altersklasse
- Analyse-Speicherung + Status-Workflow
- Angebots-Gruppierung (aktuell, optimiert, angebot 1-5)

**Aufwand**: 4-5 Tage

### 1.9 `enterprise` — Enterprise Governance

**Frontend existiert**: `/admin/improvements`, `/admin/control-center`

**Was fehlt im Modul:**
- EnterpriseIncident: Lebenszyklus `open → investigating → resolved → closed`
- SLA-Monitoring + Verletzungs-Benachrichtigung
- Root-Cause-Clustering (auto-kategorisierung)
- Governance-Rules: `draft → testing → active → deprecated`

**Aufwand**: 3-4 Tage

### 1.10 `backup` — Backup-Management

**Frontend existiert**: `/admin/backup`

**Was fehlt im Modul:**
- Backup-Job auslösen (inkrementell/voll)
- BackupLog-Übersicht + Status
- Wiederherstellungs-Request
- S3-Rotation alter Backups

**Aufwand**: 1-2 Tage

### 1.11 `admin` — Admin-Dashboard API

**Frontend existiert**: `/admin/*` (Team, Security, System Check, Learning Center)

**Was fehlt im Modul:**
- Team-Verwaltung: User CRUD, Rollen, Berechtigungen
- System-Health: aggregierte Metriken
- Security-Einstellungen: Passwort-Richtlinien, 2FA

**Aufwand**: 2-3 Tage

### 1.12 `documents` (Plural) — Dead Module

**Status**: Ordner existiert, aber `document/` (Singular) hat alle Logik.
**Lösung**: Löschen oder als Alias registrieren.

**Aufwand**: 0.5 Tage

---

## 🟠 Phase 2: Frontend-Lücken schließen

Nach Modul-Implementierung fehlen Frontend-Seiten für:

| Entity | Frontend | Priorität |
|--------|----------|-----------|
| Advisor / Broker | `/berater-organisation` existiert, API-Integration prüfen | Hoch |
| CommissionEntry | Finanz-Dashboard + Detailseite | Hoch |
| AccountingEntry | Buchungsübersicht | Hoch |
| Payout | Auszahlungs-Workflow mit Approval | Hoch |
| FinancePeriod | Perioden-Abschluss UI | Mittel |
| Offerte | Innerhalb Ausschreibungen | Mittel |
| Claim | Schadenmeldung + Status | Mittel |
| MutationRequest | Vertragsänderungen | Mittel |
| DuplicateAlert | Dubletten-Bearbeitung | Mittel |
| GovernanceRule | Compliance-Regeln UI | Niedrig |

---

## 🟡 Phase 3: Architektur-Verbesserungen

### 3.1 Entity Registry bereinigen
- `documents` (Plural) aus Registry entfernen → nur `document`
- Aliase für deutsche/englische Namen (`verkaufschancen` ↔ `verkaufschances`)

### 3.2 Validierungsschemas
- Nur `auth` & `customers` haben Zod-Schemas
- Für alle Module Request-Validation hinzufügen

### 3.3 AutomationQueue konsumieren
- Frontend erstellt Records in `AutomationQueue`, aber kein Worker verarbeitet sie
- BullMQ-Worker auf AutomationQueue loslassen oder Frontend auf `document/extract` migrieren

### 3.4 Document Processing Stage korrigieren
- Worker setzt nur bis `entities_detected` — nie bis `customer_mapped` oder `application_created`
- Auto-Contract-Handler muss Processing Stage weiter setzen

---

## 🟢 Phase 4: Stabilisierung & Deployment

### 4.1 Vite Production Build
```bash
npm run build
# → serviert `dist/` via nginx statisch
```

### 4.2 favicon.ico / manifest.json
```bash
touch src/favicon.ico src/manifest.json
```

### 4.3 Portal Whitescreen-Fix (PLAN_FIX.md)
- Relative Pfade in portal `<Routes>` (statt absoluten `/portal/...`)
- Top-Level Route von `path="/"` auf `path="/*"`

### 4.4 Socket.io Vervollständigen
- Realtime Dashboard KPIs
- Live-Benachrichtigungen
- nginx Proxy ist bereits konfiguriert

---

## 📊 Zusammenfassung

| Phase | Module/Features | Aufwand |
|-------|-----------------|---------|
| 🔴 Phase 1 | 12 Backend-Module | ~35 Tage |
| 🟠 Phase 2 | ~10 Frontend-Seiten | ~20 Tage |
| 🟡 Phase 3 | 4 Architektur-Items | ~5 Tage |
| 🟢 Phase 4 | 4 Stabilisierungs-Items | ~3 Tage |
| **Total** | | **~63 Tage** |

### Status Quo
- **59 Prisma Models**: 100% ✅
- **58 Entity Routes (generisch)**: 100% ✅
- **7 Custom Module**: ✅ Auth, Customers, Document, Upload, Functions, Health, Verkaufschancen
- **12 Empty Module**: ❌ applications, contracts, commissions, leads, audit, tasks, portal, krankenkassen, enterprise, backup, admin, documents (dead)
- **KI-Dokumentupload**: ✅ Vollständig implementiert (Pipeline + Frontend)
