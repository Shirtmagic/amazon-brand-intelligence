'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  Target,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  Crown,
} from 'lucide-react';
import type {
  CompetitorIntelligence,
  CompetitiveKeyword,
  CompetitorAsin,
  TopCompetitorPosition,
} from '@/lib/renuv-competitors';

/* ── localStorage for focus keywords ── */

const FOCUS_STORAGE_KEY = 'renuv-competitor-focus-keywords';

function loadFocusKeywords(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveFocusKeywords(kws: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(kws));
}

/* ── helpers ── */

function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }
function pctPts(v: number) {
  const pts = v * 100;
  if (pts > 0.05) return `+${pts.toFixed(1)} pts`;
  if (pts < -0.05) return `${pts.toFixed(1)} pts`;
  return '—';
}

function TrendBadge({ trend }: { trend: 'gaining' | 'losing' | 'stable' }) {
  if (trend === 'gaining') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f4ee] px-2.5 py-1 text-[10px] font-semibold text-[#2d8a56]">
      <TrendingUp size={11} /> Gaining
    </span>
  );
  if (trend === 'losing') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e8] px-2.5 py-1 text-[10px] font-semibold text-[#b15d27]">
      <TrendingDown size={11} /> Losing
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f6] px-2.5 py-1 text-[10px] font-semibold text-[#627587]">
      <Minus size={11} /> Stable
    </span>
  );
}

function PressureBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-[#fde8e8] text-[#c53030]',
    high: 'bg-[#fff0e8] text-[#b15d27]',
    medium: 'bg-[#fef9c3] text-[#92400e]',
    low: 'bg-[#eef2f6] text-[#627587]',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[level] || styles.low}`}>
      {(level === 'critical' || level === 'high') && <AlertTriangle size={10} />}
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

/* ── SOV Trend Chart ── */

function SOVTrendChart({ data }: { data: CompetitorIntelligence }) {
  if (data.sovTrend.length < 2) return <p className="text-sm text-[var(--ink-600)]">Insufficient trend data (need 2+ weeks).</p>;

  const chartData = data.sovTrend.map(w => ({
    week: w.weekEnding.replace(/^\d{4}-/, ''),
    impression: +(w.avgImpressionShare * 100).toFixed(2),
    click: +(w.avgClickShare * 100).toFixed(2),
    purchase: +(w.avgPurchaseShare * 100).toFixed(2),
  }));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sovGradImp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sovGradClick" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sovGradPurch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} width={45} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}%`,
                name === 'impression' ? 'Impression SOV' : name === 'click' ? 'Click SOV' : 'Purchase SOV',
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
            />
            <Legend
              formatter={(v: string) => v === 'impression' ? 'Impression SOV' : v === 'click' ? 'Click SOV' : 'Purchase SOV'}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Area type="monotone" dataKey="impression" stroke="#94a3b8" fill="url(#sovGradImp)" strokeWidth={1.5} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="click" stroke="#3b82f6" fill="url(#sovGradClick)" strokeWidth={2} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="purchase" stroke="#22c55e" fill="url(#sovGradPurch)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Sparkline ── */

function ShareSparkline({ history }: { history: { ourClickShare: number }[] }) {
  if (history.length < 2) return null;
  const data = history.map(h => h.ourClickShare * 100);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const trending = data[data.length - 1] >= data[0];

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke={trending ? '#22c55e' : '#ef4444'} strokeWidth={1.5} />
    </svg>
  );
}

/* ── Top Positions Table (Top 3 competitors for a keyword + our comparison) ── */

