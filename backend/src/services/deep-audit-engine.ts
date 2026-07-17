import { prisma } from '../lib/prisma.js'
import { getFileBuffer } from './file-storage.js'
import { spawn } from 'node:child_process'
import { Readable } from 'node:stream'

export interface AuditFinding {
  id: string
  severity: 'info' | 'warning' | 'critical' | 'blocking'
  category: string
  title: string
  description: string
  entity_type: string | null
  entity_id: string | null
  recommendation: string | null
  auto_fixable: boolean
  evidence: Record<string, unknown>
}

export interface ScanReport {
  scan_id: string
  organization_id: string
  started_at: string
  completed_at: string
  duration_ms: number
  summary: {
    total_findings: number
    by_severity: Record<string, number>
    by_category: Record<string, number>
    auto_fixable_count: number
  }
  findings: AuditFinding[]
  score: {
    overall: number
    data_integrity: number
    compliance: number
    duplicates: number
    audit_trail: number
    pdf_integrity: number
  }
}

export interface ScanConfig {
  organization_id: string
  scan_id: string
  run_auto_fix?: boolean
}

// ============================================================================
// DEEP AUDIT ENGINE
// ============================================================================

export class DeepAuditEngine {
  private findings: AuditFinding[] = []
  private orgId: string
  private scanId: string
  private runAutoFix: boolean
  private startTime: number

  constructor(config: ScanConfig) {
    this.orgId = config.organization_id
    this.scanId = config.scan_id
    this.runAutoFix = config.run_auto_fix ?? false
    this.startTime = Date.now()
  }

  // --------------------------------------------------------------------------
  // Run all scans
  // --------------------------------------------------------------------------
  async runFullScan(): Promise<ScanReport> {
    this.findings = []

    await Promise.all([
      this.scanDataIntegrity(),
      this.scanOrphans(),
      this.scanCompliance(),
      this.scanDuplicates(),
      this.scanPdfIntegrity(),
      this.scanAuditTrail(),
    ])

    // AI Findings scan (separate — uses existing AiFinding table)
    await this.scanAiFindings()

    // Auto-fix if requested
    if (this.runAutoFix) {
      await this.runAutoFixes()
    }

    const completedAt = new Date().toISOString()
    const durationMs = Date.now() - this.startTime

    const bySeverity: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    let autoFixableCount = 0

    for (const f of this.findings) {
      bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1
      byCategory[f.category] = (byCategory[f.category] ?? 0) + 1
      if (f.auto_fixable) autoFixableCount++
    }

    const scores = this.calculateScores()

    return {
      scan_id: this.scanId,
      organization_id: this.orgId,
      started_at: new Date(this.startTime).toISOString(),
      completed_at: completedAt,
      duration_ms: durationMs,
      summary: {
        total_findings: this.findings.length,
        by_severity: bySeverity,
        by_category: byCategory,
        auto_fixable_count: autoFixableCount,
      },
      findings: this.findings,
      score: scores,
    }
  }

