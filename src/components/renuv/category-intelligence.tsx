'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryIntelligence, CategoryShareQuery, BSREntry, CategoryShareTrend } from '@/lib/renuv-search';

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function pctPts(value: number) {
  const pts = value * 100;
  if (pts > 0) return `+${pts.toFixed(1)} pts`;
  if (pts < 0) return `${pts.toFixed(1)} pts`;
  return '—';
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0.005) return <TrendingUp size={13} className="text-[#2d8a56]" />;
  if (value < -0.005) return <TrendingDown size={13} className="text-[#b15d27]" />;
  return <Minus size={13} className="text-[#627587]" />;
}

function ShareBar({ ours, label }: { ours: number; label: string }) {
  const oursPct = Math.min(ours * 100, 100);
  const compPct = 100 - oursPct;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-[var(--ink-600)]">
        <span>{label}</span>
        <span className="font-semibold text-[var(--ink-900)]">{pct(ours)}</span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#eef2f6]">
        <div
          className="rounded-full bg-[#3b82f6] transition-all"
          style={{ width: `${oursPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[var(--ink-500)]">
        <span>You: {oursPct.toFixed(1)}%</span>
        <span>Competitors: {compPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function ConversionEdgeBadge({ edge }: { edge: number }) {
  if (edge <= 0) return <span className="text-[11px] text-[var(--ink-500)]">—</span>;
  const pctValue = (edge * 100).toFixed(0);
  if (edge >= 1.2) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f4ee] px-2 py-0.5 text-[10px] font-semibold text-[#2d8a56]">
        {pctValue}% edge
      </span>
    );
  }
  if (edge >= 0.8) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f6] px-2 py-0.5 text-[10px] font-semibold text-[#627587]">
        {pctValue}% parity
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e8] px-2 py-0.5 text-[10px] font-semibold text-[#b15d27]">
      {pctValue}% behind
    </span>
  );
}

function QueryRow({ q }: { q: CategoryShareQuery }) {
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
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--ink-900)]">{q.searchQuery}</p>
              <p className="text-[11px] text-[var(--ink-600)]">{q.queryVolume.toLocaleString()} searches/wk</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-sm font-semibold tabular-nums text-[var(--ink-900)]">{pct(q.ourImpressionShare)}</span>
            <TrendIcon value={q.weekOverWeekImpressionChange} />
          </div>
          <p className="text-[10px] text-[var(--ink-600)] tabular-nums">{pctPts(q.weekOverWeekImpressionChange)}</p>
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-sm font-semibold tabular-nums text-[var(--ink-900)]">{pct(q.ourClickShare)}</span>
            <TrendIcon value={q.weekOverWeekClickChange} />
          </div>
          <p className="text-[10px] text-[var(--ink-600)] tabular-nums">{pctPts(q.weekOverWeekClickChange)}</p>
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-sm font-semibold tabular-nums text-[var(--ink-900)]">{pct(q.ourPurchaseShare)}</span>
            <TrendIcon value={q.weekOverWeekPurchaseChange} />
          </div>
          <p className="text-[10px] text-[var(--ink-600)] tabular-nums">{pctPts(q.weekOverWeekPurchaseChange)}</p>
        </td>
        <td className="px-3 py-3 text-center">
          <ConversionEdgeBadge edge={q.conversionEdge} />
        </td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">{q.ourClicks.toLocaleString()}</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">{q.ourPurchases.toLocaleString()}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-[rgba(94,168,255,0.03)] px-4 py-4">
            <div className="grid gap-4 md:grid-cols-3">
              <ShareBar ours={q.ourImpressionShare} label="Impression share" />
              <ShareBar ours={q.ourClickShare} label="Click share" />
              <ShareBar ours={q.ourPurchaseShare} label="Purchase share" />
            </div>
            <div className="mt-3 rounded-xl border border-[var(--line-soft)] bg-white p-3">
              <p className="text-[11px] leading-5 text-[var(--ink-700)]">
                <span className="font-semibold">Competitive read:</span>{' '}
                {q.conversionEdge >= 1.2
                  ? `You convert significantly better than the field on "${q.searchQuery}" — your ${pct(q.ourClickShare)} click share yields ${pct(q.ourPurchaseShare)} purchase share. Competitors collectively have ${pct(q.competitorClickShare)} of clicks but only ${pct(q.competitorPurchaseShare)} of purchases. This is a strong position to defend and scale.`
                  : q.conversionEdge >= 0.8
                    ? `Conversion is roughly at parity with the field on "${q.searchQuery}". Your purchase share (${pct(q.ourPurchaseShare)}) tracks your click share (${pct(q.ourClickShare)}). Focus on growing click share through better placement and creative to capture more volume.`
                    : `Competitors are converting better than you on "${q.searchQuery}" — you capture ${pct(q.ourClickShare)} of clicks but only ${pct(q.ourPurchaseShare)} of purchases. Review listing quality, pricing, and reviews to close the conversion gap.`
                }
                {q.weekOverWeekClickChange > 0.02
                  ? ` Week-over-week share is trending up — keep investing.`
                  : q.weekOverWeekClickChange < -0.02
                    ? ` Week-over-week share is declining — investigate competitive pressure or bid adjustments.`
                    : ''
                }
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Mobile card for a query
function QueryCard({ q }: { q: CategoryShareQuery }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[var(--line-soft)] p-4">
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-[var(--ink-500)] shrink-0 mt-0.5">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink-900)] truncate">{q.searchQuery}</p>
            <p className="text-[11px] text-[var(--ink-600)]">{q.queryVolume.toLocaleString()} searches/wk</p>
          </div>
        </div>
        <ConversionEdgeBadge edge={q.conversionEdge} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[var(--ink-600)]">Impression</span>
          <div className="flex items-center gap-1">
            <p className="font-semibold text-[var(--ink-900)]">{pct(q.ourImpressionShare)}</p>
            <TrendIcon value={q.weekOverWeekImpressionChange} />
          </div>
        </div>
        <div>
          <span className="text-[var(--ink-600)]">Click</span>
          <div className="flex items-center gap-1">
            <p className="font-semibold text-[var(--ink-900)]">{pct(q.ourClickShare)}</p>
            <TrendIcon value={q.weekOverWeekClickChange} />
          </div>
        </div>
        <div>
          <span className="text-[var(--ink-600)]">Purchase</span>
          <div className="flex items-center gap-1">
            <p className="font-semibold text-[var(--ink-900)]">{pct(q.ourPurchaseShare)}</p>
            <TrendIcon value={q.weekOverWeekPurchaseChange} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <ShareBar ours={q.ourImpressionShare} label="Impression share" />
          <ShareBar ours={q.ourClickShare} label="Click share" />
          <ShareBar ours={q.ourPurchaseShare} label="Purchase share" />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-[var(--ink-600)]">Your clicks</span><p className="font-semibold">{q.ourClicks.toLocaleString()}</p></div>
            <div><span className="text-[var(--ink-600)]">Your purchases</span><p className="font-semibold">{q.ourPurchases.toLocaleString()}</p></div>
          </div>
          <p className="text-[11px] leading-5 text-[var(--ink-600)]">
            {q.conversionEdge >= 1.2
              ? `Strong conversion advantage on this query. You outperform the field on purchase-to-click ratio.`
              : q.conversionEdge >= 0.8
                ? `Conversion at parity with competitors. Focus on growing click share.`
                : `Competitors convert better. Review listing, pricing, and reviews.`
            }
          </p>
        </div>
      )}
    </div>
  );
}

function ShareTrendChart({ trends }: { trends: CategoryShareTrend[] }) {
  if (trends.length < 2) {
    return <p className="text-sm text-[var(--ink-600)]">Insufficient trend data (need 2+ weeks).</p>;
  }

  const data = trends.map(t => ({
    week: t.weekEnding.replace(/^\d{4}-/, ''),
    impression: +(t.avgImpressionShare * 100).toFixed(2),
    click: +(t.avgClickShare * 100).toFixed(2),
    purchase: +(t.avgPurchaseShare * 100).toFixed(2),
  }));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradClick" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPurch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
              width={45}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}%`,
                name === 'impression' ? 'Impression share' : name === 'click' ? 'Click share' : 'Purchase share'
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
            />
            <Legend
              formatter={(value: string) =>
                value === 'impression' ? 'Impression share' : value === 'click' ? 'Click share' : 'Purchase share'
              }
              wrapperStyle={{ fontSize: 11 }}
            />
            <Area type="monotone" dataKey="impression" stroke="#94a3b8" fill="url(#gradImp)" strokeWidth={1.5} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="click" stroke="#3b82f6" fill="url(#gradClick)" strokeWidth={2} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="purchase" stroke="#22c55e" fill="url(#gradPurch)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BSRTrendChart({ trend, productName }: { trend: BSREntry['trend']; productName: string }) {
  if (!trend || trend.length < 2) {
    return <p className="text-xs text-[var(--ink-600)] py-2">Insufficient history for trend chart.</p>;
  }

  const data = trend.map(t => ({
    date: t.date.replace(/^\d{4}-/, ''),
    rank: t.rank,
  }));

  // For BSR, lower is better so we reverse the Y axis
  const maxRank = Math.max(...trend.map(t => t.rank));
  const minRank = Math.min(...trend.map(t => t.rank));
  const padding = Math.max(Math.round((maxRank - minRank) * 0.15), 500);

  return (
    <div className="mt-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">
        BSR trend — {productName}
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            interval={Math.max(0, Math.floor(data.length / 6))}
          />
          <YAxis
            reversed
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => `#${v.toLocaleString()}`}
            width={65}
            domain={[Math.max(1, minRank - padding), maxRank + padding]}
          />
          <Tooltip
            formatter={(value: number) => [`#${value.toLocaleString()}`, 'BSR']}
            contentStyle={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 2.5, fill: '#3b82f6' }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[10px] text-[var(--ink-500)]">Lower rank = better. Chart Y-axis is inverted.</p>
    </div>
  );
}

function BSRRow({ entry }: { entry: BSREntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasTrend = entry.trend && entry.trend.length >= 2;

  // Calculate trend direction from history
  let trendDirection: 'improving' | 'needs attention' | 'stable' = 'stable';
  if (hasTrend) {
    const firstRank = entry.trend[0].rank;
    const lastRank = entry.trend[entry.trend.length - 1].rank;
    const changePct = ((lastRank - firstRank) / firstRank) * 100;
    // Lower rank = better, so rank going down = improving
    if (changePct < -5) trendDirection = 'improving';
    else if (changePct > 5) trendDirection = 'needs attention';
  }

  return (
    <>
      <div
        className={`flex items-center gap-3 px-4 py-3 ${hasTrend ? 'cursor-pointer hover:bg-[rgba(94,168,255,0.04)]' : ''} transition-colors`}
        onClick={() => hasTrend && setExpanded(!expanded)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ff] text-xs font-bold text-[#1a5490] shrink-0">
          {hasTrend ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <Award size={14} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--ink-900)] truncate">{entry.productName}</p>
          <div className="flex items-center gap-2">
            <a href={`https://www.amazon.com/dp/${entry.asin}`} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-[var(--blue-700)] hover:underline" onClick={e => e.stopPropagation()}>{entry.asin}</a>
            {hasTrend && (
              <span className={`text-[10px] font-semibold ${
                trendDirection === 'improving' ? 'text-[#2d8a56]' : trendDirection === 'needs attention' ? 'text-[#b15d27]' : 'text-[#627587]'
              }`}>
                {trendDirection === 'improving' ? 'Improving' : trendDirection === 'needs attention' ? 'Needs attention' : 'Stable'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-semibold tabular-nums text-[var(--ink-950)]">#{entry.salesRank.toLocaleString()}</p>
          <p className="text-[10px] text-[var(--ink-600)]">in category</p>
        </div>
      </div>
      {expanded && hasTrend && (
        <div className="px-4 pb-4 border-b border-[var(--line-soft)]">
          <BSRTrendChart trend={entry.trend} productName={entry.productName} />
        </div>
      )}
    </>
  );
}

function BSRTable({ entries }: { entries: BSREntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--line-soft)] bg-white shadow-sm">
      <div className="bg-[var(--panel-muted)] px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Best Sellers Rank (BSR) — click for trend</p>
      </div>
      <div className="divide-y divide-[var(--line-soft)]">
        {entries.map((e) => (
          <BSRRow key={e.asin} entry={e} />
        ))}
      </div>
    </div>
  );
}

export function CategoryIntelligenceSection({ data }: { data: CategoryIntelligence }) {
  const [showAll, setShowAll] = useState(false);
  const displayQueries = showAll ? data.queryShares : data.queryShares.slice(0, 10);

  const gainingCount = data.queryShares.filter(q => q.weekOverWeekClickChange > 0.01).length;
  const losingCount = data.queryShares.filter(q => q.weekOverWeekClickChange < -0.01).length;
  const stableCount = data.queryShares.length - gainingCount - losingCount;

  return (
    <div className="space-y-6">
      {/* Headline + summary stats */}
      <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.96))] p-5">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink-950)]">{data.headline}</h3>
        <p className="mt-2 text-sm text-[var(--ink-700)]">{data.weekLabel}</p>
      </div>

      {/* Summary KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Avg impression share"
          value={pct(data.avgImpressionShare)}
          detail={`Competitors: ${pct(1 - data.avgImpressionShare)}`}
        />
        <SummaryCard
          label="Avg click share"
          value={pct(data.avgClickShare)}
          detail={`Competitors: ${pct(1 - data.avgClickShare)}`}
        />
        <SummaryCard
          label="Avg purchase share"
          value={pct(data.avgPurchaseShare)}
          detail={`Competitors: ${pct(1 - data.avgPurchaseShare)}`}
        />
        <SummaryCard
          label="Conversion edge"
          value={data.overallConversionEdge > 0 ? `${(data.overallConversionEdge * 100).toFixed(0)}%` : '—'}
          detail={
            data.overallConversionEdge >= 1.2 ? 'You convert better than field avg'
              : data.overallConversionEdge >= 0.8 ? 'At parity with competitors'
                : 'Competitors converting better'
          }
          highlight={data.overallConversionEdge >= 1.2 ? 'positive' : data.overallConversionEdge >= 0.8 ? 'neutral' : 'warning'}
        />
      </div>

      {/* Momentum bar */}
      <div className="flex flex-wrap items-center gap-3">
        {gainingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#e7f4ee] px-3 py-1.5 text-[11px] font-semibold text-[#2d8a56]">
            <TrendingUp size={12} /> {gainingCount} gaining share
          </div>
        )}
        {stableCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#eef2f6] px-3 py-1.5 text-[11px] font-semibold text-[#627587]">
            <Minus size={12} /> {stableCount} stable
          </div>
        )}
        {losingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#fff0e8] px-3 py-1.5 text-[11px] font-semibold text-[#b15d27]">
            <TrendingDown size={12} /> {losingCount} losing share
          </div>
        )}
      </div>

      {/* Share trends chart — full width */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Share trend — last {data.shareTrends.length} weeks</p>
        <ShareTrendChart trends={data.shareTrends} />
        <p className="mt-2 text-[11px] text-[var(--ink-600)]">
          Shows your average impression, click, and purchase share across all tracked search queries each week.
          If purchase share is above click share, you convert better than the market average.
        </p>
      </div>

      {/* BSR — full width, sorted best sellers first */}
      <div>
        <BSRTable entries={[...data.bsrTracking].sort((a, b) => a.salesRank - b.salesRank)} />
      </div>

      {/* Per-query competitive table */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Per-query competitive share — click any row for details</p>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-[var(--panel-muted)]">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Search query</th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Impr. share</th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Click share</th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Purchase share</th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Conv. edge</th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Clicks</th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Purchases</th>
                </tr>
              </thead>
              <tbody>
                {displayQueries.map(q => (
                  <QueryRow key={q.searchQuery} q={q} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{data.sourceView}</p>
            {data.queryShares.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-[var(--blue-700)] hover:underline"
              >
                {showAll ? 'Show fewer' : `Show all ${data.queryShares.length} queries`}
              </button>
            )}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
          {displayQueries.map(q => (
            <QueryCard key={q.searchQuery} q={q} />
          ))}
          {data.queryShares.length > 10 && (
            <div className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-[var(--blue-700)] hover:underline"
              >
                {showAll ? 'Show fewer' : `Show all ${data.queryShares.length} queries`}
              </button>
            </div>
          )}
          <p className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{data.sourceView}</p>
        </div>
      </div>

      {/* Methodology explanation */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)] mb-2">How to read this data</p>
        <div className="space-y-2 text-[11px] leading-5 text-[var(--ink-700)]">
          <p><span className="font-semibold">Share metrics</span> come from Amazon Brand Analytics and represent your percentage of the total market for each search query. If you have 10% click share, all other sellers collectively have 90%.</p>
          <p><span className="font-semibold">Conversion edge</span> compares your purchase-to-click ratio against the overall market. A value above 100% means shoppers who click your listing are more likely to buy than the average seller. Below 100% means competitors convert better.</p>
          <p><span className="font-semibold">Week-over-week changes</span> show momentum — gaining share means you&apos;re winning competitive ground, losing share means competitors or algorithm changes are pushing you down.</p>
          <p><span className="font-semibold">BSR (Best Sellers Rank)</span> reflects your product&apos;s sales velocity relative to every other product in the same category on Amazon. Lower is better.</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail, highlight }: { label: string; value: string; detail: string; highlight?: 'positive' | 'neutral' | 'warning' }) {
  const borderColor = highlight === 'positive' ? 'border-[#bbf7d0]' : highlight === 'warning' ? 'border-[#fed7aa]' : 'border-[var(--line-soft)]';
  return (
    <div className={`rounded-[20px] border ${borderColor} bg-white p-4 shadow-sm`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--ink-600)]">{detail}</p>
    </div>
  );
}
