'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SearchOpportunityRow, SearchOpportunityPlacement } from '@/lib/renuv-advertising';

function fmtCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function fmtNum(value: number) {
  return value.toLocaleString();
}

function ThemeBadge({ theme }: { theme: string }) {
  const tone = theme.includes('High') ? 'bg-[#fff8e8] text-[#876a18]'
    : theme.includes('Medium') ? 'bg-[#e8f4ff] text-[#1a5490]'
    : 'bg-[#eef2f6] text-[#627587]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {theme}
    </span>
  );
}

function VolumeBadge({ volume }: { volume: string }) {
  const tone = volume === 'High' ? 'bg-[#e7f4ee] text-[#2d8a56]'
    : volume === 'Medium' ? 'bg-[#fff8e8] text-[#876a18]'
    : 'bg-[#eef2f6] text-[#627587]';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {volume}
    </span>
  );
}

function PlacementRow({ placement }: { placement: SearchOpportunityPlacement }) {
  return (
    <tr className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)]">
      <td className="pl-10 pr-3 py-2.5 text-xs text-[var(--ink-800)]">{placement.campaignName}</td>
      <td className="px-3 py-2.5">
        <span className="inline-flex rounded-full bg-[#e8f4ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1a5490]">
          {placement.matchType}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-[var(--ink-800)] text-right tabular-nums">{fmtCurrency(placement.spend)}</td>
      <td className="px-3 py-2.5 text-xs text-[var(--ink-800)] text-right tabular-nums">{fmtCurrency(placement.sales)}</td>
      <td className="px-3 py-2.5 text-xs text-[var(--ink-800)] text-right tabular-nums">{fmtNum(placement.clicks)}</td>
      <td className="px-3 py-2.5 text-xs text-[var(--ink-800)] text-right tabular-nums">{fmtNum(placement.orders)}</td>
      <td className="px-3 py-2.5 text-xs text-right tabular-nums">
        <span className={placement.acos === 0 ? 'text-[var(--ink-500)]' : placement.acos <= 30 ? 'text-[#2d8a56]' : placement.acos <= 60 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
          {placement.acos === 0 ? '—' : placement.acos < 999 ? `${placement.acos.toFixed(0)}%` : 'No sales'}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-right tabular-nums">
        <span className={placement.roas >= 3 ? 'text-[#2d8a56]' : placement.roas >= 1 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
          {placement.roas > 0 ? `${placement.roas.toFixed(2)}x` : '—'}
        </span>
      </td>
    </tr>
  );
}

