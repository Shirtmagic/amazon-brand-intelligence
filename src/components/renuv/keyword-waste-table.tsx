'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, AlertCircle, Eye } from 'lucide-react';
import type { KeywordWasteSummary, KeywordWasteRow, KeywordPlacement } from '@/lib/renuv-advertising';

function fmt(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function SeverityBadge({ severity }: { severity: 'critical' | 'warning' | 'watch' }) {
  const styles = {
    critical: 'bg-[#16324a] text-white',
    warning: 'bg-[#fff8e8] text-[#876a18]',
    watch: 'bg-[#eef2f6] text-[#627587]',
  };
  const icons = {
    critical: <AlertCircle size={12} />,
    warning: <AlertTriangle size={12} />,
    watch: <Eye size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${styles[severity]}`}>
      {icons[severity]} {severity}
    </span>
  );
}

function PlacementRow({ placement }: { placement: KeywordPlacement }) {
  return (
    <tr className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)]">
      <td className="pl-10 pr-3 py-2.5 text-xs text-[var(--ink-800)]">{placement.campaignName}</td>
      <td className="px-3 py-2.5">
        <span className="inline-flex rounded-full bg-[#e8f4ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1a5490]">
          {placement.matchType}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-[var(--ink-800)] text-right tabular-nums">{fmt(placement.spend)}</td>
      <td className="px-3 py-2.5 text-xs text-[var(--ink-800)] text-right tabular-nums">{fmt(placement.sales)}</td>
      <td className="px-3 py-2.5 text-xs text-[var(--ink-800)] text-right tabular-nums">{placement.orders}</td>
      <td className="px-3 py-2.5 text-xs text-right tabular-nums">
        <span className={placement.roas >= 3 ? 'text-[#2d8a56]' : placement.roas >= 1 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
          {placement.roas > 0 ? `${placement.roas.toFixed(2)}x` : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-right tabular-nums">
        <span className={placement.acos <= 30 ? 'text-[#2d8a56]' : placement.acos <= 60 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
          {placement.acos < 999 ? `${placement.acos.toFixed(1)}%` : 'No sales'}
        </span>
      </td>
    </tr>
  );
}

function KeywordRow({ row }: { row: KeywordWasteRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-t border-[var(--line-soft)] cursor-pointer hover:bg-[rgba(94,168,255,0.04)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--ink-500)] shrink-0">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--ink-900)] leading-tight">{row.keyword}</p>
              <p className="text-[11px] text-[var(--ink-600)] mt-0.5">
                {row.placements.length} placement{row.placements.length !== 1 ? 's' : ''} · {row.totalClicks} clicks
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          <SeverityBadge severity={row.severity} />
        </td>
        <td className="px-3 py-3 text-sm text-[var(--ink-800)] text-right tabular-nums font-semibold">{fmt(row.totalSpend)}</td>
        <td className="px-3 py-3 text-sm text-[var(--ink-800)] text-right tabular-nums">{fmt(row.totalSales)}</td>
        <td className="px-3 py-3 text-sm text-[var(--ink-800)] text-right tabular-nums">{row.totalOrders}</td>
        <td className="px-3 py-3 text-sm text-right tabular-nums">
          <span className={row.spendToProductRatio >= 2 ? 'text-[#b15d27] font-semibold' : row.spendToProductRatio >= 1 ? 'text-[#876a18]' : 'text-[var(--ink-800)]'}>
            {row.spendToProductRatio.toFixed(1)}x
          </span>
        </td>
        <td className="px-3 py-3 text-sm text-right tabular-nums">
          <span className={row.salesDeficit > 1 ? 'text-[#b15d27]' : 'text-[var(--ink-800)]'}>
            {row.salesDeficit > 0 ? `-${row.salesDeficit.toFixed(1)}` : row.salesDeficit.toFixed(1)}
          </span>
        </td>
      </tr>
      {expanded && (
        <>
          <tr className="border-t border-[rgba(94,168,255,0.15)]">
            <td colSpan={7} className="px-0 py-0">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[rgba(94,168,255,0.06)]">
                      <th className="pl-10 pr-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Campaign</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Match type</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Spend</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Sales</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Orders</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">ROAS</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">ACOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.placements.sort((a, b) => b.spend - a.spend).map((p, idx) => (
                      <PlacementRow key={`${p.campaignName}-${p.matchType}-${idx}`} placement={p} />
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td colSpan={7} className="px-4 py-2 bg-[rgba(94,168,255,0.04)]">
              <p className="text-[11px] text-[var(--ink-600)] leading-5">
                <span className="font-semibold">Diagnosis:</span>{' '}
                {row.severity === 'critical'
                  ? `This keyword has spent ${row.spendToProductRatio.toFixed(1)}x the avg product price (${fmt(row.avgProductPrice)}) with only ${row.totalOrders} sale${row.totalOrders !== 1 ? 's' : ''}. Expected at least ${Math.ceil(row.expectedSalesAtPrice)} sale${Math.ceil(row.expectedSalesAtPrice) !== 1 ? 's' : ''} at this spend level. Consider negating or drastically reducing bids.`
                  : row.severity === 'warning'
                    ? `Spend of ${fmt(row.totalSpend)} against avg price of ${fmt(row.avgProductPrice)} suggests underperformance. ${row.totalOrders} order${row.totalOrders !== 1 ? 's' : ''} vs ${Math.ceil(row.expectedSalesAtPrice)} expected. Review match types and bids.`
                    : `Approaching waste threshold. Monitor closely — spend is at ${(row.spendToProductRatio * 100).toFixed(0)}% of product price with limited returns.`
                }
              </p>
            </td>
          </tr>
        </>
      )}
    </>
  );
}

// Mobile card for a single keyword
function KeywordCard({ row }: { row: KeywordWasteRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[var(--line-soft)] p-4">
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-[var(--ink-500)] shrink-0 mt-0.5">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink-900)] truncate">{row.keyword}</p>
            <p className="text-[11px] text-[var(--ink-600)] mt-0.5">
              {row.placements.length} placement{row.placements.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <SeverityBadge severity={row.severity} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[var(--ink-600)]">Spend</span>
          <p className="font-semibold text-[var(--ink-900)]">{fmt(row.totalSpend)}</p>
        </div>
        <div>
          <span className="text-[var(--ink-600)]">Sales</span>
          <p className="font-semibold text-[var(--ink-900)]">{fmt(row.totalSales)}</p>
        </div>
        <div>
          <span className="text-[var(--ink-600)]">Orders</span>
          <p className="font-semibold text-[var(--ink-900)]">{row.totalOrders}</p>
        </div>
        <div>
          <span className="text-[var(--ink-600)]">Spend / price</span>
          <p className={`font-semibold ${row.spendToProductRatio >= 2 ? 'text-[#b15d27]' : row.spendToProductRatio >= 1 ? 'text-[#876a18]' : 'text-[var(--ink-900)]'}`}>
            {row.spendToProductRatio.toFixed(1)}x
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {row.placements.sort((a, b) => b.spend - a.spend).map((p, idx) => (
            <div key={`${p.campaignName}-${p.matchType}-${idx}`} className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[var(--ink-900)] truncate">{p.campaignName}</p>
                <span className="inline-flex rounded-full bg-[#e8f4ff] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#1a5490] shrink-0">
                  {p.matchType}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-[var(--ink-600)]">Spend</span><p className="font-semibold">{fmt(p.spend)}</p></div>
                <div><span className="text-[var(--ink-600)]">Sales</span><p className="font-semibold">{fmt(p.sales)}</p></div>
                <div><span className="text-[var(--ink-600)]">Orders</span><p className="font-semibold">{p.orders}</p></div>
              </div>
              <div className="flex gap-4 text-[11px]">
                <span className={p.roas >= 3 ? 'text-[#2d8a56]' : p.roas >= 1 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
                  ROAS: {p.roas > 0 ? `${p.roas.toFixed(2)}x` : '—'}
                </span>
                <span className={p.acos <= 30 ? 'text-[#2d8a56]' : p.acos <= 60 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
                  ACOS: {p.acos < 999 ? `${p.acos.toFixed(1)}%` : 'No sales'}
                </span>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-[var(--ink-600)] leading-5 px-1">
            <span className="font-semibold">Diagnosis:</span>{' '}
            {row.severity === 'critical'
              ? `Spent ${row.spendToProductRatio.toFixed(1)}x product price with only ${row.totalOrders} sale${row.totalOrders !== 1 ? 's' : ''}. Consider negating.`
              : row.severity === 'warning'
                ? `${row.totalOrders} order${row.totalOrders !== 1 ? 's' : ''} vs ${Math.ceil(row.expectedSalesAtPrice)} expected. Review bids.`
                : `Approaching waste threshold. Monitor closely.`
            }
          </p>
        </div>
      )}
    </div>
  );
}

export function KeywordWasteTable({ waste }: { waste: KeywordWasteSummary }) {
  const [showAll, setShowAll] = useState(false);
  const displayRows = showAll ? waste.flaggedKeywords : waste.flaggedKeywords.slice(0, 10);

  if (!waste.flaggedKeywords.length) {
    return (
      <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-[#2d8a56]">
          <Eye size={18} />
          <p className="text-sm font-semibold">No runaway keywords detected</p>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-700)]">All keywords are within acceptable spend-to-sales ratios.</p>
      </div>
    );
  }

  const criticalCount = waste.flaggedKeywords.filter(k => k.severity === 'critical').length;
  const warningCount = waste.flaggedKeywords.filter(k => k.severity === 'warning').length;
  const watchCount = waste.flaggedKeywords.filter(k => k.severity === 'watch').length;

  return (
    <div className="space-y-4">
      {/* Summary stats bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-2.5 shadow-sm">
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--ink-950)] tabular-nums">{fmt(waste.totalWastedSpend)}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Flagged spend</p>
          </div>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#16324a] px-3 py-1.5 text-[11px] font-semibold text-white">
            <AlertCircle size={12} /> {criticalCount} Critical
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#fff8e8] px-3 py-1.5 text-[11px] font-semibold text-[#876a18]">
            <AlertTriangle size={12} /> {warningCount} Warning
          </div>
        )}
        {watchCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#eef2f6] px-3 py-1.5 text-[11px] font-semibold text-[#627587]">
            <Eye size={12} /> {watchCount} Watch
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-[var(--panel-muted)]">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Keyword</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Severity</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Spend</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Sales</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Orders</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Spend / price</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Sales deficit</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map(row => (
                <KeywordRow key={row.keyword} row={row} />
              ))}
            </tbody>
          </table>
        </div>
        {waste.flaggedKeywords.length > 10 && (
          <div className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{waste.sourceView}</p>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-[var(--blue-700)] hover:underline"
            >
              {showAll ? 'Show fewer' : `Show all ${waste.flaggedKeywords.length} keywords`}
            </button>
          </div>
        )}
        {waste.flaggedKeywords.length <= 10 && (
          <p className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{waste.sourceView}</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
        {displayRows.map(row => (
          <KeywordCard key={row.keyword} row={row} />
        ))}
        {waste.flaggedKeywords.length > 10 && (
          <div className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-[var(--blue-700)] hover:underline"
            >
              {showAll ? 'Show fewer' : `Show all ${waste.flaggedKeywords.length} keywords`}
            </button>
          </div>
        )}
        <p className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{waste.sourceView}</p>
      </div>

      <p className="text-[11px] text-[var(--ink-600)] leading-5">
        <span className="font-semibold">Methodology:</span> Compares per-keyword ad spend against average product price ({fmt(waste.flaggedKeywords[0]?.avgProductPrice || 0)}).
        Keywords are flagged when spend reaches or exceeds product price without proportional sales.
        Click any keyword to see campaign-level breakdown by match type.
      </p>
    </div>
  );
}
