import { AlertTriangle, Info, XCircle, CheckCircle2, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RenuvAlert, AlertSeverity, AlertStatus } from '@/lib/renuv-alerts';

export function AlertCard({ alert, compact = false }: { alert: RenuvAlert; compact?: boolean }) {
  const severityConfig = getSeverityConfig(alert.severity);
  const statusConfig = getStatusConfig(alert.status);

  if (compact) {
    return (
      <article className={cn(
        'group relative overflow-hidden rounded-[24px] border p-4 transition-all hover:shadow-[0_24px_60px_rgba(19,44,74,0.12)]',
        severityConfig.borderClass,
        severityConfig.bgClass
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5 rounded-full p-2', severityConfig.iconBgClass)}>
              {severityConfig.icon}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--ink-950)]">{alert.title}</h3>
                <SeverityBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
              </div>
              <p className="text-sm leading-6 text-[var(--ink-700)]">{alert.summary}</p>
              {alert.relatedEntity && (
                <p className="text-xs text-[var(--ink-600)]">
                  {alert.relatedEntityType}: <span className="font-semibold text-[var(--blue-700)]">{alert.relatedEntity}</span>
                </p>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[var(--ink-400)] transition-transform group-hover:translate-x-1" />
        </div>
      </article>
    );
  }

  return (
    <article className={cn(
      'overflow-hidden rounded-[28px] border shadow-[0_20px_50px_rgba(19,44,74,0.08)]',
      severityConfig.borderClass,
      severityConfig.bgClass
    )}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn('mt-1 rounded-full p-3', severityConfig.iconBgClass)}>
              {severityConfig.icon}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
                <TriggerBadge trigger={alert.trigger} />
              </div>
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-[var(--ink-950)]">{alert.title}</h3>
              <p className="text-base leading-7 text-[var(--ink-700)]">{alert.summary}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Current" value={alert.currentValue} trend="down" />
          <MetricCard label="Prior period" value={alert.priorValue} trend="up" />
          <MetricCard label="Threshold" value={alert.threshold} />
          <MetricCard label="Impact" value={alert.impact} />
        </div>

        <div className="mt-5 rounded-[22px] border border-[var(--line-soft)] bg-white/80 p-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Explanation</h4>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-800)]">{alert.explanation}</p>
        </div>

        <div className="mt-5 rounded-[22px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Recommendations</h4>
          <ul className="mt-3 space-y-2">
            {alert.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3 text-sm leading-6 text-[var(--ink-800)]">
                <CheckCircle2 size={16} className="mt-1 shrink-0 text-[var(--blue-700)]" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[var(--ink-600)]">
          {alert.relatedEntity && (
            <div className="rounded-full border border-[var(--line-soft)] bg-white px-3 py-1.5">
              <span className="uppercase tracking-[0.12em]">{alert.relatedEntityType}</span>
              <span className="mx-2">·</span>
              <span className="font-semibold text-[var(--blue-700)]">{alert.relatedEntity}</span>
            </div>
          )}
          <div>First detected: {alert.firstDetected}</div>
          <div>Last evaluated: {alert.lastEvaluated}</div>
        </div>
      </div>

      <div className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-6 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{alert.sourceView}</p>
      </div>
    </article>
  );
}

function MetricCard({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' }) {
  return (
    <div className="rounded-[18px] border border-[var(--line-soft)] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">{label}</p>
        {trend === 'down' && <TrendingDown size={14} className="text-[#b15d27]" />}
        {trend === 'up' && <TrendingUp size={14} className="text-[#2d8a56]" />}
      </div>
      <p className="mt-2 text-base font-semibold text-[var(--ink-950)]">{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const config = getSeverityConfig(severity);
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', config.badgeClass)}>
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const config = getStatusConfig(status);
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', config.badgeClass)}>
      {config.label}
    </span>
  );
}

function TriggerBadge({ trigger }: { trigger: string }) {
  return (
    <span className="inline-flex rounded-full border border-[var(--line-soft)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-700)]">
      {trigger.replace(/_/g, ' ')}
    </span>
  );
}

function getSeverityConfig(severity: AlertSeverity) {
  const configs = {
    critical: {
      label: 'Critical',
      icon: <XCircle size={20} className="text-white" />,
      iconBgClass: 'bg-[#c42e1f] text-white',
      badgeClass: 'bg-[#16324a] text-white',
      borderClass: 'border-[#c42e1f]/30',
      bgClass: 'bg-[linear-gradient(135deg,rgba(196,46,31,0.04),rgba(255,255,255,0.98))]'
    },
    warning: {
      label: 'Warning',
      icon: <AlertTriangle size={20} className="text-[#876a18]" />,
      iconBgClass: 'bg-[#fff8e8]',
      badgeClass: 'bg-[#fff8e8] text-[#876a18]',
      borderClass: 'border-[rgba(135,106,24,0.18)]',
      bgClass: 'bg-[linear-gradient(135deg,rgba(255,248,232,0.5),rgba(255,255,255,0.98))]'
    },
    info: {
      label: 'Info',
      icon: <Info size={20} className="text-[var(--blue-700)]" />,
      iconBgClass: 'bg-[rgba(94,168,255,0.12)]',
      badgeClass: 'bg-[rgba(94,168,255,0.12)] text-[var(--blue-700)]',
      borderClass: 'border-[rgba(94,168,255,0.14)]',
      bgClass: 'bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.98))]'
    }
  };
  return configs[severity];
}

function getStatusConfig(status: AlertStatus) {
  const configs = {
    active: {
      label: 'Active',
      badgeClass: 'bg-[#16324a] text-white'
    },
    resolved: {
      label: 'Resolved',
      badgeClass: 'bg-[#e7f4ee] text-[#2d8a56]'
    },
    acknowledged: {
      label: 'Acknowledged',
      badgeClass: 'bg-[#eef2f6] text-[#627587]'
    }
  };
  return configs[status];
}
