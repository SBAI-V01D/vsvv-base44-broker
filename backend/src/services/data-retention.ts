// ============================================================================
// avaai Backend — Data Retention & Right-to-be-Forgotten Service
//
// DSGVO Art. 17 (Right to erasure / "Right to be forgotten")
// FINMA Circular 2023/XX — 10-year retention period for financial records
//
// This service provides:
// 1. Hard-deletion of archived records after retention period expires
// 2. Anonymization of PII data as alternative to full deletion
// 3. Compliance-safe deletion with audit trail
// ============================================================================

import { prisma } from '../lib/prisma.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeletionResult {
  deletedCount: number;
  anonymizedCount: number;
  auditEntries: number;
}

export interface AnonymizationOptions {
  /** If true, replaces PII with '[REDACTED - DSGVO Art. 17]' */
  replaceWithPlaceholder?: boolean;
  /** If true, keeps financial/contract data but removes person data */
  keepFinancialRecords?: boolean;
}

// ---------------------------------------------------------------------------
// PII fields per entity (must be anonymized for DSGVO compliance)
// ---------------------------------------------------------------------------

const PII_FIELDS: Record<string, string[]> = {
  customer: [
    'first_name', 'last_name', 'email', 'phone', 'mobile',
    'street', 'zip_code', 'city', 'birthdate', 'ahv_number',
    'bank_account', 'profession', 'nationality', 'notes',
    'company_name', 'contact_person_firstname', 'contact_person_lastname',
    'uid_number', 'portal_password_hash',
  ],
  user: [
    'name', 'email', 'phone', 'mobile',
  ],
  lead: [
    'first_name', 'last_name', 'email', 'phone', 'company', 'notes',
  ],
};

// ---------------------------------------------------------------------------
// Anonymization
// ---------------------------------------------------------------------------

/**
 * Anonymize a record by replacing PII fields with placeholder values.
 * Keeps the record for financial/contractual reference (FINMA requirement)
 * but removes all personal identifiable information.
 *
 * @param entityType - Prisma model name (e.g., 'customer', 'user', 'lead')
 * @param recordId - UUID of the record to anonymize
 * @param options - Anonymization options
 */
