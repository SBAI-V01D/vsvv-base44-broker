// ============================================================================
// avaai Backend — Entity Route Registry
//
// Central configuration for all 58 Prisma models. Each entry defines how
// the generic CRUD factory creates list/get/create/update/delete routes.
//
// The CRUD factory uses `(prisma as any)[model]` so `model` must match
// the Prisma client property name (lowercase first letter of the model).
// ============================================================================

import type { CrudConfig } from './crud-factory.js';

export const ENTITY_REGISTRY: CrudConfig[] = [
  // ==========================================================================
  // Core Business Entities
  // ==========================================================================

  {
    model: 'organization',
    prefix: 'organizations',
    searchFields: ['name', 'email', 'type'],
    sortableFields: ['created_at', 'updated_at', 'name'],
    skipTenantFilter: true,
  },
  {
    model: 'user',
    prefix: 'users',
    searchFields: ['email', 'name'],
    sortableFields: ['created_at', 'updated_at', 'email', 'name'],
    permissions: { list: ['admin', 'management'], create: ['admin'], update: ['admin', 'management'], delete: ['admin'] },
  },
  {
    model: 'advisor',
    prefix: 'advisors',
    searchFields: ['email'],
    sortableFields: ['created_at', 'updated_at', 'email'],
  },
  {
    model: 'broker',
    prefix: 'brokers',
    searchFields: ['name', 'email'],
    sortableFields: ['created_at', 'updated_at', 'name'],
  },

  // ==========================================================================
  // Customers & Contracts
  // ==========================================================================

  {
    model: 'customer',
    prefix: 'customers',
    searchFields: ['first_name', 'last_name', 'email'],
    sortableFields: ['created_at', 'updated_at', 'first_name', 'last_name', 'email'],
  },
  {
    model: 'contract',
    prefix: 'contracts',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },
  {
    model: 'contractAdvisor',
    prefix: 'contract-advisors',
    sortableFields: ['created_at'],
  },
  {
    model: 'customerAdvisor',
    prefix: 'customer-advisors',
    sortableFields: ['created_at'],
  },

  // ==========================================================================
  // Applications & Commissions
  // ==========================================================================

  {
    model: 'application',
    prefix: 'applications',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },
  {
    model: 'commission',
    prefix: 'commissions',
    searchFields: ['type', 'status'],
    sortableFields: ['created_at', 'updated_at', 'type', 'status'],
    permissions: { list: ['admin', 'management', 'finance', 'broker', 'backoffice'], get: ['admin', 'management', 'finance', 'broker'], create: ['admin', 'management'], update: ['admin', 'management', 'finance'], delete: ['admin'] },
  },
  {
    model: 'commissionEntry',
    prefix: 'commission-entries',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
    permissions: { list: ['admin', 'management', 'finance', 'broker'], get: ['admin', 'management', 'finance'], create: ['admin', 'management', 'finance'], update: ['admin', 'management', 'finance'], delete: ['admin'] },
  },
  {
    model: 'commissionRate',
    prefix: 'commission-rates',
    sortableFields: ['created_at', 'updated_at'],
    permissions: { list: ['admin', 'management', 'finance'], get: ['admin', 'management', 'finance'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },
  {
    model: 'commissionSplit',
    prefix: 'commission-splits',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
    permissions: { list: ['admin', 'management', 'finance', 'broker'], get: ['admin', 'management', 'finance', 'broker'], create: ['admin', 'management', 'finance'], update: ['admin', 'management', 'finance'], delete: ['admin'] },
  },

  // ==========================================================================
  // Documents & Files
  // ==========================================================================

  {
    model: 'document',
    prefix: 'documents',
    searchFields: ['name'],
    sortableFields: ['created_at', 'updated_at', 'name'],
  },
  {
    model: 'pdfExportLog',
    prefix: 'pdf-export-logs',
    sortableFields: ['created_at'],
    permissions: { list: ['admin', 'management', 'backoffice'], get: ['admin', 'management'], create: ['admin', 'management', 'backoffice'], update: ['admin'], delete: ['admin'] },
  },
  {
    model: 'extractionCorrectionLog',
    prefix: 'extraction-correction-logs',
    sortableFields: ['created_at'],
    permissions: { list: ['admin', 'management'], get: ['admin'], create: ['admin', 'management'], update: ['admin'], delete: ['admin'] },
  },

  // ==========================================================================
  // Tasks & Leads
  // ==========================================================================

  {
    model: 'task',
    prefix: 'tasks',
    searchFields: ['title', 'description', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },
  {
    model: 'lead',
    prefix: 'leads',
    searchFields: ['first_name', 'last_name', 'email', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice', 'support'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management', 'broker', 'backoffice'], update: ['admin', 'management', 'broker', 'backoffice'], delete: ['admin'] },
  },

  // ==========================================================================
  // Messaging & Notifications
  // ==========================================================================

  {
    model: 'notification',
    prefix: 'notifications',
    searchFields: ['type', 'subject', 'status'],
    sortableFields: ['created_at', 'status'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },
  {
    model: 'message',
    prefix: 'messages',
    sortableFields: ['created_at'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice', 'support'], get: ['admin', 'management', 'broker', 'backoffice', 'support'], create: ['admin', 'management', 'broker', 'backoffice', 'support'], update: ['admin', 'management'], delete: ['admin'] },
  },
  {
    model: 'interaction',
    prefix: 'interactions',
    searchFields: ['type', 'subject'],
    sortableFields: ['created_at', 'date'],
  },

  // ==========================================================================
  // Emails & Campaigns
  // ==========================================================================

  {
    model: 'emailTemplate',
    prefix: 'email-templates',
    searchFields: ['name', 'subject', 'description'],
    sortableFields: ['created_at', 'updated_at', 'name'],
  },
  {
    model: 'emailCampaign',
    prefix: 'email-campaigns',
    searchFields: ['name', 'subject', 'status'],
    sortableFields: ['created_at', 'updated_at', 'name', 'status'],
    permissions: { list: ['admin', 'management', 'backoffice', 'broker'], get: ['admin', 'management', 'backoffice', 'broker'], create: ['admin', 'management', 'backoffice'], update: ['admin', 'management', 'backoffice'], delete: ['admin'] },
  },

  // ==========================================================================
  // Finance & Accounting
  // ==========================================================================

  {
    model: 'accountingEntry',
    prefix: 'accounting-entries',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'entry_date', 'amount'],
    permissions: { list: ['admin', 'management', 'finance'], get: ['admin', 'management', 'finance'], create: ['admin', 'management', 'finance'], update: ['admin', 'management', 'finance'], delete: ['admin'] },
  },
  {
    model: 'payout',
    prefix: 'payouts',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'payout_month'],
    permissions: { list: ['admin', 'management', 'finance', 'broker'], get: ['admin', 'management', 'finance', 'broker'], create: ['admin', 'management', 'finance'], update: ['admin', 'management', 'finance'], delete: ['admin'] },
  },
  {
    model: 'financePeriod',
    prefix: 'finance-periods',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at'],
    permissions: { list: ['admin', 'management', 'finance'], get: ['admin', 'management', 'finance'], create: ['admin', 'management'], update: ['admin', 'management', 'finance'], delete: ['admin'] },
  },
  {
    model: 'stornoConfig',
    prefix: 'storno-configs',
    searchFields: ['name'],
    sortableFields: ['created_at', 'updated_at', 'name'],
    permissions: { list: ['admin', 'management', 'finance'], get: ['admin', 'management', 'finance'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },

  // ==========================================================================
  // Insurance-Specific
  // ==========================================================================

  {
    model: 'bAGPraemienDaten',
    prefix: 'bag-praemien-daten',
    sortableFields: ['created_at', 'jahr', 'praemie_erwachsene'],
    permissions: { list: ['admin', 'management', 'backoffice', 'broker'], get: ['admin', 'management', 'backoffice', 'broker'], create: ['admin', 'management', 'backoffice'], update: ['admin', 'management', 'backoffice'], delete: ['admin'] },
  },
  {
    model: 'krankenkassenVergleich',
    prefix: 'krankenkassen-vergleiche',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management', 'broker', 'backoffice'], update: ['admin', 'management', 'broker', 'backoffice'], delete: ['admin'] },
  },
  {
    model: 'comparisonEntry',
    prefix: 'comparison-entries',
    sortableFields: ['created_at', 'praemie_monatlich'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management', 'broker', 'backoffice'], update: ['admin', 'management', 'broker', 'backoffice'], delete: ['admin'] },
  },
  {
    model: 'vergleichsAnalyse',
    prefix: 'vergleichs-analysen',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },
  {
    model: 'versichererDB',
    prefix: 'versicherer-db',
    searchFields: ['name', 'email'],
    sortableFields: ['created_at', 'updated_at', 'name'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management', 'backoffice'], update: ['admin', 'management', 'backoffice'], delete: ['admin'] },
  },
  {
    model: 'insuranceKnowledgePattern',
    prefix: 'insurance-knowledge-patterns',
    searchFields: ['description'],
    sortableFields: ['created_at', 'updated_at'],
    permissions: { list: ['admin', 'management', 'broker'], get: ['admin', 'management', 'broker'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },

  // ==========================================================================
  // Ausschreibungen & Offers
  // ==========================================================================

  {
    model: 'ausschreibung',
    prefix: 'ausschreibungen',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },
  {
    model: 'offerte',
    prefix: 'offerten',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management', 'broker', 'backoffice'], update: ['admin', 'management', 'broker', 'backoffice'], delete: ['admin'] },
  },

  // ==========================================================================
  // Partners & Activities
  // ==========================================================================

  {
    model: 'partner',
    prefix: 'partners',
    searchFields: ['name', 'email'],
    sortableFields: ['created_at', 'updated_at', 'name'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management'], update: ['admin', 'management', 'backoffice'], delete: ['admin'] },
  },
  {
    model: 'partnerActivity',
    prefix: 'partner-activities',
    searchFields: ['description'],
    sortableFields: ['created_at'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management', 'broker', 'backoffice'], update: ['admin', 'management', 'backoffice'], delete: ['admin'] },
  },
  {
    model: 'partnerDocument',
    prefix: 'partner-documents',
    sortableFields: ['created_at', 'updated_at'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management', 'backoffice'], update: ['admin', 'management', 'backoffice'], delete: ['admin'] },
  },

  // ==========================================================================
  // Claims & Incidents
  // ==========================================================================

  {
    model: 'claim',
    prefix: 'claims',
    searchFields: ['title', 'description', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status', 'incident_date'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice', 'support'], get: ['admin', 'management', 'broker', 'backoffice', 'support'], create: ['admin', 'management', 'broker', 'backoffice'], update: ['admin', 'management', 'broker', 'backoffice'], delete: ['admin'] },
  },
  {
    model: 'deal',
    prefix: 'deals',
    searchFields: ['title'],
    sortableFields: ['created_at', 'updated_at'],
    permissions: { list: ['admin', 'management', 'broker'], get: ['admin', 'management', 'broker'], create: ['admin', 'management', 'broker'], update: ['admin', 'management', 'broker'], delete: ['admin'] },
  },
  {
    model: 'verkaufschance',
    prefix: 'verkaufschancen',
    searchFields: ['title', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
    permissions: { list: ['admin', 'management', 'broker'], get: ['admin', 'management', 'broker'], create: ['admin', 'management', 'broker'], update: ['admin', 'management', 'broker'], delete: ['admin'] },
  },

  // ==========================================================================
  // Advisory & AI
  // ==========================================================================

  {
    model: 'advisoryDossier',
    prefix: 'advisory-dossiers',
    searchFields: ['title', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },
  {
    model: 'dossierSnapshot',
    prefix: 'dossier-snapshots',
    sortableFields: ['created_at'],
  },
  {
    model: 'mutationRequest',
    prefix: 'mutation-requests',
    searchFields: ['description', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },
  {
    model: 'pricingSuggestion',
    prefix: 'pricing-suggestions',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at'],
    permissions: { list: ['admin', 'management', 'broker'], get: ['admin', 'management', 'broker'], create: ['admin', 'management', 'broker'], update: ['admin', 'management', 'broker'], delete: ['admin'] },
  },
  {
    model: 'aiFinding',
    prefix: 'ai-findings',
    searchFields: ['title', 'description', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status', 'confidence_score'],
    permissions: { list: ['admin', 'management', 'broker', 'backoffice'], get: ['admin', 'management', 'broker', 'backoffice'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },
  {
    model: 'aiReview',
    prefix: 'ai-reviews',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
    permissions: { list: ['admin', 'management', 'broker'], get: ['admin', 'management', 'broker'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },

  // ==========================================================================
  // Enterprise Management
  // ==========================================================================

  {
    model: 'enterpriseImprovement',
    prefix: 'enterprise-improvements',
    searchFields: ['title', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status', 'priority'],
  },
  {
    model: 'enterpriseIncident',
    prefix: 'enterprise-incidents',
    searchFields: ['title', 'description', 'status'],
    sortableFields: ['created_at', 'updated_at', 'status', 'severity'],
  },
  {
    model: 'governanceRule',
    prefix: 'governance-rules',
    searchFields: ['name', 'description'],
    sortableFields: ['created_at', 'updated_at', 'name'],
    permissions: { list: ['admin', 'management', 'compliance'], get: ['admin', 'management', 'compliance'], create: ['admin', 'compliance'], update: ['admin', 'compliance'], delete: ['admin'] },
  },
  {
    model: 'governanceScoreSnapshot',
    prefix: 'governance-score-snapshots',
    sortableFields: ['created_at', 'snapshot_date'],
    permissions: { list: ['admin', 'management', 'compliance'], get: ['admin', 'management', 'compliance'], create: ['admin', 'compliance'], update: ['admin', 'compliance'], delete: ['admin'] },
  },
  {
    model: 'duplicateAlert',
    prefix: 'duplicate-alerts',
    searchFields: ['status'],
    sortableFields: ['created_at', 'updated_at', 'status'],
  },

  // ==========================================================================
  // Logs & Audit
  // ==========================================================================

  {
    model: 'auditLog',
    prefix: 'audit-logs',
    sortableFields: ['created_at', 'entity_type', 'action'],
    permissions: { list: ['admin', 'management', 'compliance'], get: ['admin', 'management', 'compliance'], create: ['admin', 'management', 'backoffice'], update: ['admin'], delete: ['admin'] },
  },
  {
    model: 'systemLog',
    prefix: 'system-logs',
    searchFields: ['message', 'source', 'level'],
    sortableFields: ['created_at', 'level'],
    permissions: { list: ['admin', 'management', 'backoffice'], get: ['admin', 'management', 'backoffice'], create: ['admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance'], update: ['admin'], delete: ['admin'] },
  },
  {
    model: 'errorLog',
    prefix: 'error-logs',
    searchFields: ['status'],
    sortableFields: ['created_at'],
    permissions: { list: ['admin'], get: ['admin'], create: ['admin', 'management', 'backoffice'], update: ['admin'], delete: ['admin'] },
  },
  {
    model: 'backupLog',
    prefix: 'backup-logs',
    searchFields: ['status'],
    sortableFields: ['created_at'],
    permissions: { list: ['admin'], get: ['admin'], create: ['admin'], update: ['admin'], delete: ['admin'] },
  },

  // ==========================================================================
  // Status & Automation
  // ==========================================================================

  {
    model: 'statusDefinition',
    prefix: 'status-definitions',
    searchFields: ['type'],
    sortableFields: ['created_at', 'updated_at', 'type', 'sort_order'],
    permissions: { list: ['admin', 'management', 'backoffice'], get: ['admin', 'management', 'backoffice'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },
  {
    model: 'statusHistory',
    prefix: 'status-histories',
    sortableFields: ['created_at'],
    permissions: { list: ['admin', 'management', 'backoffice'], get: ['admin', 'management', 'backoffice'], create: ['admin', 'management', 'backoffice'], update: ['admin'], delete: ['admin'] },
  },
  {
    model: 'automationQueue',
    prefix: 'automation-queues',
    searchFields: ['status'],
    sortableFields: ['created_at', 'started_at'],
    permissions: { list: ['admin', 'management'], get: ['admin', 'management'], create: ['admin', 'management'], update: ['admin', 'management'], delete: ['admin'] },
  },

  // ==========================================================================
  // Misc / Other
  // ==========================================================================

  {
    model: 'refreshToken',
    prefix: 'refresh-tokens',
    sortableFields: ['created_at', 'expires_at'],
    permissions: { list: ['admin'], get: ['admin'], create: ['admin'], update: ['admin'], delete: ['admin'] },
  },
];

export default ENTITY_REGISTRY;
