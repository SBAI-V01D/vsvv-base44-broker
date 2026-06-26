// ============================================================================
// avaai Backend — DSGVO/FINMA-Compliant Access Audit Middleware
//
// Records read and write access to personal data for compliance with:
// - DSGVO Art. 5(1)(f) — Integrity and confidentiality
// - DSGVO Art. 30 — Records of processing activities
// - FINMA Circular 2023/XX — Data protection for financial intermediaries
//
// The middleware hooks into Fastify's onResponse lifecycle and logs
// access to sensitive entities (customer data, contracts, documents).
// ============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// Sensitive entity routes that contain personal data (DSGVO-relevant)
// ---------------------------------------------------------------------------

/** Route prefixes that contain personenbezogene Daten */
const SENSITIVE_ROUTE_PREFIXES = [
  '/api/customers',
  '/api/contracts',
  '/api/documents',
  '/api/users',
  '/api/leads',
  '/api/applications',
  '/api/claims',
  '/api/commissions',
  '/api/commission-entries',
  '/api/payouts',
  '/api/advisors',
  '/api/brokers',
  '/api/partners',
  '/api/interactions',
  '/api/messages',
  '/api/notifications',
  '/api/advisory-dossiers',
  '/api/mutation-requests',
  '/api/offerten',
  '/api/ausschreibungen',
  '/api/accounting-entries',
];

/** HTTP methods that mutate data */
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** HTTP methods that read data */
const READ_METHODS = ['GET'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditEntry {
  timestamp: Date;
  user_id: string | null;
  organization_id: string | null;
  method: string;
  route: string;
  action: 'read' | 'write' | 'export';
  entity_type: string;
  entity_id: string | null;
  ip: string;
  user_agent: string;
  status_code: number;
}

// ---------------------------------------------------------------------------
// URL Parser — extracts entity type and ID from URL
// ---------------------------------------------------------------------------

/**
 * Route plural → AuditEntityType enum value mapping.
 * Must match the AuditEntityType enum in schema.prisma.
 */
const ROUTE_TO_AUDIT_ENTITY: Record<string, string> = {
  customers: 'customer',
  applications: 'application',
  contracts: 'contract',
  commissions: 'commission',
  tasks: 'task',
  documents: 'document',
  organizations: 'organization',
  advisors: 'advisor',
  brokers: 'customer',
  leads: 'customer',
  claims: 'customer',
  users: 'customer',
  'commission-entries': 'commission',
  payouts: 'commission',
  partners: 'organization',
  interactions: 'task',
  messages: 'task',
  notifications: 'task',
  'advisory-dossiers': 'document',
  'mutation-requests': 'contract',
  offerten: 'contract',
  ausschreibungen: 'application',
  'accounting-entries': 'commission',
};

function parseEntityInfo(url: string): { entityType: string; entityId: string | null } {
  // Pattern: /api/{entity-type}/{id}?...
  const urlPath = url.split('?')[0];
  const parts = urlPath.split('/').filter(Boolean);

  if (parts.length >= 2 && parts[0] === 'api') {
    const routeName = parts[1] || 'unknown';
    const entityType = ROUTE_TO_AUDIT_ENTITY[routeName] || 'customer';
    const entityId = parts[2] || null;
    return { entityType, entityId };
  }

  return { entityType: 'customer', entityId: null };
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

function isSensitiveRoute(url: string): boolean {
  const urlPath = url.split('?')[0];
  return SENSITIVE_ROUTE_PREFIXES.some((prefix) => urlPath.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Audit Logger — writes access to database
// ---------------------------------------------------------------------------

/**
 * Write an audit log entry for a data access event.
 * This is fire-and-forget to avoid impacting response latency.
 */
async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    // Map action to AuditEventType enum values from schema.prisma
    const auditAction = entry.action === 'write' ? 'update' : 'allow';

    await prisma.auditLog.create({
      data: {
        audit_id: `access-${entry.timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: entry.timestamp,
        trigger_type: 'api',
        actor_type: 'user',
        actor_name: entry.user_id ?? 'anonymous',
        entity_type: entry.entity_type as any, // validated via ROUTE_TO_AUDIT_ENTITY
        entity_id: entry.entity_id ?? 'list',
        action: auditAction as any,
        audit_level: 1,
        audit_level_name: 'access_log',
        organization_id: entry.organization_id,
        ip_address: entry.ip,
        // Store request metadata in the error_message field (repurposed for access logging)
        error_message: `${entry.method} ${entry.route} (${entry.status_code}) [${entry.user_agent}]`,
        // Store additional context in metadata JSON
        metadata: {
          method: entry.method,
          route: entry.route,
          user_agent: entry.user_agent,
          status_code: entry.status_code,
          action: entry.action,
        },
      },
    });
  } catch {
    // Audit log failures MUST NOT break the application
    // Log to console as fallback
    console.error('[AUDIT] Failed to write audit log:', entry.entity_type, entry.action);
  }
}

// ---------------------------------------------------------------------------
// Audited Route Middleware Factory
// ---------------------------------------------------------------------------

/**
 * Creates an onResponse hook that audits access to sensitive data.
 *
 * Usage in app.ts:
 *   app.addHook('onResponse', createAuditHook());
 */
export function createAuditHook() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Only audit sensitive entity routes
    if (!isSensitiveRoute(request.url)) {
      return;
    }

    // Skip if no user context (unauthenticated requests to public routes)
    if (!request.user) {
      return;
    }

    // Determine action type
    const method = request.method;
    let action: 'read' | 'write' | 'export';
    if (MUTATING_METHODS.includes(method)) {
      action = 'write';
    } else if (READ_METHODS.includes(method)) {
      action = 'read';
    } else {
      return;
    }

    // Skip successful responses only (avoid logging 4xx/5xx as data access)
    const statusCode = reply.statusCode;
    if (statusCode >= 400) {
      return;
    }

    // Parse URL for entity info
    const { entityType, entityId } = parseEntityInfo(request.url);

    const entry: AuditEntry = {
      timestamp: new Date(),
      user_id: request.user.id,
      organization_id: request.user.organization_id,
      method,
      route: request.url.split('?')[0],
      action,
      entity_type: entityType,
      entity_id: entityId,
      ip: request.ip,
      user_agent: (request.headers['user-agent'] as string) || 'unknown',
      status_code: statusCode,
    };

    // Fire-and-forget to not block the response
    writeAuditLog(entry);
  };
}

// ---------------------------------------------------------------------------
// Helper: configurable audit for specific routes
// ---------------------------------------------------------------------------

/**
 * preHandler that marks a request for enhanced audit logging.
 * Use on routes that need extra scrutiny (e.g., document downloads, data exports).
 */
export function requireAudit(request: FastifyRequest): void {
  // Mark request for enhanced logging
  (request as any).__audit_enhanced = true;
}