export async function anonymizeRecord(
  entityType: string,
  recordId: string,
  options: AnonymizationOptions = {},
): Promise<boolean> {
  const fields = PII_FIELDS[entityType];
  if (!fields) return false;

  const placeholder = options.replaceWithPlaceholder !== false
    ? '[REDACTED - DSGVO Art. 17]'
    : null;

  const updateData: Record<string, unknown> = {};

  for (const field of fields) {
    if (placeholder) {
      updateData[field] = placeholder;
    } else {
      updateData[field] = null;
    }
  }

  const prismaModel = (prisma as any)[entityType];
  if (!prismaModel?.update) return false;

  try {
    await prismaModel.update({
      where: { id: recordId },
      data: updateData,
    });

    // Create audit trail for the anonymization
    await prisma.auditLog.create({
      data: {
        audit_id: `anonymize-${recordId}-${Date.now()}`,
        timestamp: new Date(),
        trigger_type: 'scheduled',
        actor_type: 'system',
        actor_name: 'data-retention-service',
        entity_type: entityType as any,
        entity_id: recordId,
        action: 'archive',
        audit_level: 1,
        audit_level_name: 'data_retention',
        error_message: `DSGVO Art. 17 — Record anonymized. ${fields.length} PII fields redacted.`,
      },
    });

    return true;
  } catch {
    console.error(`[DATA-RETENTION] Failed to anonymize ${entityType}/${recordId}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Hard Deletion
// ---------------------------------------------------------------------------

/**
 * Permanently hard-delete an archived record.
 * ONLY allowed if the retention period (default: 10 years FINMA) has passed.
 *
 * @param entityType - Prisma model name
 * @param recordId - UUID of the record to hard-delete
 * @param retentionYears - FINMA retention period in years (default: 10)
 */
export async function hardDeleteRecord(
  entityType: string,
  recordId: string,
  retentionYears = 10,
): Promise<{ success: boolean; message: string }> {
  const prismaModel = (prisma as any)[entityType];
  if (!prismaModel?.delete) {
    return { success: false, message: `Entity type '${entityType}' does not support deletion` };
  }

  try {
    // Verify record exists and is archived
    const record = await prismaModel.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      return { success: false, message: 'Record not found' };
    }

    if (!record.archived) {
      return {
        success: false,
        message: 'Record must be archived before hard-deletion. Use soft-delete first.',
      };
    }

    // Check retention period (FINMA: 10 years)
    if (record.archived_at) {
      const retentionDate = new Date(record.archived_at);
      retentionDate.setFullYear(retentionDate.getFullYear() + retentionYears);

      if (new Date() < retentionDate) {
        const remainingMs = retentionDate.getTime() - Date.now();
        const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
        return {
          success: false,
          message: `Record is within FINMA ${retentionYears}-year retention period. ${remainingDays} days remaining until eligible for deletion.`,
        };
      }
    }

    // Create audit trail BEFORE deletion
    await prisma.auditLog.create({
      data: {
        audit_id: `hard-delete-${recordId}-${Date.now()}`,
        timestamp: new Date(),
        trigger_type: 'scheduled',
        actor_type: 'system',
        actor_name: 'data-retention-service',
        entity_type: entityType as any,
        entity_id: recordId,
        action: 'delete',
        audit_level: 2,
        audit_level_name: 'data_retention',
        error_message: `DSGVO Art. 17 — Permanent hard-deletion of archived ${entityType} record (retention period: ${retentionYears} years).`,
      },
    });

    // Hard delete
    await prismaModel.delete({
      where: { id: recordId },
    });

    return { success: true, message: `Record ${recordId} permanently deleted` };
  } catch (error: any) {
    return {
      success: false,
      message: `Deletion failed: ${error.message || 'Unknown error'}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Batch Operations
// ---------------------------------------------------------------------------

/**
 * Purge all archived records that have passed their retention period.
 * Called by scheduled job (e.g., daily cron / BullMQ worker).
 *
 * @param retentionYears - FINMA retention period in years
 */
export async function purgeExpiredRecords(
  retentionYears = 10,
): Promise<DeletionResult> {
  const result: DeletionResult = { deletedCount: 0, anonymizedCount: 0, auditEntries: 0 };

  const entities = ['customer', 'user', 'lead'];

  for (const entityType of entities) {
    const prismaModel = (prisma as any)[entityType];
    if (!prismaModel?.findMany) continue;

    // Find all archived records past retention period
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() - retentionYears);

    const expiredRecords = await prismaModel.findMany({
      where: {
        archived: true,
        archived_at: { lte: retentionDate },
      },
      select: { id: true },
    });

    for (const record of expiredRecords) {
      await hardDeleteRecord(entityType, record.id, retentionYears);
      result.deletedCount++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Admin Check Endpoint Helper
// ---------------------------------------------------------------------------

/**
 * Get the DSGVO/FINMA compliance status for a record.
 * Returns whether it's eligible for deletion or anonymization.
 */
export async function getComplianceStatus(
  entityType: string,
  recordId: string,
  retentionYears = 10,
): Promise<{
  exists: boolean;
  archived: boolean;
  eligibleForHardDelete: boolean;
  eligibleForAnonymization: boolean;
  archivedAt: string | null;
  retentionEndDate: string | null;
  remainingDays: number | null;
}> {
  const prismaModel = (prisma as any)[entityType];
  if (!prismaModel?.findUnique) {
    return {
      exists: false,
      archived: false,
      eligibleForHardDelete: false,
      eligibleForAnonymization: false,
      archivedAt: null,
      retentionEndDate: null,
      remainingDays: null,
    };
  }

  const record = await prismaModel.findUnique({
    where: { id: recordId },
    select: { id: true, archived: true, archived_at: true },
  });

  if (!record) {
    return {
      exists: false,
      archived: false,
      eligibleForHardDelete: false,
      eligibleForAnonymization: false,
      archivedAt: null,
      retentionEndDate: null,
      remainingDays: null,
    };
  }

  let eligibleForHardDelete = false;
  let retentionEndDate: string | null = null;
  let remainingDays: number | null = null;

  if (record.archived && record.archived_at) {
    const endDate = new Date(record.archived_at);
    endDate.setFullYear(endDate.getFullYear() + retentionYears);
    retentionEndDate = endDate.toISOString();

    const now = new Date();
    remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    eligibleForHardDelete = now >= endDate;
  }

  return {
    exists: true,
    archived: record.archived,
    eligibleForHardDelete,
    eligibleForAnonymization: record.archived || true,
    archivedAt: record.archived_at?.toISOString() ?? null,
    retentionEndDate,
    remainingDays,
  };
}
