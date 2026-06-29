import { cn } from '@/lib/utils';

function confColor(value) {
  if (value == null) return 'bg-slate-200';
  if (value >= 0.8) return 'bg-emerald-500';
  if (value >= 0.6) return 'bg-amber-400';
  return 'bg-red-400';
}

function confTextColor(value) {
  if (value == null) return 'text-slate-500';
  if (value >= 0.8) return 'text-emerald-700';
  if (value >= 0.6) return 'text-amber-700';
  return 'text-red-600';
}

function confBg(value) {
  if (value == null) return 'bg-slate-100';
  if (value >= 0.8) return 'bg-emerald-50';
  if (value >= 0.6) return 'bg-amber-50';
  return 'bg-red-50';
}

export default function ExtractionConfidenceBar({
  overall,
  sections,
  compact = false,
}) {
  const hasOverall = overall != null;
  const sectionsList = sections || [];
  const pct = hasOverall ? Math.round(overall * 100) : null;

  return (
    <div className={cn(confBg(overall), 'rounded-lg border px-4 py-3', compact ? 'border-0 p-0 bg-transparent' : '')}>
      {/* Overall */}
      {!compact && hasOverall && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Gesamt-Konfidenz
            </span>
            <span className={cn('text-sm font-bold', confTextColor(overall))}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700 ease-out', confColor(overall))}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Compact overall */}
      {compact && hasOverall && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700 ease-out', confColor(overall))}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn('text-xs font-bold', confTextColor(overall))}>{pct}%</span>
        </div>
      )}

      {/* Sections */}
      {sectionsList.length > 0 && (
        <div className={cn('space-y-1.5', !compact && 'mt-3')}>
          {sectionsList.map((sec, i) => {
            const secPct = sec.value != null ? Math.round(sec.value * 100) : null;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-28 flex-shrink-0 truncate">
                  {sec.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  {secPct != null && (
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', confColor(sec.value))}
                      style={{ width: `${secPct}%` }}
                    />
                  )}
                </div>
                <span className={cn('text-[10px] font-semibold w-8 text-right', confTextColor(sec.value))}>
                  {secPct != null ? `${secPct}%` : '–'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
