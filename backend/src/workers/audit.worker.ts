import { type Job } from 'bullmq'
import { prisma } from '../lib/prisma.js'
import { createWorker, QueueName } from '../lib/queue.js'
import { DeepAuditEngine } from '../services/deep-audit-engine.js'
import { emitToOrganization } from '../lib/socket.js'
import { randomUUID } from 'node:crypto'

export interface AuditJobData {
  organizationId: string
  userId: string
  run_auto_fix?: boolean
}

async function handleAuditJob(job: Job<AuditJobData>): Promise<void> {
  const { organizationId, userId, run_auto_fix } = job.data
  const scanId = randomUUID()

  console.info(`[AUDIT WORKER] Starting deep audit scan ${scanId} for org ${organizationId}`)

  emitToOrganization('audit:status', { scanId, stage: 'starting' }, organizationId)

  // Update/create scan record
  await prisma.$executeRawUnsafe(
    `INSERT INTO enterprise_incident (id, title, description, status, severity, category, organization_id, created_at)
     VALUES ($1, $2, $3, 'in_progress', 'info', 'audit_scan', $4, NOW())
     ON CONFLICT DO NOTHING`,
    scanId,
    `Deep Audit Scan ${new Date().toISOString().slice(0, 10)}`,
    'Systematischer Deep-Audit-Scan aller Datenbereiche',
    organizationId,
  )

  try {
    const engine = new DeepAuditEngine({
      organization_id: organizationId,
      scan_id: scanId,
      run_auto_fix,
    })

    const report = await engine.runFullScan()

    // Store findings in the database
    for (const finding of report.findings) {
      try {
        await prisma.aiFinding.create({
          data: {
            title: finding.title,
            description: finding.description,
            severity: finding.severity as any,
            finding_type: finding.category === 'orphans' ? 'orphan_relationship'
              : finding.category === 'compliance' ? 'compliance_gap'
              : finding.category === 'duplicates' ? 'duplicate_detected'
              : finding.category === 'audit_trail' ? 'audit_gap'
              : finding.category === 'pdf_integrity' ? 'data_quality'
              : finding.category === 'auto_fixed' ? 'data_quality'
              : 'other',
            status: 'new',
            evidence_strength: (finding.severity === 'critical' || finding.severity === 'blocking' ? 'strong' : 'moderate') as any,
            false_positive_risk: (finding.severity === 'critical' ? 'low' : 'medium') as any,
            organization_id: organizationId,
            confidence_score: finding.severity === 'blocking' ? 0.99 : finding.severity === 'critical' ? 0.95 : finding.severity === 'warning' ? 0.8 : 0.6,
            notes: JSON.stringify({ scan_id: scanId, ...finding.evidence }),
            entity_type: finding.entity_type,
            entity_id: finding.entity_id,
            evidence: finding.evidence as any,
          },
        })
      } catch (err) {
        console.warn(`[AUDIT WORKER] Failed to store finding: ${(err as Error).message}`)
      }
    }

    // Store the scan report as an enterprise incident with resolved status
    const severity = report.score.overall >= 90 ? 'info'
      : report.score.overall >= 75 ? 'warning'
      : report.score.overall >= 50 ? 'high'
      : 'critical'

    await prisma.$executeRawUnsafe(
      `UPDATE enterprise_incident
       SET status = 'resolved', severity = $1, description = $2, updated_at = NOW()
       WHERE id = $3`,
      severity,
      JSON.stringify({
        score: report.score,
        summary: report.summary,
        duration_ms: report.duration_ms,
        completed_at: report.completed_at,
      }),
      scanId,
    )

    emitToOrganization('audit:complete', {
      scanId,
      score: report.score,
      summary: report.summary,
      duration_ms: report.duration_ms,
    }, organizationId)

    console.info(`[AUDIT WORKER] ✅ Scan ${scanId} complete — score: ${report.score.overall}, findings: ${report.summary.total_findings}`)
  } catch (error: any) {
    console.error(`[AUDIT WORKER] ❌ Scan ${scanId} failed:`, error.message)

    await prisma.$executeRawUnsafe(
      `UPDATE enterprise_incident SET status = 'mitigation_active', description = $1, updated_at = NOW() WHERE id = $2`,
      `Scan failed: ${error.message}`,
      scanId,
    )

    emitToOrganization('audit:error', { scanId, error: error.message }, organizationId)
    throw error
  }
}

let _worker: ReturnType<typeof createWorker> | null = null

export function startAuditWorker(): void {
  if (_worker) {
    console.warn('[AUDIT WORKER] Already running')
    return
  }

  _worker = createWorker({
    queueName: QueueName.AUDIT,
    handler: handleAuditJob,
    concurrency: 1,
  })

  console.info('[AUDIT WORKER] Started — waiting for scan jobs...')
}

export async function stopAuditWorker(): Promise<void> {
  if (_worker) {
    await _worker.close()
    _worker = null
    console.info('[AUDIT WORKER] Stopped')
  }
}
