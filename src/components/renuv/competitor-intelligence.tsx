'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
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
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap,
} from 'lucide-react';
import type {
  CompetitorIntelligence,
  CompetitiveKeyword,
  CompetitorAsin,
} from '@/lib/renuv-competitors';

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
      {level === 'critical' && <AlertTriangle size={10} />}
      {level === 'high' && <AlertTriangle size={10} />}
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

/* ── SOV Trend Chart ── */

function SOVTrendChart({ data }: { data: CompetitorIntelligence }) {
  if (data.sovTrend.length < 2) return <p className="text-sm text-[var(--ink-600)]">Insufficient trend data.</p>;

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

/* ── Keyword Share Sparkline (mini trend for table rows) ── */

function ShareSparkline({ history }: { history: { ourClickShare: number }[] }) {
  if (history.length < 2) return null;
  const data = history.map((h, i) => ({ i, v: h.ourClickShare * 100 }));
  const max = Math.max(...data.map(d => d.v));
  const min = Math.min(...data.map(d => d.v));
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((d, idx) =>
    `${(idx / (data.length - 1)) * w},${h - ((d.v - min) / range) * h}`
  ).join(' ');
  const trending = data[data.length - 1].v >= data[0].v;

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={trending ? '#22c55e' : '#ef4444'}
        strokeWidth={1.5}
      />
    </svg>
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
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TrendBadge trend={kw.trend} />
            <PressureBadge level={kw.pressureLevel} />
          </div>
        </div>
      </div>

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
        <div className={`rounded-[16px] border p-4 shadow-sm ${kw.conversionEdge >= 1.2 ? 'border-[#bbf7d0] bg-white' : kw.conversionEdge >= 0.8 ? 'border-[var(--line-soft)] bg-white' : 'border-[#fed7aa] bg-white'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Conversion edge</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{kw.conversionEdge > 0 ? `${(kw.conversionEdge * 100).toFixed(0)}%` : '—'}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">
            {kw.conversionEdge >= 1.2 ? 'Converting better than field' : kw.conversionEdge >= 0.8 ? 'At parity' : 'Competitors converting better'}
          </p>
        </div>
      </div>

      {/* Market share chart: us vs. competitors */}
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
        <p className="mt-2 text-[11px] text-[var(--ink-600)]">
          Click share is the % of all clicks for this query that go to your products. If purchase share (dashed green) is above click share, you convert better than the market average.
        </p>
      </div>

      {/* Competitive read */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
        <p className="text-xs font-semibold text-[var(--ink-900)] mb-2">Competitive read</p>
        <p className="text-[12px] leading-6 text-[var(--ink-700)]">
          {kw.trend === 'gaining'
            ? `You are gaining share on "${kw.keyword}" — your click share (${pct(kw.ourClickShare)}) is trending up over recent weeks. `
            : kw.trend === 'losing'
              ? `You are losing ground on "${kw.keyword}" — competitors are capturing more clicks. Your share dropped ${pctPts(kw.clickShareChange)} this week. `
              : `Your position on "${kw.keyword}" is stable at ${pct(kw.ourClickShare)} click share. `
          }
          {kw.conversionEdge >= 1.2
            ? `Strong conversion advantage: shoppers who click your listing are ${((kw.conversionEdge - 1) * 100).toFixed(0)}% more likely to buy than the field average. This is a position to protect and scale.`
            : kw.conversionEdge >= 0.8
              ? `Conversion is at parity with the field. To grow, focus on increasing click share through better placement, creative, and bidding.`
              : `Competitors are converting clicks to purchases better than you on this term. Review your listing quality, pricing, images, and reviews to close the gap.`
          }
          {kw.searchVolume > 5000 && kw.ourClickShare < 0.1
            ? ` This is a high-volume keyword (${kw.searchVolume.toLocaleString()} searches/week) where you have low share — significant growth opportunity.`
            : ''
          }
        </p>
      </div>
    </div>
  );
}

/* ── Opportunity Matrix Chart ── */

function OpportunityChart({ keywords }: { keywords: CompetitiveKeyword[] }) {
  if (keywords.length === 0) return null;

  // Show top 10 opportunities as a horizontal bar chart
  const top = keywords.slice(0, 10);
  const data = top.map(k => ({
    keyword: k.keyword.length > 25 ? k.keyword.slice(0, 25) + '...' : k.keyword,
    fullKeyword: k.keyword,
    score: Math.round(k.opportunityScore),
    share: +(k.ourClickShare * 100).toFixed(1),
    volume: k.searchVolume,
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
              formatter={(value: number, name: string) => [name === 'score' ? value.toLocaleString() : `${value}%`, name === 'score' ? 'Opportunity score' : 'Your click share']}
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
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Keyword overlap</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Avg click share</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Avg purchase share</th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">Top keywords</th>
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
                    {a.topKeywords.length > 3 && (
                      <span className="text-[10px] text-[var(--ink-500)]">+{a.topKeywords.length - 3} more</span>
                    )}
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

/* ── Main Section ── */

export function CompetitorIntelligenceSection({ data }: { data: CompetitorIntelligence }) {
  const [view, setView] = useState<'overview' | 'detail'>('overview');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'pressure' | 'opportunity' | 'share' | 'volume'>('pressure');

  // Find selected keyword for detail view
  const activeKw = selectedKeyword ? data.keywords.find(k => k.keyword === selectedKeyword) : null;

  if (view === 'detail' && activeKw) {
    return <KeywordDetailPanel kw={activeKw} onClose={() => setView('overview')} />;
  }

  // Sort keywords
  const sortedKeywords = [...data.keywords].sort((a, b) => {
    switch (sortBy) {
      case 'pressure': {
        const pressureOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const diff = pressureOrder[a.pressureLevel] - pressureOrder[b.pressureLevel];
        return diff !== 0 ? diff : b.searchVolume - a.searchVolume;
      }
      case 'opportunity': return b.opportunityScore - a.opportunityScore;
      case 'share': return b.ourClickShare - a.ourClickShare;
      case 'volume': return b.searchVolume - a.searchVolume;
      default: return 0;
    }
  });

  const displayKeywords = showAll ? sortedKeywords : sortedKeywords.slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.96))] p-5">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink-950)]">{data.headline}</h3>
        <p className="mt-2 text-sm text-[var(--ink-700)]">
          Latest data: week ending {data.weekLabel} · {data.totalTrackedKeywords} keywords tracked · {data.sovTrend.length} weeks of history
        </p>
      </div>

      {/* Share of Voice KPI cards */}
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
              ? `Losing share on: ${data.highPressureKeywords.slice(0, 2).join(', ')}${data.highPressureKeywords.length > 2 ? '...' : ''}`
              : 'No high-pressure keywords detected'
            }
          </p>
        </div>
      </div>

      {/* Momentum bar */}
      <div className="flex flex-wrap items-center gap-3">
        {data.gainingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#e7f4ee] px-3 py-1.5 text-[11px] font-semibold text-[#2d8a56]">
            <TrendingUp size={12} /> {data.gainingCount} gaining share
          </div>
        )}
        {data.stableCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#eef2f6] px-3 py-1.5 text-[11px] font-semibold text-[#627587]">
            <Minus size={12} /> {data.stableCount} stable
          </div>
        )}
        {data.losingCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#fff0e8] px-3 py-1.5 text-[11px] font-semibold text-[#b15d27]">
            <TrendingDown size={12} /> {data.losingCount} losing share
          </div>
        )}
      </div>

      {/* SOV Trend Chart */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Share of voice trend — last {data.sovTrend.length} weeks
        </p>
        <SOVTrendChart data={data} />
        <p className="mt-2 text-[11px] text-[var(--ink-600)]">
          Average share across all {data.totalTrackedKeywords} tracked keywords. Rising lines = you&apos;re gaining market share. If purchase SOV exceeds click SOV, you convert better than the field.
        </p>
      </div>

      {/* Opportunity Matrix */}
      {data.topOpportunities.length > 0 && (
        <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-[#3b82f6]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
              Growth opportunities — high volume, low share
            </p>
          </div>
          <OpportunityChart keywords={data.topOpportunities} />
          <p className="mt-2 text-[11px] text-[var(--ink-600)]">
            Score = search volume × (1 − your click share). Higher score = more untapped traffic. Darker bars = lower current share (bigger upside).
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
          <p className="mt-2 text-[11px] text-[var(--ink-600)]">
            These competitor products appear in Brand Analytics on the same search queries where you have presence. Higher keyword overlap means they compete with you more directly.
          </p>
        </div>
      )}

      {/* Per-keyword competitive table */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
            Per-keyword competitive breakdown — click any row for detail
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--ink-500)]">Sort:</span>
            {(['pressure', 'opportunity', 'share', 'volume'] as const).map(s => (
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
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-right">Purchase share</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Trend</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Conv. edge</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Pressure</th>
                  <th className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)] text-center">Sparkline</th>
                </tr>
              </thead>
              <tbody>
                {displayKeywords.map(kw => (
                  <tr
                    key={kw.keyword}
                    className="border-t border-[var(--line-soft)] cursor-pointer hover:bg-[rgba(94,168,255,0.04)] transition-colors"
                    onClick={() => { setSelectedKeyword(kw.keyword); setView('detail'); }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={12} className="text-[var(--ink-400)]" />
                        <span className="text-sm font-medium text-[var(--ink-900)]">{kw.keyword}</span>
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
            {data.keywords.length > 15 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-[var(--blue-700)] hover:underline"
              >
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
              className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm cursor-pointer hover:bg-[rgba(94,168,255,0.04)] transition-colors"
              onClick={() => { setSelectedKeyword(kw.keyword); setView('detail'); }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink-900)] truncate">{kw.keyword}</p>
                  <p className="text-[11px] text-[var(--ink-600)]">{kw.searchVolume.toLocaleString()} searches/wk</p>
                </div>
                <TrendBadge trend={kw.trend} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[var(--ink-600)]">Click share</span>
                  <p className="font-semibold text-[var(--ink-900)]">{pct(kw.ourClickShare)}</p>
                </div>
                <div>
                  <span className="text-[var(--ink-600)]">Purch share</span>
                  <p className="font-semibold text-[var(--ink-900)]">{pct(kw.ourPurchaseShare)}</p>
                </div>
                <div>
                  <span className="text-[var(--ink-600)]">Pressure</span>
                  <PressureBadge level={kw.pressureLevel} />
                </div>
              </div>
            </div>
          ))}
          {data.keywords.length > 15 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-xs font-semibold text-[var(--blue-700)] hover:underline py-3"
            >
              {showAll ? 'Show fewer' : `Show all ${data.keywords.length} keywords`}
            </button>
          )}
        </div>
      </div>

      {/* Methodology */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)] mb-2">How to read this data</p>
        <div className="space-y-2 text-[11px] leading-5 text-[var(--ink-700)]">
          <p><span className="font-semibold">Share of Voice (SOV)</span> measures your brand&apos;s percentage of total market activity across all tracked search queries. Higher SOV generally correlates with higher market share.</p>
          <p><span className="font-semibold">Competitive pressure</span> flags keywords where you&apos;re actively losing share. &quot;Critical&quot; means you lost 3+ percentage points of click share this week on a high-volume keyword.</p>
          <p><span className="font-semibold">Opportunity score</span> = search volume × (1 − your click share). High scores indicate large keywords where you have room to grow. These are your best bets for increased investment.</p>
          <p><span className="font-semibold">Conversion edge</span> compares your purchase-to-click ratio vs. the market. Above 100% means shoppers who click your listing are more likely to buy than average. Below 100% signals listing or pricing issues.</p>
          {data.hasCompetitorAsinData && (
            <p><span className="font-semibold">Competitor ASINs</span> are products from other brands that appear in Brand Analytics on the same search queries as yours. Higher keyword overlap = more direct competitor.</p>
          )}
        </div>
      </div>
    </div>
  );
}
