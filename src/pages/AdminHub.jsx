/**
 * AdminHub — Zentrale Admin-Übersicht
 *
 * Einzige Einstiegsseite für alle Admin-Funktionen.
 * Zeigt Health Scores, letzte Audit-Events und offene Verbesserungen.
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { avasys } from '@/api/avasysClient'
import { cn } from '@/lib/utils'
import { getScoreColor, getScoreBg } from '@/lib/CentralAnalysisContext'
import {
  Shield, Activity, Lock, BarChart2, FileSearch, Server,
  Brain, ShieldAlert, HardDrive, BookOpen, FileText,
  ChevronRight, AlertTriangle, CheckCircle2, Loader2,
  Sparkles, TrendingUp, Clock, User, Zap
} from 'lucide-react'

// ── Admin Tile Config ────────────────────────────────────────────
const ADMIN_TILES = [
  { label: 'System-Health',     icon: Activity,     path: '/admin/control-center',  desc: 'Gesundheitsscore, Metriken, Risiko',         color: 'violet' },
  { label: 'Team & Zugriffe',   icon: Lock,         path: '/admin/team',            desc: 'Benutzer, Rollen, Berechtigungen',           color: 'slate' },
  { label: 'Audit',             icon: BarChart2,    path: '/admin/audit',           desc: 'Enterprise-Prüfung, Performance, KI',       color: 'blue' },
  { label: 'Audit Logs',        icon: FileSearch,   path: '/admin/audit-logs',      desc: 'Prozess-Observability, Guard Analytics',    color: 'amber' },
  { label: 'System Check',      icon: Server,       path: '/admin/system-check',    desc: 'Technische Systemsicht, Cleanup',           color: 'cyan' },
  { label: 'System Logs',       icon: FileText,     path: '/admin/logs',            desc: 'Systemweite Logs und Ereignisse',           color: 'gray' },
  { label: 'KI-Verbesserungen', icon: Brain,        path: '/admin/improvements',    desc: 'KI-gestützte Vorschläge mit Freigabe',      color: 'purple' },
  { label: 'Sicherheit',        icon: ShieldAlert,  path: '/admin/security',        desc: 'Security, Compliance, Governance',          color: 'rose' },
  { label: 'Backup',            icon: HardDrive,    path: '/admin/backup',          desc: 'Backup-Management, Recovery',               color: 'emerald' },
  { label: 'Lernzentrum',       icon: BookOpen,     path: '/admin/insurance-learning', desc: 'Versicherungs-Wissen, Schulungen',        color: 'indigo' },
]

const TILE_COLORS = {
  violet:  'from-violet-50 to-violet-100/60 border-violet-200 hover:border-violet-400 hover:shadow-violet-200/50',
  slate:   'from-slate-50 to-slate-100/60 border-slate-200 hover:border-slate-400 hover:shadow-slate-200/50',
  blue:    'from-blue-50 to-blue-100/60 border-blue-200 hover:border-blue-400 hover:shadow-blue-200/50',
  amber:   'from-amber-50 to-amber-100/60 border-amber-200 hover:border-amber-400 hover:shadow-amber-200/50',
  cyan:    'from-cyan-50 to-cyan-100/60 border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-200/50',
  gray:    'from-gray-50 to-gray-100/60 border-gray-200 hover:border-gray-400 hover:shadow-gray-200/50',
  purple:  'from-purple-50 to-purple-100/60 border-purple-200 hover:border-purple-400 hover:shadow-purple-200/50',
  rose:    'from-rose-50 to-rose-100/60 border-rose-200 hover:border-rose-400 hover:shadow-rose-200/50',
  emerald: 'from-emerald-50 to-emerald-100/60 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-200/50',
  indigo:  'from-indigo-50 to-indigo-100/60 border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-200/50',
}

const TILE_ICON_COLORS = {
  violet:  'text-violet-600 bg-violet-100',     slate:   'text-slate-600 bg-slate-100',
  blue:    'text-blue-600 bg-blue-100',          amber:   'text-amber-600 bg-amber-100',
  cyan:    'text-cyan-600 bg-cyan-100',           gray:    'text-gray-600 bg-gray-100',
  purple:  'text-purple-600 bg-purple-100',      rose:    'text-rose-600 bg-rose-100',
  emerald: 'text-emerald-600 bg-emerald-100',    indigo:  'text-indigo-600 bg-indigo-100',
}

// ── Admin Tile ───────────────────────────────────────────────────
function AdminTile({ tile }) {
  const Icon = tile.icon
  return (
    <Link
      to={tile.path}
      className={cn(
        'group relative rounded-xl border bg-gradient-to-br p-4 transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        TILE_COLORS[tile.color]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors', TILE_ICON_COLORS[tile.color])}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">{tile.label}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tile.desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  )
}

// ── Score Mini-Card ──────────────────────────────────────────────
function ScoreMini({ label, value }) {
  return (
    <div className={cn('rounded-lg border px-3 py-2 flex items-center justify-between', getScoreBg(value))}>
      <span className="text-[11px] font-medium text-slate-600">{label}</span>
      <span className={cn('text-lg font-bold', getScoreColor(value))}>{value}</span>
    </div>
  )
}

// ── Audit Event Row ─────────────────────────────────────────────
function AuditRow({ log }) {
  const lvlColors = {
    1: 'bg-rose-100 text-rose-700 border-rose-200',
    2: 'bg-blue-100 text-blue-700 border-blue-200',
    3: 'bg-amber-100 text-amber-700 border-amber-200',
    4: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  const lvlLabels = { 1: 'Critical', 2: 'Lifecycle', 3: 'Guard', 4: 'Debug' }
  const level = log.audit_level || 4
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0', lvlColors[level] || lvlColors[4])}>
        {lvlLabels[level] || level}
      </span>
      <span className="text-[11px] text-slate-600 min-w-[80px] shrink-0">
        {log.timestamp ? new Date(log.timestamp).toLocaleString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
      </span>
      <span className="text-xs text-slate-700 truncate flex-1">{log.event_type || log.decision_code || '—'}</span>
      <span className="text-[10px] text-slate-400 truncate max-w-[120px] shrink-0 font-mono">{log.actor_name || log.actor_id || ''}</span>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function AdminHub() {
  const [analysisData, setAnalysisData] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Current user
  const { data: currentUser } = useQuery({
    queryKey: ['admin_hub_me'],
    queryFn: () => avasys.auth.me(),
  })

  // Audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin_hub_audit'],
    queryFn: () => avasys.entities.AuditLog.list('-created_date', 10),
    refetchInterval: 30_000,
  })

  // Offene Verbesserungen
  const { data: improvements = [] } = useQuery({
    queryKey: ['admin_hub_improvements'],
    queryFn: () => avasys.entities.EnterpriseImprovement.list('-proposed_at', 100),
  })
  const openImprovements = improvements.filter(i => !['verified', 'rejected'].includes(i.status))
  const verifiedCount = improvements.filter(i => i.status === 'verified').length
  const withActual = improvements.filter(i => i.actual_impact?.performance_improvement_actual_percent != null)
  const avgImpact = withActual.length > 0
    ? Math.round(withActual.reduce((s, i) => s + i.actual_impact.performance_improvement_actual_percent, 0) / withActual.length)
    : null

  // Analyse automatisch laden
  const runAnalysis = async () => {
    setAnalysisLoading(true)
    try {
      const res = await avasys.functions.invoke('centralAnalysisEngine', {})
      setAnalysisData(res.data)
    } catch { /* silent */ }
    setAnalysisLoading(false)
  }

  useEffect(() => { runAnalysis() }, [])

  const { scores, metrics, critical_issues = [], risk_level } = analysisData || {}

  return (
    <div className="page-enter flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-6 py-5 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md shadow-violet-200/50">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Hub</h1>
              <p className="text-xs text-muted-foreground">
                Willkommen, <span className="font-semibold text-slate-700">{currentUser?.full_name || currentUser?.email || 'Admin'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {analysisData && scores?.overall != null && (
              <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold', getScoreBg(scores.overall))}>
                <TrendingUp className="w-3.5 h-3.5" />
                Health: <span className={cn('text-sm font-bold', getScoreColor(scores.overall))}>{scores.overall}/100</span>
              </div>
            )}
            {risk_level && (
              <span className={cn(
                'text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide',
                risk_level === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                risk_level === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                risk_level === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}>
                {risk_level}
              </span>
            )}
            <button
              onClick={runAnalysis}
              disabled={analysisLoading}
              className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${analysisLoading ? 'animate-spin' : ''}`} />
              {analysisLoading ? 'lädt...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* ── Admin Tile Grid ── */}
        <div>
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest mb-3">Admin Tools</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {ADMIN_TILES.map(tile => (
              <AdminTile key={tile.path} tile={tile} />
            ))}
          </div>
        </div>

        {/* ── Health Scores + Metriken ── */}
        {analysisData && scores && (
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              System-Gesundheit
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <ScoreMini label="Gesamt" value={scores.overall} />
              <ScoreMini label="Governance" value={scores.governance} />
              <ScoreMini label="Datenqualität" value={scores.data_quality} />
              <ScoreMini label="CRM-Betrieb" value={scores.crm_health} />
            </div>

            {/* Critical Issues */}
            {critical_issues?.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {critical_issues.length} kritische {critical_issues.length === 1 ? 'Problem' : 'Probleme'}
                </p>
                {critical_issues.slice(0, 3).map((issue, i) => (
                  <p key={i} className="text-xs text-rose-700 pl-5">→ {issue.message}</p>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <StatBox label="Aktive Kunden" value={metrics.active_customers} icon={User} />
                <StatBox label="Aktive Verträge" value={metrics.active_contracts} icon={FileText} />
                <StatBox label="Offene Tasks" value={metrics.open_tasks} icon={CheckCircle2} warn={metrics.overdue_tasks > 0} />
                <StatBox label="Krit. Incidents" value={metrics.open_critical_incidents} icon={AlertTriangle} warn={metrics.open_critical_incidents > 0} />
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {!analysisData && analysisLoading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysiere System...
          </div>
        )}

        {/* ── Letzte Audit-Events + KI-Verbesserungen ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Letzte Audit-Events */}
          <div className="surface-sm border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                Letzte Audit-Events
              </p>
              <Link to="/admin/audit-logs" className="text-[10px] text-primary hover:underline font-medium">
                Alle anzeigen →
              </Link>
            </div>
            <div className="px-4 py-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Keine Audit-Events geladen</p>
              ) : (
                auditLogs.slice(0, 6).map(log => <AuditRow key={log.id} log={log} />)
              )}
            </div>
          </div>

          {/* KI-Verbesserungen */}
          <div className="surface-sm border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-violet-500" />
                KI-Verbesserungen
              </p>
              <Link to="/admin/improvements" className="text-[10px] text-primary hover:underline font-medium">
                Alle anzeigen →
              </Link>
            </div>
            <div className="px-4 py-3 space-y-3">
              {/* Stats */}
              <div className="flex gap-3">
                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{openImprovements.length}</p>
                  <p className="text-[10px] text-amber-600 font-medium">Offen</p>
                </div>
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{verifiedCount}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Verifiziert</p>
                </div>
                {avgImpact != null && (
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-blue-700">+{avgImpact}%</p>
                    <p className="text-[10px] text-blue-600 font-medium">Ø Impact</p>
                  </div>
                )}
              </div>

              {/* Letzte Vorschläge */}
              {openImprovements.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Keine offenen Verbesserungen 🎉</p>
              ) : (
                openImprovements.slice(0, 3).map(imp => (
                  <div key={imp.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{imp.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {imp.area?.replace(/_/g, ' ')} · {imp.priority}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── StatBox ─────────────────────────────────────────────────────
function StatBox({ label, value, icon: Icon, warn }) {
  return (
    <div className={cn(
      'rounded-lg border px-3 py-2.5 flex items-center justify-between',
      warn && value > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5', warn && value > 0 ? 'text-rose-500' : 'text-slate-400')} strokeWidth={1.8} />
        <span className="text-[11px] text-slate-600">{label}</span>
      </div>
      <span className={cn('text-sm font-bold', warn && value > 0 ? 'text-rose-700' : 'text-slate-800')}>{value}</span>
    </div>
  )
}