function TopPositionsTable({ positions, keyword, kw }: {
  positions: TopCompetitorPosition[];
  keyword: string;
  kw: CompetitiveKeyword;
}) {
  if (positions.length === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
        <p className="text-sm text-[var(--ink-600)]">
          Top position data not available for &quot;{keyword}&quot;. The Brand Analytics table may only contain your own ASINs — competitor ASIN-level data requires the Top Search Terms report.
        </p>
      </div>
    );
  }

  const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32']; // gold, silver, bronze
  const rankLabels = ['#1', '#2', '#3', '#4', '#5'];

  const totalClicks = kw.estimatedTotalClicks;
  const totalPurchases = kw.estimatedTotalPurchases;
  const hasTotals = totalClicks > 0;

  // Check if we appear in the top 3 already
  const weAreInTop3 = positions.some(p => p.isOurs);

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--line-soft)] bg-white shadow-sm">
      {/* Header with market totals */}
      <div className="bg-[var(--panel-muted)] px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Top positions for &quot;{keyword}&quot; — by click share
        </p>
        {hasTotals && (
          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-[11px] text-[var(--ink-700)]">
            <span>{kw.searchVolume.toLocaleString()} searches/wk</span>
            <span className="text-[var(--ink-400)]">|</span>
            <span>~{totalClicks.toLocaleString()} total clicks</span>
            <span className="text-[var(--ink-400)]">|</span>
            <span>~{totalPurchases.toLocaleString()} total purchases</span>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-[var(--line-soft)] bg-[var(--panel-muted)]">
        <div className="w-8 shrink-0" />
        <div className="min-w-0 flex-1" />
        <div className="text-right shrink-0 w-[110px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">Clicks</p>
        </div>
        <div className="text-right shrink-0 w-[110px]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">Purchases</p>
        </div>
      </div>

      {/* Position rows */}
      <div className="divide-y divide-[var(--line-soft)]">
        {positions.map((pos, idx) => {
          const estClicks = hasTotals ? Math.round(totalClicks * pos.clickShare) : 0;
          const estPurchases = hasTotals ? Math.round(totalPurchases * pos.purchaseShare) : 0;

          return (
            <div key={pos.asin} className={`px-4 py-3 ${pos.isOurs ? 'bg-[rgba(59,130,246,0.06)]' : ''}`}>
              <div className="flex items-center gap-3">
                {/* Rank badge */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: idx < 3 ? rankColors[idx] : '#cbd5e1' }}
                >
                  {rankLabels[idx] || `#${pos.rank}`}
                </div>
                {/* Product info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${pos.isOurs ? 'text-[#1a5490]' : 'text-[var(--ink-900)]'}`}>
                      {pos.productName.length > 60 ? pos.productName.slice(0, 60) + '...' : pos.productName}
                    </p>
                    {pos.isOurs && (
                      <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-[#e8f4ff] px-2 py-0.5 text-[9px] font-bold text-[#1a5490] uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <a href={`https://www.amazon.com/dp/${pos.asin}`} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-[var(--blue-700)] hover:underline inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {pos.asin} <ExternalLink size={10} />
                  </a>
                </div>
                {/* Clicks: count + share */}
                <div className="text-right shrink-0 w-[110px]">
                  {hasTotals ? (
                    <>
                      <p className="text-lg font-semibold tabular-nums text-[var(--ink-950)]">{estClicks.toLocaleString()}</p>
                      <p className="text-[11px] tabular-nums text-[var(--ink-500)]">{pct(pos.clickShare)} share</p>
                    </>
                  ) : (
                    <p className="text-lg font-semibold tabular-nums text-[var(--ink-950)]">{pct(pos.clickShare)}</p>
                  )}
                </div>
                {/* Purchases: count + share */}
                <div className="text-right shrink-0 w-[110px]">
                  {hasTotals ? (
                    <>
                      <p className="text-lg font-semibold tabular-nums text-[var(--ink-950)]">{estPurchases.toLocaleString()}</p>
                      <p className="text-[11px] tabular-nums text-[var(--ink-500)]">{pct(pos.purchaseShare)} share</p>
                    </>
                  ) : (
                    <p className="text-lg font-semibold tabular-nums text-[var(--ink-950)]">{pct(pos.purchaseShare)}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Our position row — always shown at bottom for comparison */}
      <div className={`border-t-2 ${weAreInTop3 ? 'border-[#93c5fd]' : 'border-dashed border-[#93c5fd]'} bg-[rgba(59,130,246,0.05)] px-4 py-3`}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a5490] text-xs font-bold text-white shrink-0">
            You
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#1a5490]">Your combined ASINs</p>
              <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-[#e8f4ff] px-2 py-0.5 text-[9px] font-bold text-[#1a5490] uppercase">
                You
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink-600)]">All your ASINs on this keyword</p>
          </div>
          {/* Our clicks */}
          <div className="text-right shrink-0 w-[110px]">
            <p className="text-lg font-semibold tabular-nums text-[#1a5490]">{kw.ourClickCount.toLocaleString()}</p>
            <p className="text-[11px] tabular-nums text-[#1a5490]">{pct(kw.ourClickShare)} share</p>
          </div>
          {/* Our purchases */}
          <div className="text-right shrink-0 w-[110px]">
            <p className="text-lg font-semibold tabular-nums text-[#1a5490]">{kw.ourPurchaseCount.toLocaleString()}</p>
            <p className="text-[11px] tabular-nums text-[#1a5490]">{pct(kw.ourPurchaseShare)} share</p>
          </div>
        </div>

        {/* Delta to each position */}
        {hasTotals && positions.length > 0 && (
          <div className="mt-2 ml-11 space-y-1">
            {positions.filter(p => !p.isOurs).map((pos, idx) => {
              const posClicks = Math.round(totalClicks * pos.clickShare);
              const posPurchases = Math.round(totalPurchases * pos.purchaseShare);
              const clickDelta = kw.ourClickCount - posClicks;
              const purchaseDelta = kw.ourPurchaseCount - posPurchases;
              const posLabel = `#${pos.rank || idx + 1}`;
              return (
                <div key={pos.asin} className="flex flex-wrap gap-4 text-[11px]">
                  <span className="font-semibold text-[var(--ink-600)] w-[32px]">vs {posLabel}</span>
                  <span className={clickDelta >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}>
                    {clickDelta >= 0 ? '+' : ''}{clickDelta.toLocaleString()} clicks
                    <span className="ml-1 text-[var(--ink-400)]">({clickDelta >= 0 ? '+' : ''}{pctPts(kw.ourClickShare - pos.clickShare)})</span>
                  </span>
                  <span className={purchaseDelta >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}>
                    {purchaseDelta >= 0 ? '+' : ''}{purchaseDelta.toLocaleString()} purchases
                    <span className="ml-1 text-[var(--ink-400)]">({purchaseDelta >= 0 ? '+' : ''}{pctPts(kw.ourPurchaseShare - pos.purchaseShare)})</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insight footer */}
      {positions.length > 0 && (() => {
        const leader = positions[0];
        const conversionRate = kw.ourClickShare > 0 ? kw.ourPurchaseShare / kw.ourClickShare : 0;
        const leaderConvRate = leader.clickShare > 0 ? leader.purchaseShare / leader.clickShare : 0;
        const weAreLeader = leader.isOurs || (kw.ourClickShare >= leader.clickShare);

        if (weAreLeader) {
          return (
            <div className="border-t border-[var(--line-soft)] bg-[#e7f4ee] px-4 py-3">
              <p className="text-[11px] text-[#2d8a56] font-semibold">
                <Crown size={12} className="inline mr-1" />
                You hold the top position on this keyword. Defend it by maintaining strong listing quality and competitive pricing.
              </p>
            </div>
          );
        }

        return (
          <div className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3">
            <p className="text-[11px] text-[var(--ink-700)]">
              {conversionRate > leaderConvRate
                ? <><span className="font-semibold text-[#16a34a]">Conversion advantage:</span> Your purchase/click ratio ({(conversionRate * 100).toFixed(0)}%) beats #1 ({(leaderConvRate * 100).toFixed(0)}%). More impressions & clicks could close this gap.</>
                : <><span className="font-semibold">Behind #1.</span> Focus on listing optimization, reviews, and advertising to increase your click share for this keyword.</>
              }
            </p>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Keyword Detail Panel ── */

function KeywordDetailPanel({ kw, onClose }: { kw: CompetitiveKeyword; onClose: () => void }) {
  const chartData = kw.weeklyHistory.map(w => ({
    week: w.weekEnding.replace(/^\d{4}-/, ''),
    ours: +(w.ourClickShare * 100).toFixed(2),
    competitors: +(w.competitorClickShare * 100).toFixed(2),
    purchaseShare: +(w.ourPurchaseShare * 100).toFixed(2),
  }));

  return (
    <div className="space-y-5">
      <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue-700)] hover:underline">
        <ChevronRight size={14} className="rotate-180" /> Back to all keywords
      </button>

      <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.96))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[var(--ink-950)]">&quot;{kw.keyword}&quot;</h3>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              {kw.searchVolume.toLocaleString()} searches/week · {kw.weeklyHistory.length} weeks of data
              {kw.isFocusKeyword && <span className="ml-2 text-[#1a5490] font-semibold">· Focus keyword</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TrendBadge trend={kw.trend} />
            <PressureBadge level={kw.pressureLevel} />
          </div>
        </div>
      </div>

      {/* Top Positions — WHO is in #1, #2, #3 */}
      <TopPositionsTable positions={kw.topPositions} keyword={kw.keyword} kw={kw} />

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Our click share</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(kw.ourClickShare)}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">{pctPts(kw.clickShareChange)} WoW</p>
        </div>
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Our purchase share</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(kw.ourPurchaseShare)}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">{pctPts(kw.purchaseShareChange)} WoW</p>
        </div>
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Competitor share</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(1 - kw.ourClickShare)}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">All other sellers combined</p>
        </div>
        <div className={`rounded-[16px] border p-4 shadow-sm ${kw.conversionEdge >= 1.2 ? 'border-[#bbf7d0]' : kw.conversionEdge >= 0.8 ? 'border-[var(--line-soft)]' : 'border-[#fed7aa]'} bg-white`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Conversion edge</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{kw.conversionEdge > 0 ? `${(kw.conversionEdge * 100).toFixed(0)}%` : '—'}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">
            {kw.conversionEdge >= 1.2 ? 'Converting better than field' : kw.conversionEdge >= 0.8 ? 'At parity' : 'Competitors converting better'}
          </p>
        </div>
      </div>

      {/* Market share chart */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Click share over time — you vs. competitors
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kwGradOurs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="kwGradComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} width={45} />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name === 'ours' ? 'Your click share' : name === 'competitors' ? 'Competitor share' : 'Your purchase share']}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Legend formatter={(v: string) => v === 'ours' ? 'Your click share' : v === 'competitors' ? 'Competitor share' : 'Your purchase share'} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="competitors" stroke="#f87171" fill="url(#kwGradComp)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="ours" stroke="#3b82f6" fill="url(#kwGradOurs)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="purchaseShare" stroke="#22c55e" fill="none" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Competitive read */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
        <p className="text-xs font-semibold text-[var(--ink-900)] mb-2">Competitive read</p>
        <p className="text-[12px] leading-6 text-[var(--ink-700)]">
          {kw.trend === 'gaining'
            ? `You are gaining share on "${kw.keyword}" — your click share (${pct(kw.ourClickShare)}) is trending up. `
            : kw.trend === 'losing'
              ? `You are losing ground on "${kw.keyword}" — competitors are capturing more clicks. Your share dropped ${pctPts(kw.clickShareChange)} this week. `
              : `Your position on "${kw.keyword}" is stable at ${pct(kw.ourClickShare)} click share. `
          }
          {kw.conversionEdge >= 1.2
            ? `Strong conversion advantage: shoppers who click your listing are ${((kw.conversionEdge - 1) * 100).toFixed(0)}% more likely to buy. Protect and scale this position.`
            : kw.conversionEdge >= 0.8
              ? `Conversion at parity. Focus on increasing click share through placement and creative.`
              : `Competitors convert better. Review listing quality, pricing, and reviews.`
          }
          {kw.topPositions.length > 0 && !kw.topPositions[0]?.isOurs
            ? ` The #1 position holder has ${pct(kw.topPositions[0].clickShare)} click share — ${pctPts(kw.topPositions[0].clickShare - kw.ourClickShare)} ahead of you.`
            : kw.topPositions.length > 0 && kw.topPositions[0]?.isOurs
              ? ' You hold the #1 click share position — maintain your advantage.'
              : ''
          }
        </p>
      </div>
    </div>
  );
}

/* ── Opportunity Chart ── */

function OpportunityChart({ keywords }: { keywords: CompetitiveKeyword[] }) {
  if (keywords.length === 0) return null;

  const top = keywords.slice(0, 10);
  const data = top.map(k => ({
    keyword: k.keyword.length > 25 ? k.keyword.slice(0, 25) + '...' : k.keyword,
    score: Math.round(k.opportunityScore),
    share: +(k.ourClickShare * 100).toFixed(1),
  }));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => v.toLocaleString()} />
            <YAxis type="category" dataKey="keyword" width={160} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), 'Opportunity score']}
              contentStyle={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.share < 5 ? '#3b82f6' : d.share < 15 ? '#60a5fa' : '#93c5fd'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Competitor ASIN Table ── */

function CompetitorAsinTable({ asins }: { asins: CompetitorAsin[] }) {
  if (asins.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--line-soft)] bg-white shadow-sm">
      <div className="bg-[var(--panel-muted)] px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Competitor ASINs on your keywords
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[var(--panel-muted)]">
            <tr>
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Product</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Overlap</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Click share</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Purch share</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {asins.map(a => (
              <tr key={a.asin} className="border-t border-[var(--line-soft)] hover:bg-[rgba(94,168,255,0.04)] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[var(--ink-900)] truncate max-w-[250px]">{a.productName}</p>
                  <a href={`https://www.amazon.com/dp/${a.asin}`} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-[var(--blue-700)] hover:underline inline-flex items-center gap-1">
                    {a.asin} <ExternalLink size={10} />
                  </a>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-[#e8f4ff] text-xs font-bold text-[#1a5490]">{a.keywordOverlap}</span>
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-[var(--ink-900)]">{pct(a.avgClickShare)}</td>
                <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-[var(--ink-900)]">{pct(a.avgPurchaseShare)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.topKeywords.slice(0, 3).map(k => (
                      <span key={k} className="rounded-full bg-[#eef2f6] px-2 py-0.5 text-[10px] text-[var(--ink-700)]">{k}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Focus Keyword Manager ── */

function FocusKeywordManager({ keywords, onChange }: { keywords: string[]; onChange: (kws: string[]) => void }) {
  const [newKw, setNewKw] = useState('');

  const addKeyword = () => {
    const kw = newKw.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      const updated = [...keywords, kw];
      onChange(updated);
      setNewKw('');
    }
  };

  const removeKeyword = (kw: string) => {
    onChange(keywords.filter(k => k !== kw));
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
        Focus keywords — these define what your products actually are
      </p>
      <div className="flex flex-wrap gap-2">
        {keywords.map(kw => (
          <span key={kw} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-white px-3 py-1.5 text-sm text-[var(--ink-800)] shadow-sm">
            {kw}
            <button onClick={() => removeKeyword(kw)} className="text-[var(--ink-400)] hover:text-[#c53030] transition-colors">
              <X size={13} />
            </button>
          </span>
        ))}
        <form
          onSubmit={e => { e.preventDefault(); addKeyword(); }}
          className="inline-flex items-center gap-1.5"
        >
          <input
            type="text"
            value={newKw}
            onChange={e => setNewKw(e.target.value)}
            placeholder="+ Add keyword"
            className="h-8 w-40 rounded-full border border-[var(--line-soft)] bg-white px-3 text-sm text-[var(--ink-900)] outline-none focus:border-[var(--blue-700)] placeholder:text-[var(--ink-400)]"
          />
          {newKw.trim() && (
            <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--navy-900)] text-white shadow-sm hover:bg-[#1a3a5c] transition-colors">
              <Plus size={14} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

/* ── Main Section ── */

export function CompetitorIntelligenceSection({ data: initialData }: { data: CompetitorIntelligence }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<'overview' | 'detail'>('overview');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'pressure' | 'opportunity' | 'share' | 'volume'>('relevance');
  const [focusKeywords, setFocusKeywords] = useState<string[]>(() => {
    const saved = loadFocusKeywords();
    return saved || initialData.keywords.filter(k => k.isFocusKeyword).map(k => k.keyword);
  });
  const [loading, setLoading] = useState(false);

  // Refetch data when focus keywords change
  const refetchData = useCallback(async (kws: string[]) => {
    if (kws.length === 0) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusKeywords: kws }),
      });
      if (resp.ok) {
        const newData = await resp.json();
        setData(newData);
      }
    } catch (err) {
      console.error('Failed to refetch competitor data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFocusChange = (kws: string[]) => {
    setFocusKeywords(kws);
    saveFocusKeywords(kws);
    refetchData(kws);
  };

  // Find selected keyword for detail view
  const activeKw = selectedKeyword ? data.keywords.find(k => k.keyword === selectedKeyword) : null;

  if (view === 'detail' && activeKw) {
    return <KeywordDetailPanel kw={activeKw} onClose={() => setView('overview')} />;
  }

  // Sort keywords
  const sortedKeywords = [...data.keywords].sort((a, b) => {
    switch (sortBy) {
      case 'relevance': {
        // Focus first, then by purchase share
        if (a.isFocusKeyword && !b.isFocusKeyword) return -1;
        if (!a.isFocusKeyword && b.isFocusKeyword) return 1;
        return b.ourPurchaseShare - a.ourPurchaseShare || b.searchVolume - a.searchVolume;
      }
      case 'pressure': {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.pressureLevel] - order[b.pressureLevel]) || b.searchVolume - a.searchVolume;
      }
      case 'opportunity': return b.opportunityScore - a.opportunityScore;
      case 'share': return b.ourClickShare - a.ourClickShare;
      case 'volume': return b.searchVolume - a.searchVolume;
      default: return 0;
    }
  });

  const displayKeywords = showAll ? sortedKeywords : sortedKeywords.slice(0, 20);
  const focusCount = data.keywords.filter(k => k.isFocusKeyword).length;

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.96))] p-5">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink-950)]">
          {loading ? 'Updating...' : data.headline}
        </h3>
        <p className="mt-2 text-sm text-[var(--ink-700)]">
          Latest data: week ending {data.weekLabel} · {focusCount} focus keywords · {data.totalTrackedKeywords} total tracked · {data.sovTrend.length} weeks of history
        </p>
      </div>

      {/* Focus Keyword Manager */}
      <FocusKeywordManager keywords={focusKeywords} onChange={handleFocusChange} />

      {/* SOV KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Avg impression SOV</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(data.currentSOV.impressionShare)}</p>
          <p className="mt-1 text-[11px] text-[var(--ink-600)]">Competitors: {pct(1 - data.currentSOV.impressionShare)}</p>
        </div>
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Avg click SOV</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(data.currentSOV.clickShare)}</p>
          <p className="mt-1 text-[11px] text-[var(--ink-600)]">Competitors: {pct(1 - data.currentSOV.clickShare)}</p>
        </div>
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Avg purchase SOV</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(data.currentSOV.purchaseShare)}</p>
          <p className="mt-1 text-[11px] text-[var(--ink-600)]">Competitors: {pct(1 - data.currentSOV.purchaseShare)}</p>
        </div>
        <div className={`rounded-[20px] border p-4 shadow-sm ${data.highPressureKeywords.length > 0 ? 'border-[#fed7aa] bg-white' : 'border-[#bbf7d0] bg-white'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Competitive pressure</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">
            {data.highPressureKeywords.length > 0 ? `${data.highPressureKeywords.length} alerts` : 'Low'}
          </p>
          <p className="mt-1 text-[11px] text-[var(--ink-600)]">
            {data.highPressureKeywords.length > 0
              ? `Losing share on: ${data.highPressureKeywords.slice(0, 2).join(', ')}`
              : 'No high-pressure keywords detected'
            }
          </p>
        </div>
      </div>

      {/* Momentum */}
      <div className="flex flex-wrap items-center gap-3">
        {data.gainingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#e7f4ee] px-3 py-1.5 text-[11px] font-semibold text-[#2d8a56]">
            <TrendingUp size={12} /> {data.gainingCount} gaining
          </div>
        )}
        {data.stableCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#eef2f6] px-3 py-1.5 text-[11px] font-semibold text-[#627587]">
            <Minus size={12} /> {data.stableCount} stable
          </div>
        )}
        {data.losingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#fff0e8] px-3 py-1.5 text-[11px] font-semibold text-[#b15d27]">
            <TrendingDown size={12} /> {data.losingCount} losing
          </div>
        )}
        <span className="text-[10px] text-[var(--ink-500)]">(focus keywords only)</span>
      </div>

      {/* SOV Trend */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Share of voice trend — focus keywords · last {data.sovTrend.length} weeks
        </p>
        <SOVTrendChart data={data} />
        <p className="mt-2 text-[11px] text-[var(--ink-600)]">
          Average share across your {focusCount} focus keywords only. Rising = gaining market share.
        </p>
      </div>

      {/* Opportunity Matrix — focus keywords only */}
      {data.topOpportunities.length > 0 && (
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-[#3b82f6]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
              Growth opportunities — focus keywords with room to grow
            </p>
          </div>
          <OpportunityChart keywords={data.topOpportunities} />
          <p className="mt-2 text-[11px] text-[var(--ink-600)]">
            Score = search volume × (1 − your click share). Only showing your focus keywords. Darker bars = lower current share.
          </p>
        </div>
      )}

      {/* Competitor ASINs */}
      {data.hasCompetitorAsinData && data.competitorAsins.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[#b15d27]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
              Competitor products on your keywords
            </p>
          </div>
          <CompetitorAsinTable asins={data.competitorAsins} />
        </div>
      )}

      {/* Per-keyword table */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
            Per-keyword competitive breakdown — click any row for detail
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--ink-500)]">Sort:</span>
            {(['relevance', 'pressure', 'opportunity', 'share', 'volume'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                  sortBy === s ? 'bg-[var(--navy-900)] text-white' : 'bg-[#eef2f6] text-[var(--ink-600)] hover:bg-[#dce4ed]'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-[var(--panel-muted)]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Keyword</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Volume</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Click share</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Purch share</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Trend</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Conv edge</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Pressure</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">12wk trend</th>
                </tr>
              </thead>
              <tbody>
                {displayKeywords.map(kw => (
                  <tr
                    key={kw.keyword}
                    className={`border-t border-[var(--line-soft)] cursor-pointer hover:bg-[rgba(94,168,255,0.04)] transition-colors ${kw.isFocusKeyword ? '' : 'opacity-60'}`}
                    onClick={() => { setSelectedKeyword(kw.keyword); setView('detail'); }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={12} className="text-[var(--ink-400)]" />
                        <span className="text-sm font-medium text-[var(--ink-900)]">{kw.keyword}</span>
                        {kw.isFocusKeyword && (
                          <span className="shrink-0 rounded-full bg-[#e8f4ff] px-1.5 py-0.5 text-[8px] font-bold text-[#1a5490] uppercase">Focus</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">{kw.searchVolume.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-semibold tabular-nums text-[var(--ink-900)]">{pct(kw.ourClickShare)}</span>
                      <p className="text-[10px] text-[var(--ink-600)]">{pctPts(kw.clickShareChange)}</p>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-semibold tabular-nums text-[var(--ink-900)]">{pct(kw.ourPurchaseShare)}</span>
                      <p className="text-[10px] text-[var(--ink-600)]">{pctPts(kw.purchaseShareChange)}</p>
                    </td>
                    <td className="px-3 py-3 text-center"><TrendBadge trend={kw.trend} /></td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-sm font-semibold tabular-nums ${kw.conversionEdge >= 1.2 ? 'text-[#2d8a56]' : kw.conversionEdge >= 0.8 ? 'text-[var(--ink-800)]' : 'text-[#b15d27]'}`}>
                        {kw.conversionEdge > 0 ? `${(kw.conversionEdge * 100).toFixed(0)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center"><PressureBadge level={kw.pressureLevel} /></td>
                    <td className="px-3 py-3 text-center"><ShareSparkline history={kw.weeklyHistory} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--blue-700)]">{data.sourceView}</p>
            {data.keywords.length > 20 && (
              <button onClick={() => setShowAll(!showAll)} className="text-xs font-semibold text-[var(--blue-700)] hover:underline">
                {showAll ? 'Show fewer' : `Show all ${data.keywords.length} keywords`}
              </button>
            )}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {displayKeywords.map(kw => (
            <div
              key={kw.keyword}
              className={`rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm cursor-pointer hover:bg-[rgba(94,168,255,0.04)] transition-colors ${kw.isFocusKeyword ? '' : 'opacity-60'}`}
              onClick={() => { setSelectedKeyword(kw.keyword); setView('detail'); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--ink-900)] truncate">{kw.keyword}</p>
                    {kw.isFocusKeyword && <span className="shrink-0 rounded-full bg-[#e8f4ff] px-1.5 py-0.5 text-[8px] font-bold text-[#1a5490] uppercase">Focus</span>}
                  </div>
                  <p className="text-[11px] text-[var(--ink-600)]">{kw.searchVolume.toLocaleString()} searches/wk</p>
                </div>
                <TrendBadge trend={kw.trend} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-[var(--ink-600)]">Click</span><p className="font-semibold">{pct(kw.ourClickShare)}</p></div>
                <div><span className="text-[var(--ink-600)]">Purchase</span><p className="font-semibold">{pct(kw.ourPurchaseShare)}</p></div>
                <div><span className="text-[var(--ink-600)]">Pressure</span><PressureBadge level={kw.pressureLevel} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)] mb-2">How to read this data</p>
        <div className="space-y-2 text-[11px] leading-5 text-[var(--ink-700)]">
          <p><span className="font-semibold">Focus keywords</span> are the search terms that define your products. SOV, momentum, and opportunities are calculated from these only. Non-focus keywords that meet minimum activity thresholds appear below (dimmed) for additional context.</p>
          <p><span className="font-semibold">Top positions</span> show the top ASINs by click share for each keyword. This tells you who specifically is winning that keyword and how far ahead they are.</p>
          <p><span className="font-semibold">Opportunity score</span> = search volume × (1 − your click share). Only calculated for focus keywords.</p>
          <p><span className="font-semibold">Conversion edge</span> &gt; 100% means you convert clicks to purchases better than the market average.</p>
        </div>
      </div>
    </div>
  );
}
