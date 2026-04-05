import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, AlertTriangle, Bell, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertCard } from './alert-card';
import { alertTriggerDefinitions, type RenuvAlertSnapshot } from '@/lib/renuv-alerts';
import { brandRoot, clientRoute, internalRoute } from '@/lib/renuv-routes';

export function RenuvAlertsPage({ snapshot, brand }: { snapshot: RenuvAlertSnapshot; brand?: string }) {
  const criticalAlerts = snapshot.alerts.filter(a => a.severity === 'critical' && a.status === 'active');
  const warningAlerts = snapshot.alerts.filter(a => a.severity === 'warning' && a.status === 'active');
  const infoAlerts = snapshot.alerts.filter(a => a.severity === 'info' && a.status === 'active');
  const acknowledgedAlerts = snapshot.alerts.filter(a => a.status === 'acknowledged');

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-6 py-8 md:px-8 lg:px-10">
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] px-6 py-6 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur md:px-8 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,420px)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
                <Link href={internalRoute(brand)} className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]">
                  <ArrowLeft size={14} /> Back to Renuv overview
                </Link>
                <Badge tone="navy">Internal workspace</Badge>
                <Badge tone="blue">Renuv</Badge>
                <Badge tone="soft">{snapshot.periodLabel}</Badge>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Alerting layer</p>
                <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-6xl">
                  Active alerts · {snapshot.brand}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  Automated alert evaluation against predefined triggers for sales, efficiency, conversion, traffic, inventory, search, and retail health. Alerts are evaluated daily and prioritized by severity and business impact.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-600)]">
                <Tag>Daily evaluation</Tag>
                <Tag>Severity-based prioritization</Tag>
                <Tag>Impact-driven recommendations</Tag>
                <Tag>Multi-trigger coverage</Tag>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand)} className="mc-btn mc-btn-primary">
                  View overview <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "asins")} className="mc-btn mc-btn-secondary">
                  View ASIN performance <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, "advertising")} className="mc-btn mc-btn-secondary">
                  View advertising <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniSummaryCard
                title="Active alerts"
                value={snapshot.summary.totalActive.toString()}
                detail={`${snapshot.summary.critical} critical, ${snapshot.summary.warning} warning, ${snapshot.summary.info} info`}
                icon={<Bell size={18} />}
              />
              <MiniSummaryCard
                title="Last evaluation"
                value={snapshot.summary.lastEvaluationRun}
                detail="Daily evaluation runs at 4:00 AM ET after data refresh completes."
                icon={<Clock size={18} />}
              />
              <MiniSummaryCard
                title="Coverage"
                value={`${alertTriggerDefinitions.length} triggers`}
                detail="Monitoring performance, efficiency, operations, and search signals."
                icon={<Shield size={18} />}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Critical"
            count={snapshot.summary.critical}
            description="Requires immediate attention and action"
            severity="critical"
          />
          <SummaryCard
            title="Warning"
            count={snapshot.summary.warning}
            description="Needs review and monitoring"
            severity="warning"
          />
          <SummaryCard
            title="Info"
            count={snapshot.summary.info}
            description="Awareness level, monitor trends"
            severity="info"
          />
        </section>

        {criticalAlerts.length > 0 && (
          <section className="mb-6">
            <SectionHeading eyebrow="Critical alerts" title="Immediate attention required" />
            <div className="mt-5 space-y-4">
              {criticalAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {warningAlerts.length > 0 && (
          <section className="mb-6">
            <SectionHeading eyebrow="Warning alerts" title="Review and monitor" />
            <div className="mt-5 space-y-4">
              {warningAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {infoAlerts.length > 0 && (
          <section className="mb-6">
            <SectionHeading eyebrow="Info alerts" title="Awareness and context" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {infoAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} compact />
              ))}
            </div>
          </section>
        )}

        {acknowledgedAlerts.length > 0 && (
          <section className="mb-6">
            <SectionHeading eyebrow="Acknowledged alerts" title="Previously flagged, monitoring continues" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {acknowledgedAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} compact />
              ))}
            </div>
          </section>
        )}

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">
          <SectionHeading eyebrow="Trigger definitions" title="Alert evaluation criteria" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {alertTriggerDefinitions.map(def => (
              <TriggerDefinitionCard key={def.trigger} definition={def} />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionHeading eyebrow="Evaluation engine" title="Daily automated monitoring" />
              <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--ink-700)]">
                The alerting layer runs daily evaluation jobs against defined triggers, assigns severity based on threshold models, generates explanations and recommendations, and surfaces active alerts in the internal overview and brand pages.
              </p>
            </div>
            <Link href={internalRoute(brand)} className="mc-btn mc-btn-primary">
              View overview <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MetricBlock label="Evaluation frequency" value="Daily at 4:00 AM ET" />
            <MetricBlock label="Data source" value="reporting_amazon.alert_evaluation_daily" />
            <MetricBlock label="Trigger count" value={`${alertTriggerDefinitions.length} active triggers`} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Badge({ tone, children }: { tone: 'navy' | 'blue' | 'soft'; children: string }) {
  const styles = {
    navy: 'bg-[var(--navy-900)] text-white',
    blue: 'bg-[var(--blue-700)] text-white',
    soft: 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)]'
  } as const;

  return <span className={cn('inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]', styles[tone])}>{children}</span>;
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1">{children}</span>;
}

