'use client';

import Link from 'next/link';
import { Bell, ArrowUpRight } from 'lucide-react';
import { internalRoute } from '@/lib/renuv-routes';

/**
 * Alert summary widget for the overview page.
 * Shows a link to the full alerts page — actual alert data
 * is rendered on /internal/renuv/alerts from live BigQuery queries.
 */
export function AlertSummaryWidget({ brand }: { brand?: string } = {}) {
  return (
    <div className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-[var(--blue-700)]" />
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">Alerts</p>
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink-950)]">
            View active alerts and recommendations
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-600)]">
            Automated monitoring for spend anomalies, efficiency changes, and data freshness issues.
          </p>
        </div>
        <Link href={internalRoute(brand, "alerts")} className="mc-btn mc-btn-primary">
          View alerts <ArrowUpRight size={15} />
        </Link>
      </div>
    </div>
  );
}