function OpportunityRow({ row }: { row: SearchOpportunityRow }) {
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
              <p className="text-sm font-medium text-[var(--ink-900)] leading-tight">{row.query}</p>
              <p className="text-[11px] text-[var(--ink-600)] mt-0.5">
                {row.placements.length} placement{row.placements.length !== 1 ? 's' : ''} · {fmtNum(row.totalClicks)} clicks · {fmtCurrency(row.totalSpend)} spend
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right"><ThemeBadge theme={row.theme} /></td>
        <td className="px-3 py-3 text-right"><VolumeBadge volume={row.searchVolume} /></td>
        <td className="px-3 py-3 text-sm text-[var(--ink-800)] leading-tight">{row.opportunity}</td>
        <td className="px-3 py-3 text-sm text-right tabular-nums">
          <span className={row.cvr >= 10 ? 'text-[#2d8a56]' : 'text-[#b15d27]'}>
            {row.cvrGap}
          </span>
        </td>
        <td className="px-3 py-3 text-sm text-[var(--ink-800)] leading-tight">{row.actionBias}</td>
      </tr>
      {expanded && (
        <>
          <tr className="border-t border-[rgba(94,168,255,0.15)]">
            <td colSpan={6} className="px-0 py-0">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[rgba(94,168,255,0.06)]">
                      <th className="pl-10 pr-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Campaign</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Match type</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Spend</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Sales</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Clicks</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Orders</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">ACOS</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.placements.length > 0 ? (
                      row.placements.sort((a, b) => b.spend - a.spend).map((p, idx) => (
                        <PlacementRow key={`${p.campaignName}-${p.matchType}-${idx}`} placement={p} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-10 py-4 text-xs italic text-[var(--ink-600)]">No per-campaign breakdown available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
          {row.placements.length > 0 && (
            <tr>
              <td colSpan={6} className="px-0 py-0 bg-[rgba(94,168,255,0.04)]">
                <div className="px-10 py-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Per-campaign recommendations</p>
                  {row.placements.sort((a, b) => b.spend - a.spend).map((p, idx) => (
                    <div key={`rec-${idx}`} className="text-[11px] leading-5 text-[var(--ink-700)]">
                      <span className="font-semibold text-[var(--ink-900)]">{p.campaignName}</span>
                      <span className="ml-1 text-[var(--ink-500)]">({p.matchType}):</span>{' '}
                      <span>{p.recommendation}</span>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
}

// Mobile card version
function OpportunityCard({ row }: { row: SearchOpportunityRow }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-[var(--line-soft)] p-4">
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-[var(--ink-500)] shrink-0 mt-0.5">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink-900)] truncate">{row.query}</p>
            <p className="text-[11px] text-[var(--ink-600)] mt-0.5">
              {row.placements.length} placement{row.placements.length !== 1 ? 's' : ''} · {fmtCurrency(row.totalSpend)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ThemeBadge theme={row.theme} />
          <VolumeBadge volume={row.searchVolume} />
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-[var(--ink-700)]">
        <p><span className="font-semibold">Opportunity:</span> {row.opportunity}</p>
        <p><span className="font-semibold">CVR gap:</span> {row.cvrGap}</p>
        <p><span className="font-semibold">Action:</span> {row.actionBias}</p>
      </div>
      {expanded && row.placements.length > 0 && (
        <div className="mt-3 space-y-2">
          {row.placements.sort((a, b) => b.spend - a.spend).map((p, idx) => (
            <div key={idx} className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel-muted)] p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[var(--ink-900)] truncate">{p.campaignName}</p>
                <span className="inline-flex rounded-full bg-[#e8f4ff] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#1a5490] shrink-0">
                  {p.matchType}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-[var(--ink-600)]">Spend</span><p className="font-semibold">{fmtCurrency(p.spend)}</p></div>
                <div><span className="text-[var(--ink-600)]">Sales</span><p className="font-semibold">{fmtCurrency(p.sales)}</p></div>
                <div><span className="text-[var(--ink-600)]">Orders</span><p className="font-semibold">{p.orders}</p></div>
              </div>
              <div className="flex gap-4 text-[11px]">
                <span className={p.acos <= 30 ? 'text-[#2d8a56]' : p.acos <= 60 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
                  ACOS: {p.acos < 999 ? `${p.acos.toFixed(0)}%` : 'No sales'}
                </span>
                <span className={p.roas >= 3 ? 'text-[#2d8a56]' : p.roas >= 1 ? 'text-[#876a18]' : 'text-[#b15d27]'}>
                  ROAS: {p.roas > 0 ? `${p.roas.toFixed(2)}x` : '—'}
                </span>
              </div>
              <p className="text-[11px] italic text-[var(--ink-700)]">{p.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchOpportunitiesTable({ rows }: { rows: SearchOpportunityRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-6 text-center">
        <p className="text-sm text-[var(--ink-700)]">No search opportunities to show for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-[var(--panel-muted)]">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Query</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Theme</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">Volume</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Opportunity</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)] text-right">CVR gap</th>
                <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">Action bias</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <OpportunityRow key={row.query} row={row} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
          {rows[0]?.sourceView}
        </p>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
        {rows.map(row => (
          <OpportunityCard key={row.query} row={row} />
        ))}
        <p className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">
          {rows[0]?.sourceView}
        </p>
      </div>

      <div className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4 text-[11px] leading-5 text-[var(--ink-700)]">
        <p className="font-semibold text-[var(--ink-900)] mb-1">How these keywords are selected</p>
        <p>
          Source: <code className="px-1 rounded bg-white text-[10px]">ops_amazon.amzn_ads_sp_search_terms_v2_view</code> (Sponsored Products search terms report).
          We filter out brand terms (&quot;renuv&quot;, &quot;renüv&quot;), deduplicate on (date, campaign_id, search_term) to avoid double-counted rows,
          aggregate by search term, and return the <strong>top 10 by total ad spend</strong> in the selected date range.
          These are the highest-investment non-brand keywords — the ones where decisions to scale, cut, or optimize have the biggest $ impact.
        </p>
        <p className="mt-2"><span className="font-semibold">Theme</span> = spend bucket (&gt;$1K High, &gt;$500 Medium, else Low).{' '}
        <span className="font-semibold">Volume</span> = click bucket (&gt;500 High, &gt;200 Medium, else Low).{' '}
        <span className="font-semibold">Opportunity</span>: ACOS&gt;30% → efficiency improvement; sales&gt;$2K → scale; else monitor.{' '}
        <span className="font-semibold">CVR gap</span> = CVR vs 10% benchmark.{' '}
        <span className="font-semibold">Action bias</span>: ACOS&gt;40% → review &amp; reduce; CVR&lt;10% → improve conversion; else scale.</p>
        <p className="mt-2">
          Click any keyword row to expand it and see the per-campaign / match-type breakdown with a specific recommendation for each placement.
        </p>
      </div>
    </div>
  );
}