function MiniSummaryCard({ title, value, detail, icon }: { title: string; value: string; detail: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_16px_32px_rgba(19,44,74,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{title}</p>
        {icon ? <span className="text-[var(--blue-700)]">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{detail}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">{title}</h2>
    </div>
  );
}

function SummaryCard({ title, count, description, severity }: { title: string; count: number; description: string; severity: 'critical' | 'warning' | 'info' }) {
  const configs = {
    critical: {
      bgClass: 'bg-[linear-gradient(135deg,rgba(196,46,31,0.08),rgba(255,255,255,0.98))]',
      borderClass: 'border-[#c42e1f]/30',
      iconClass: 'text-[#c42e1f]',
      countClass: 'text-[#c42e1f]'
    },
    warning: {
      bgClass: 'bg-[linear-gradient(135deg,rgba(255,248,232,0.7),rgba(255,255,255,0.98))]',
      borderClass: 'border-[rgba(135,106,24,0.18)]',
      iconClass: 'text-[#876a18]',
      countClass: 'text-[#876a18]'
    },
    info: {
      bgClass: 'bg-[linear-gradient(135deg,rgba(94,168,255,0.12),rgba(255,255,255,0.98))]',
      borderClass: 'border-[rgba(94,168,255,0.14)]',
      iconClass: 'text-[var(--blue-700)]',
      countClass: 'text-[var(--blue-700)]'
    }
  };

  const config = configs[severity];

  return (
    <div className={cn('rounded-[24px] border p-5 shadow-[0_18px_40px_rgba(19,44,74,0.06)]', config.borderClass, config.bgClass)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{title}</p>
          <p className={cn('mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl', config.countClass)}>{count}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{description}</p>
        </div>
        <AlertTriangle size={24} className={config.iconClass} />
      </div>
    </div>
  );
}

function TriggerDefinitionCard({ definition }: { definition: typeof alertTriggerDefinitions[0] }) {
  const categoryColors = {
    performance: 'bg-[rgba(94,168,255,0.12)] text-[var(--blue-700)]',
    efficiency: 'bg-[#fff8e8] text-[#876a18]',
    operations: 'bg-[#e7f4ee] text-[#2d8a56]',
    search: 'bg-[rgba(147,108,230,0.12)] text-[#8860d8]'
  };

  return (
    <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-[0_12px_30px_rgba(19,44,74,0.05)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', categoryColors[definition.category])}>
          {definition.category}
        </span>
        <span className="text-xs text-[var(--ink-600)]">{definition.trigger.replace(/_/g, ' ')}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-[var(--ink-950)]">{definition.name}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{definition.description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Critical threshold</p>
          <p className="mt-1 text-sm font-semibold text-[#c42e1f]">{definition.thresholds.critical}{definition.trigger.includes('stock') ? ' days' : '%'}</p>
        </div>
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Warning threshold</p>
          <p className="mt-1 text-sm font-semibold text-[#876a18]">{definition.thresholds.warning}{definition.trigger.includes('stock') ? ' days' : '%'}</p>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{definition.metricSource}</p>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--ink-900)]">{value}</p>
    </div>
  );
}