  // --------------------------------------------------------------------------
  // 1. Data Integrity Scan
  // --------------------------------------------------------------------------
  private async scanDataIntegrity(): Promise<void> {
    // Customers without email
    const noEmail = await prisma.customer.count({
      where: { organization_id: this.orgId, archived: false, email: null },
    })
    if (noEmail > 0) {
      this.addFinding({
        severity: noEmail > 50 ? 'warning' : 'info',
        category: 'data_integrity',
        title: 'Kunden ohne E-Mail-Adresse',
        description: `${noEmail} Kunden haben keine hinterlegte E-Mail-Adresse`,
        entity_type: 'customer',
        entity_id: null,
        recommendation: 'E-Mail-Adressen für diese Kunden ergänzen oder als "keine E-Mail" markieren',
        auto_fixable: false,
        evidence: { count: noEmail },
      })
    }

    // Contracts without end_date (active)
    const noEndDate = await prisma.contract.count({
      where: { organization_id: this.orgId, archived: false, status: 'active', end_date: null },
    })
    if (noEndDate > 0) {
      this.addFinding({
        severity: noEndDate > 20 ? 'warning' : 'info',
        category: 'data_integrity',
        title: 'Aktive Verträge ohne Enddatum',
        description: `${noEndDate} aktive Verträge haben kein Enddatum`,
        entity_type: 'contract',
        entity_id: null,
        recommendation: 'Enddaten für aktive Verträge prüfen und ergänzen',
        auto_fixable: false,
        evidence: { count: noEndDate },
      })
    }

    // Applications stuck in 'new' for >30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const stuckApps = await prisma.application.count({
      where: {
        organization_id: this.orgId,
        archived: false,
        status: 'new',
        created_at: { lt: thirtyDaysAgo },
      },
    })
    if (stuckApps > 0) {
      this.addFinding({
        severity: stuckApps > 10 ? 'critical' : 'warning',
        category: 'data_integrity',
        title: 'Anträge seit >30 Tagen im Status "Neu"',
        description: `${stuckApps} Anträge sind seit mehr als 30 Tagen im Status "new"`,
        entity_type: 'application',
        entity_id: null,
        recommendation: 'Anträge prüfen und weiterbearbeiten oder archivieren',
        auto_fixable: false,
        evidence: { count: stuckApps, days: 30 },
      })
    }
  }

  // --------------------------------------------------------------------------
  // 2. Orphan Scan
  // --------------------------------------------------------------------------
  private async scanOrphans(): Promise<void> {
    const allCustomerIds = (
      await prisma.customer.findMany({
        where: { organization_id: this.orgId },
        select: { id: true },
      })
    ).map((c) => c.id)

    if (allCustomerIds.length === 0) return

    const orphanContracts = await prisma.contract.count({
      where: {
        organization_id: this.orgId,
        customer_id: { notIn: allCustomerIds },
        archived: false,
      },
    })
    if (orphanContracts > 0) {
      this.addFinding({
        severity: 'critical',
        category: 'orphans',
        title: 'Verwaiste Verträge',
        description: `${orphanContracts} Verträge ohne zugehörigen Kunden`,
        entity_type: 'contract',
        entity_id: null,
        recommendation: 'Verträge manuell prüfen und Kunden zuordnen oder archivieren',
        auto_fixable: false,
        evidence: { count: orphanContracts },
      })
    }

    const orphanApplications = await prisma.application.count({
      where: {
        organization_id: this.orgId,
        customer_id: { notIn: allCustomerIds },
        archived: false,
      },
    })
    if (orphanApplications > 0) {
      this.addFinding({
        severity: 'critical',
        category: 'orphans',
        title: 'Verwaiste Anträge',
        description: `${orphanApplications} Anträge ohne zugehörigen Kunden`,
        entity_type: 'application',
        entity_id: null,
        recommendation: 'Anträge prüfen und Kunden zuordnen',
        auto_fixable: false,
        evidence: { count: orphanApplications },
      })
    }

    const orphanDocuments = await prisma.document.count({
      where: {
        organization_id: this.orgId,
        customer_id: { not: null, notIn: allCustomerIds },
        archived: false,
      },
    })
    if (orphanDocuments > 0) {
      this.addFinding({
        severity: 'warning',
        category: 'orphans',
        title: 'Verwaiste Dokumente',
        description: `${orphanDocuments} Dokumente ohne zugehörigen Kunden (mit customer_id)`,
        entity_type: 'document',
        entity_id: null,
        recommendation: 'Dokumente prüfen und Kunden zuordnen',
        auto_fixable: false,
        evidence: { count: orphanDocuments },
      })
    }
  }

  // --------------------------------------------------------------------------
  // 3. Compliance Scan
  // --------------------------------------------------------------------------
  private async scanCompliance(): Promise<void> {
    // Check GovernanceRules for active blocking rules
    const activeRules = await prisma.governanceRule.findMany({
      where: {
        organization_id: this.orgId,
        rule_status: 'active',
        enforcement_mode: { in: ['enforce', 'strict'] },
      },
    })

    if (activeRules.length === 0) {
      this.addFinding({
        severity: 'warning',
        category: 'compliance',
        title: 'Keine aktiven Governance-Regeln',
        description: 'Es sind keine aktiven Governance-Regeln mit Enforcement konfiguriert',
        entity_type: null,
        entity_id: null,
        recommendation: 'Governance-Regeln gemäss FINMA/DSGVO-Anforderungen anlegen',
        auto_fixable: false,
        evidence: { activeRulesCount: 0 },
      })
    }

    // Customers without mandate
    const noMandate = await prisma.customer.count({
      where: {
        organization_id: this.orgId,
        archived: false,
        status: 'active',
        mandate_status: { in: ['pending', 'expired'] },
      },
    })
    if (noMandate > 0) {
      this.addFinding({
        severity: 'critical',
        category: 'compliance',
        title: 'Kunden ohne gültiges Mandat',
        description: `${noMandate} aktive Kunden haben kein gültiges Mandat (pending/expired)`,
        entity_type: 'customer',
        entity_id: null,
        recommendation: 'Mandatsstatus dieser Kunden prüfen und erneuern',
        auto_fixable: false,
        evidence: { count: noMandate, statuses: ['pending', 'expired'] },
      })
    }
  }

  // --------------------------------------------------------------------------
  // 4. Duplicate Scan
  // --------------------------------------------------------------------------
  private async scanDuplicates(): Promise<void> {
    // Check existing duplicate alerts
    const openAlerts = await prisma.duplicateAlert.count({
      where: { organization_id: this.orgId, status: 'new' },
    })
    if (openAlerts > 0) {
      this.addFinding({
        severity: openAlerts > 20 ? 'critical' : 'warning',
        category: 'duplicates',
        title: 'Offene Duplikat-Alarme',
        description: `${openAlerts} Duplikat-Alarme wurden noch nicht bearbeitet`,
        entity_type: null,
        entity_id: null,
        recommendation: 'Duplikat-Alarme im Duplicate Center prüfen und zusammenführen',
        auto_fixable: false,
        evidence: { count: openAlerts, status: 'new' },
      })
    }

    // Simple email-based duplicate detection
    const duplicates = await prisma.$queryRawUnsafe<Array<{ email: string; count: bigint }>>(
      `SELECT LOWER(email) as email, COUNT(*) as count FROM customer
       WHERE organization_id = $1 AND archived = false AND email IS NOT NULL AND email != ''
       GROUP BY LOWER(email) HAVING COUNT(*) > 1`,
      this.orgId,
    )

    const dupCount = duplicates.length
    if (dupCount > 0) {
      this.addFinding({
        severity: dupCount > 10 ? 'critical' : 'warning',
        category: 'duplicates',
        title: 'Potenzielle Kunden-Duplikate (gleiche E-Mail)',
        description: `${dupCount} E-Mail-Adressen werden von mehreren Kunden verwendet`,
        entity_type: 'customer',
        entity_id: null,
        recommendation: 'Duplikate im Customer Merge Dialog zusammenführen',
        auto_fixable: false,
        evidence: { count: dupCount, duplicates },
      })
    }
  }

  // --------------------------------------------------------------------------
  // 5. PDF Integrity Scan
  // --------------------------------------------------------------------------
  private async scanPdfIntegrity(): Promise<void> {
    const pdfDocs = await prisma.document.findMany({
      where: {
        organization_id: this.orgId,
        archived: false,
        mime_type: { in: ['application/pdf', 'application/octet-stream'] },
        file_key: { not: null },
      },
      select: { id: true, name: true, file_key: true },
      take: 100,
    })

    let corruptCount = 0
    const corruptDocs: string[] = []

    for (const doc of pdfDocs) {
      if (!doc.file_key) continue
      try {
        const { buffer } = await getFileBuffer(doc.file_key)
        const isPdf = buffer.slice(0, 4).toString() === '%PDF'
        if (!isPdf) {
          corruptCount++
          corruptDocs.push(doc.name)
        }
      } catch {
        corruptCount++
        corruptDocs.push(doc.name)
      }
    }

    if (corruptCount > 0) {
      this.addFinding({
        severity: corruptCount > 5 ? 'critical' : 'warning',
        category: 'pdf_integrity',
        title: 'Beschädigte oder ungültige PDF-Dokumente',
        description: `${corruptCount} von ${pdfDocs.length} geprüften PDFs sind nicht lesbar`,
        entity_type: 'document',
        entity_id: null,
        recommendation: 'Betroffene Dokumente neu hochladen',
        auto_fixable: false,
        evidence: { corruptCount, checkedCount: pdfDocs.length, samples: corruptDocs.slice(0, 10) },
      })
    }
  }

  // --------------------------------------------------------------------------
  // 6. Audit Trail Scan
  // --------------------------------------------------------------------------
  private async scanAuditTrail(): Promise<void> {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const recentAudits = await prisma.auditLog.count({
      where: {
        organization_id: this.orgId,
        timestamp: { gte: sevenDaysAgo },
      },
    })

    if (recentAudits === 0) {
      this.addFinding({
        severity: 'critical',
        category: 'audit_trail',
        title: 'Keine Audit-Logs in den letzten 7 Tagen',
        description: 'Es wurden keine Audit-Logs in den letzten 7 Tagen erfasst',
        entity_type: null,
        entity_id: null,
        recommendation: 'Audit-Trail-Konfiguration prüfen, Middleware könnte deaktiviert sein',
        auto_fixable: false,
        evidence: { daysWithoutLogs: 7 },
      })
    }

    // Check for error-level audit events
    const errorAudits = await prisma.auditLog.count({
      where: {
        organization_id: this.orgId,
        business_severity_level: 'critical',
        timestamp: { gte: sevenDaysAgo },
      },
    })

    if (errorAudits > 0) {
      this.addFinding({
        severity: errorAudits > 10 ? 'critical' : 'warning',
        category: 'audit_trail',
        title: 'Kritische Audit-Events',
        description: `${errorAudits} kritische Audit-Events in den letzten 7 Tagen`,
        entity_type: null,
        entity_id: null,
        recommendation: 'Kritische Audit-Events im Audit-Log prüfen und analysieren',
        auto_fixable: false,
        evidence: { count: errorAudits, days: 7 },
      })
    }
  }

  // --------------------------------------------------------------------------
  // 7. AI Findings Scan
  // --------------------------------------------------------------------------
  private async scanAiFindings(): Promise<void> {
    const unresolvedFindings = await prisma.aiFinding.count({
      where: {
        organization_id: this.orgId,
        status: { in: ['new', 'under_review'] },
        severity: { in: ['critical', 'blocking'] },
      },
    })

    if (unresolvedFindings > 0) {
      this.addFinding({
        severity: unresolvedFindings > 10 ? 'critical' : 'warning',
        category: 'ai_findings',
        title: 'Unbearbeitete kritische AI Findings',
        description: `${unresolvedFindings} kritische/blocking AI Findings sind noch offen`,
        entity_type: null,
        entity_id: null,
        recommendation: 'AI Findings im AI Review Center prüfen und bearbeiten',
        auto_fixable: false,
        evidence: { count: unresolvedFindings },
      })
    }
  }

  // --------------------------------------------------------------------------
  // Auto-Fix: Apply correction suggestions
  // --------------------------------------------------------------------------
  private async runAutoFixes(): Promise<void> {
    // Future: automated fixes for known patterns
    // E.g., fix contracts that have end_date < start_date
    const invalidDates = await prisma.contract.findMany({
      where: {
        organization_id: this.orgId,
        AND: [
          { start_date: { not: null } },
          { end_date: { not: null } },
          { end_date: { lt: prisma.contract.fields.start_date as any } },
        ],
      },
      select: { id: true, start_date: true, end_date: true },
    })

    for (const c of invalidDates) {
      this.addFinding({
        severity: 'warning',
        category: 'auto_fixed',
        title: 'Vertrag mit inkonsistenten Daten (Ende < Beginn)',
        description: `Vertrag ${c.id}: end_date (${c.end_date}) < start_date (${c.start_date})`,
        entity_type: 'contract',
        entity_id: c.id,
        recommendation: 'Daten manuell korrigieren',
        auto_fixable: false,
        evidence: { id: c.id, start_date: c.start_date, end_date: c.end_date },
      })
    }
  }

  // --------------------------------------------------------------------------
  // Score Calculation
  // --------------------------------------------------------------------------
  private calculateScores() {
    const byCategory: Record<string, AuditFinding[]> = {}
    for (const f of this.findings) {
      if (!byCategory[f.category]) byCategory[f.category] = []
      byCategory[f.category].push(f)
    }

    const scoreForCategory = (cat: string): number => {
      const items = byCategory[cat] || []
      if (items.length === 0) return 100
      let totalPenalty = 0
      for (const f of items) {
        const sev = f.severity === 'blocking' ? 30 : f.severity === 'critical' ? 15 : f.severity === 'warning' ? 5 : 1
        totalPenalty += sev
      }
      return Math.max(0, Math.min(100, 100 - totalPenalty))
    }

    return {
      overall: Math.round(
        (scoreForCategory('data_integrity') +
          scoreForCategory('compliance') +
          scoreForCategory('duplicates') +
          scoreForCategory('audit_trail') +
          scoreForCategory('pdf_integrity')) / 5,
      ),
      data_integrity: scoreForCategory('data_integrity'),
      compliance: scoreForCategory('compliance'),
      duplicates: scoreForCategory('duplicates'),
      audit_trail: scoreForCategory('audit_trail'),
      pdf_integrity: scoreForCategory('pdf_integrity'),
    }
  }

  // --------------------------------------------------------------------------
  // Helper
  // --------------------------------------------------------------------------
  private addFinding(finding: Omit<AuditFinding, 'id'>): void {
    this.findings.push({
      ...finding,
      id: `${this.scanId}-${this.findings.length + 1}-${Date.now()}`,
    })
  }
}
