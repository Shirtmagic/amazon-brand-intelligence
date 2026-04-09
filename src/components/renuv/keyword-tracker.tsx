'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { KeywordTrackerData, TrackedKeyword, KeywordWeekData } from '@/lib/renuv-keyword-tracker';

/* ─── Storage key for persisted keywords ─── */
const STORAGE_KEY = 'renuv_tracked_keywords';

function loadSavedKeywords(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveKeywords(kws: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kws));
}

/* ─── Formatters ─── */
function pct(v: number, decimals = 1) {
  return `${(v * 100).toFixed(decimals)}%`;
}
function pctPts(v: number) {
  const pts = v * 100;
  if (pts > 0.05) return `+${pts.toFixed(1)} pts`;
  if (pts < -0.05) return `${pts.toFixed(1)} pts`;
  return '—';
}
function num(v: number) {
  return v.toLocaleString();
}
function delta(v: number) {
  if (v > 0.005) return `+${(v * 100).toFixed(1)}%`;
  if (v < -0.005) return `${(v * 100).toFixed(1)}%`;
  return '—';
}

function TrendBadge({ trend }: { trend: 'gaining' | 'losing' | 'stable' }) {
  if (trend === 'gaining') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f4ee] px-2 py-0.5 text-[10px] font-semibold text-[#2d8a56]">
      <TrendingUp size={10} /> Gaining
    </span>
  );
  if (trend === 'losing') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e8] px-2 py-0.5 text-[10px] font-semibold text-[#b15d27]">
      <TrendingDown size={10} /> Losing
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f6] px-2 py-0.5 text-[10px] font-semibold text-[#627587]">
      <Minus size={10} /> Stable
    </span>
  );
}

function ChangeArrow({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value > 0.005) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#2d8a56]">
      <ArrowUpRight size={10} /> +{(value * 100).toFixed(1)}{suffix}
    </span>
  );
  if (value < -0.005) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#b15d27]">
      <ArrowDownRight size={10} /> {(value * 100).toFixed(1)}{suffix}
    </span>
  );
  return <span className="text-[10px] text-[var(--ink-500)]">—</span>;
}

/* ─── Sparkline ─── */
function Sparkline({ data, dataKey, color, height = 32 }: { data: any[]; dataKey: string; color: string; height?: number }) {
  if (data.length < 2) return <span className="text-[10px] text-[var(--ink-500)]">—</span>;
  return (
    <div style={{ width: 120, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${dataKey}-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`url(#spark-${dataKey}-${color.replace('#', '')})`}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Keyword detail charts ─── */
function KeywordShareChart({ weeks }: { weeks: KeywordWeekData[] }) {
  if (weeks.length < 2) return <p className="text-sm text-[var(--ink-600)]">Insufficient data for chart.</p>;

  const data = weeks.map(w => ({
    week: w.weekEnding.replace(/^\d{4}-/, ''),
    impression: +(w.impressionBrandShare * 100).toFixed(2),
    click: +(w.clickBrandShare * 100).toFixed(2),
    purchase: +(w.purchaseBrandShare * 100).toFixed(2),
    cartAdd: +(w.cartAddBrandShare * 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="kgImp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="kgClick" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="kgPurch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="kgCart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} width={45} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value.toFixed(2)}%`,
            name === 'impression' ? 'Impression share' : name === 'click' ? 'Click share' : name === 'purchase' ? 'Purchase share' : 'Cart add share',
          ]}
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
        />
        <Legend
          formatter={(v: string) => v === 'impression' ? 'Impression' : v === 'click' ? 'Click' : v === 'purchase' ? 'Purchase' : 'Cart add'}
          wrapperStyle={{ fontSize: 11 }}
        />
        <Area type="monotone" dataKey="impression" stroke="#94a3b8" fill="url(#kgImp)" strokeWidth={1.5} dot={{ r: 2.5 }} />
        <Area type="monotone" dataKey="click" stroke="#3b82f6" fill="url(#kgClick)" strokeWidth={2} dot={{ r: 2.5 }} />
        <Area type="monotone" dataKey="cartAdd" stroke="#f59e0b" fill="url(#kgCart)" strokeWidth={1.5} dot={{ r: 2.5 }} />
        <Area type="monotone" dataKey="purchase" stroke="#22c55e" fill="url(#kgPurch)" strokeWidth={2} dot={{ r: 2.5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KeywordVolumeChart({ weeks }: { weeks: KeywordWeekData[] }) {
  if (weeks.length < 2) return null;

  const data = weeks.map(w => ({
    week: w.weekEnding.replace(/^\d{4}-/, ''),
    volume: w.searchVolume,
    brandClicks: w.clickBrand,
    brandPurchases: w.purchaseBrand,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={45} />
        <Tooltip
          formatter={(value: number, name: string) => [
            value.toLocaleString(),
            name === 'volume' ? 'Search volume' : name === 'brandClicks' ? 'Your clicks' : 'Your purchases',
          ]}
          contentStyle={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => v === 'volume' ? 'Search volume' : v === 'brandClicks' ? 'Your clicks' : 'Your purchases'} />
        <Bar dataKey="volume" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
        <Bar dataKey="brandClicks" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="brandPurchases" fill="#22c55e" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Weekly data table for a keyword ─── */
function WeeklyTable({ weeks }: { weeks: KeywordWeekData[] }) {
  // Show most recent first
  const sorted = [...weeks].reverse();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead className="bg-[var(--panel-muted)]">
          <tr>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] sticky left-0 bg-[var(--panel-muted)]">Week</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Volume</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Imp. Total</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Imp. Brand</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Imp. Share</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Click Total</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Click Brand</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Click Share</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">CTR Brand</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Cart Total</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Cart Brand</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Cart Share</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Purch. Total</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Purch. Brand</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Purch. Share</th>
            <th className="px-3 py-2 font-semibold text-[var(--ink-600)] uppercase tracking-wider text-[10px] text-right">Conv. Brand</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((w, i) => {
            const prev = i < sorted.length - 1 ? sorted[i + 1] : null;
            return (
              <tr key={w.weekEnding} className="border-t border-[var(--line-soft)] hover:bg-[rgba(94,168,255,0.03)] transition-colors">
                <td className="px-3 py-2 font-medium text-[var(--ink-900)] whitespace-nowrap sticky left-0 bg-white">{w.weekEnding}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.searchVolume)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.impressionTotal)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.impressionBrand)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-[var(--ink-900)]">{pct(w.impressionBrandShare)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.clickTotal)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.clickBrand)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-[var(--ink-900)]">{pct(w.clickBrandShare)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{pct(w.ctrBrand)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.cartAddTotal)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.cartAddBrand)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-[var(--ink-900)]">{pct(w.cartAddBrandShare)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.purchaseTotal)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{num(w.purchaseBrand)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-[var(--ink-900)]">{pct(w.purchaseBrandShare)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[var(--ink-800)]">{pct(w.conversionBrand)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Summary card for a keyword ─── */
function KeywordSummaryCard({ kw, onClick, isActive }: { kw: TrackedKeyword; onClick: () => void; isActive: boolean }) {
  const lw = kw.latestWeek;
  if (!lw) {
    return (
      <div
        className={`rounded-[20px] border bg-white p-4 shadow-sm cursor-pointer transition-all ${
          isActive ? 'border-[var(--blue-700)] ring-2 ring-[rgba(59,130,246,0.15)]' : 'border-[var(--line-soft)] hover:border-[var(--blue-300)]'
        }`}
        onClick={onClick}
      >
        <p className="text-sm font-semibold text-[var(--ink-900)]">{kw.keyword}</p>
        <p className="mt-1 text-xs text-[var(--ink-500)]">No data available</p>
      </div>
    );
  }

  const sparkData = kw.weeks.map(w => ({
    share: +(w.clickBrandShare * 100).toFixed(2),
  }));

  return (
    <div
      className={`rounded-[20px] border bg-white p-4 shadow-sm cursor-pointer transition-all ${
        isActive ? 'border-[var(--blue-700)] ring-2 ring-[rgba(59,130,246,0.15)]' : 'border-[var(--line-soft)] hover:border-[var(--blue-300)]'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ink-900)] truncate">{kw.keyword}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">{num(lw.searchVolume)} searches/wk</p>
        </div>
        <TrendBadge trend={kw.trend} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[10px] text-[var(--ink-500)]">Click share</p>
          <div className="flex items-center gap-1.5">
            <p className="text-lg font-semibold tabular-nums text-[var(--ink-950)]">{pct(lw.clickBrandShare)}</p>
            <ChangeArrow value={kw.wow.clickShareChange} suffix=" pts" />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[var(--ink-500)]">Purchase share</p>
          <div className="flex items-center gap-1.5">
            <p className="text-lg font-semibold tabular-nums text-[var(--ink-950)]">{pct(lw.purchaseBrandShare)}</p>
            <ChangeArrow value={kw.wow.purchaseShareChange} suffix=" pts" />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[var(--ink-500)]">Brand clicks</p>
          <p className="text-sm font-semibold tabular-nums text-[var(--ink-800)]">{num(lw.clickBrand)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--ink-500)]">Brand purchases</p>
          <p className="text-sm font-semibold tabular-nums text-[var(--ink-800)]">{num(lw.purchaseBrand)}</p>
        </div>
      </div>

      <div className="mt-3">
        <Sparkline data={sparkData} dataKey="share" color="#3b82f6" />
      </div>
    </div>
  );
}

/* ─── Keyword detail panel ─── */
function KeywordDetailPanel({ kw, onBack }: { kw: TrackedKeyword; onBack: () => void }) {
  const [showTable, setShowTable] = useState(false);
  const lw = kw.latestWeek;

  if (!lw) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue-700)] hover:underline">
          <ChevronRight size={14} className="rotate-180" /> Back to all keywords
        </button>
        <div className="rounded-[24px] border border-[var(--line-soft)] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--ink-950)]">&quot;{kw.keyword}&quot;</h3>
          <p className="mt-2 text-sm text-[var(--ink-600)]">No Brand Analytics data found for this keyword. It may not have enough search volume to appear in BA, or you may not have any ranked ASINs for this term.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue-700)] hover:underline">
        <ChevronRight size={14} className="rotate-180" /> Back to all keywords
      </button>

      {/* Header */}
      <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.96))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[var(--ink-950)]">&quot;{kw.keyword}&quot;</h3>
            <p className="mt-1 text-sm text-[var(--ink-700)]">
              {num(lw.searchVolume)} weekly searches · {kw.weeks.length} weeks of data
              {kw.weeks.length > 0 && (
                <span> · {kw.weeks[0].weekEnding} — {kw.weeks[kw.weeks.length - 1].weekEnding}</span>
              )}
            </p>
            <p className="mt-1 text-[11px] text-[var(--ink-500)]">
              Source: Brand Analytics — Search Query Performance (weekly)
            </p>
          </div>
          <TrendBadge trend={kw.trend} />
        </div>
      </div>

      {/* Funnel KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FunnelCard
          icon={<Eye size={16} />}
          label="Impression share"
          value={pct(lw.impressionBrandShare)}
          brandCount={num(lw.impressionBrand)}
          totalCount={num(lw.impressionTotal)}
          change={kw.wow.impressionShareChange}
        />
        <FunnelCard
          icon={<MousePointerClick size={16} />}
          label="Click share"
          value={pct(lw.clickBrandShare)}
          brandCount={num(lw.clickBrand)}
          totalCount={num(lw.clickTotal)}
          change={kw.wow.clickShareChange}
        />
        <FunnelCard
          icon={<ShoppingCart size={16} />}
          label="Cart add share"
          value={pct(lw.cartAddBrandShare)}
          brandCount={num(lw.cartAddBrand)}
          totalCount={num(lw.cartAddTotal)}
          change={0}
        />
        <FunnelCard
          icon={<Package size={16} />}
          label="Purchase share"
          value={pct(lw.purchaseBrandShare)}
          brandCount={num(lw.purchaseBrand)}
          totalCount={num(lw.purchaseTotal)}
          change={kw.wow.purchaseShareChange}
        />
      </div>

      {/* Additional metrics row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Brand CTR</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(lw.ctrBrand)}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">Market CTR: {pct(lw.ctrTotal)}</p>
        </div>
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Brand conversion</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--ink-950)]">{pct(lw.conversionBrand)}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">Market conv: {pct(lw.conversionTotal)}</p>
        </div>
        <div className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">Conversion edge</p>
          {(() => {
            const edge = lw.conversionTotal > 0 ? lw.conversionBrand / lw.conversionTotal : 0;
            return (
              <>
                <p className={`mt-1 text-xl font-semibold tabular-nums ${edge >= 1.2 ? 'text-[#2d8a56]' : edge >= 0.8 ? 'text-[var(--ink-950)]' : 'text-[#b15d27]'}`}>
                  {edge > 0 ? `${(edge * 100).toFixed(0)}%` : '—'}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--ink-600)]">
                  {edge >= 1.2 ? 'Converting better than field' : edge >= 0.8 ? 'At parity with field' : 'Competitors converting better'}
                </p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Share trend chart */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Brand share trend — last {kw.weeks.length} weeks
        </p>
        <KeywordShareChart weeks={kw.weeks} />
      </div>

      {/* Volume + activity chart */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Search volume & brand activity
        </p>
        <KeywordVolumeChart weeks={kw.weeks} />
      </div>

      {/* Weekly data table — expandable */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTable(!showTable)}
          className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-[rgba(94,168,255,0.03)] transition-colors"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
            Weekly data table — {kw.weeks.length} weeks
          </p>
          <span className="text-[var(--ink-500)]">
            {showTable ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {showTable && <WeeklyTable weeks={kw.weeks} />}
      </div>
    </div>
  );
}

function FunnelCard({ icon, label, value, brandCount, totalCount, change }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  brandCount: string;
  totalCount: string;
  change: number;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--line-soft)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-[var(--ink-500)]">{icon}</span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">{label}</p>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-2xl font-semibold tabular-nums text-[var(--ink-950)]">{value}</p>
        <ChangeArrow value={change} suffix=" pts" />
      </div>
      <p className="mt-1 text-[11px] text-[var(--ink-600)]">
        Brand: {brandCount} · Total: {totalCount}
      </p>
    </div>
  );
}

/* ─── Keyword management bar ─── */
function KeywordManager({ keywords, onAdd, onRemove }: {
  keywords: string[];
  onAdd: (kw: string) => void;
  onRemove: (kw: string) => void;
}) {
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd() {
    const kw = input.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      onAdd(kw);
      setInput('');
      setIsAdding(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {keywords.map(kw => (
          <span key={kw} className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2f6] px-3 py-1.5 text-xs font-medium text-[var(--ink-800)]">
            {kw}
            <button
              onClick={() => onRemove(kw)}
              className="rounded-full p-0.5 text-[var(--ink-400)] hover:bg-[var(--ink-200)] hover:text-[var(--ink-700)] transition-colors"
              title="Remove keyword"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--line-soft)] px-3 py-1.5 text-xs font-medium text-[var(--ink-600)] hover:border-[var(--blue-700)] hover:text-[var(--blue-700)] transition-colors"
          >
            <Plus size={12} /> Add keyword
          </button>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
            className="inline-flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter keyword..."
              className="h-8 w-48 rounded-lg border border-[var(--line-soft)] bg-white px-3 text-xs text-[var(--ink-900)] outline-none focus:border-[var(--blue-700)]"
              autoFocus
            />
            <button
              type="submit"
              className="h-8 rounded-lg bg-[var(--blue-700)] px-3 text-xs font-semibold text-white hover:bg-[var(--blue-800)] transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setInput(''); }}
              className="h-8 rounded-lg border border-[var(--line-soft)] px-2 text-xs text-[var(--ink-600)] hover:bg-[var(--ink-100)]"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Cross-keyword comparison view ─── */
function ComparisonView({ keywords }: { keywords: TrackedKeyword[] }) {
  // Show all keywords with data on a single chart comparing click share over time
  const kwsWithData = keywords.filter(k => k.weeks.length >= 2);
  if (kwsWithData.length === 0) return null;

  // Build unified dataset: each week has a value per keyword
  const allWeeks = new Set<string>();
  for (const kw of kwsWithData) {
    for (const w of kw.weeks) allWeeks.add(w.weekEnding);
  }
  const sortedWeeks = Array.from(allWeeks).sort();

  const data = sortedWeeks.map(week => {
    const point: any = { week: week.replace(/^\d{4}-/, '') };
    for (const kw of kwsWithData) {
      const w = kw.weeks.find(x => x.weekEnding === week);
      point[kw.keyword] = w ? +(w.clickBrandShare * 100).toFixed(2) : null;
    }
    return point;
  });

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

  return (
    <div className="rounded-[20px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
        Click share comparison — all tracked keywords
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} width={45} />
              <Tooltip
                formatter={(value: number, name: string) => [`${value?.toFixed(2)}%`, name]}
                contentStyle={{ borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {kwsWithData.map((kw, i) => (
                <Line
                  key={kw.keyword}
                  type="monotone"
                  dataKey={kw.keyword}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export function KeywordTrackerSection({ data, onKeywordsChange }: {
  data: KeywordTrackerData;
  onKeywordsChange: (keywords: string[]) => void;
}) {
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'detail'>('overview');

  const activeKw = data.keywords.find(k => k.keyword === selectedKeyword);

  // Counts
  const gainingCount = data.keywords.filter(k => k.trend === 'gaining').length;
  const losingCount = data.keywords.filter(k => k.trend === 'losing').length;
  const stableCount = data.keywords.filter(k => k.trend === 'stable').length;
  const withDataCount = data.keywords.filter(k => k.latestWeek).length;

  function handleSelectKeyword(kw: string) {
    setSelectedKeyword(kw);
    setView('detail');
  }

  function handleAdd(kw: string) {
    const updated = [...data.trackedKeywordList, kw];
    saveKeywords(updated);
    onKeywordsChange(updated);
  }

  function handleRemove(kw: string) {
    const updated = data.trackedKeywordList.filter(k => k !== kw);
    saveKeywords(updated);
    onKeywordsChange(updated);
    if (selectedKeyword === kw) {
      setSelectedKeyword(null);
      setView('overview');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[24px] border border-[rgba(94,168,255,0.14)] bg-[linear-gradient(135deg,rgba(94,168,255,0.08),rgba(255,255,255,0.96))] p-5">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink-950)]">
          Keyword Tracker — {data.trackedKeywordList.length} keywords tracked
        </h3>
        <p className="mt-1 text-sm text-[var(--ink-700)]">
          {data.latestWeekEnding ? `Latest data: week ending ${data.latestWeekEnding}` : 'Loading...'} · {withDataCount} keywords with data · {data.weekCount} weeks of history
        </p>
        <p className="mt-1 text-[11px] text-[var(--ink-500)]">
          Data source: Amazon Brand Analytics — Search Query Performance (weekly) · Per-ASIN impression, click, purchase &amp; cart-add share for your brand
        </p>
      </div>

      {/* Keyword management */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-600)]">
          Tracked keywords — click to add or remove
        </p>
        <KeywordManager
          keywords={data.trackedKeywordList}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>

      {/* Momentum summary */}
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

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('overview')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            view === 'overview' ? 'bg-[var(--navy-900)] text-white' : 'bg-[#eef2f6] text-[var(--ink-700)] hover:bg-[var(--ink-200)]'
          }`}
        >
          Overview
        </button>
        {selectedKeyword && (
          <button
            onClick={() => setView('detail')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              view === 'detail' ? 'bg-[var(--navy-900)] text-white' : 'bg-[#eef2f6] text-[var(--ink-700)] hover:bg-[var(--ink-200)]'
            }`}
          >
            Detail: &quot;{selectedKeyword}&quot;
          </button>
        )}
      </div>

      {view === 'overview' ? (
        <>
          {/* Keyword summary cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.keywords.map(kw => (
              <KeywordSummaryCard
                key={kw.keyword}
                kw={kw}
                onClick={() => handleSelectKeyword(kw.keyword)}
                isActive={selectedKeyword === kw.keyword}
              />
            ))}
          </div>

          {/* Cross-keyword comparison chart */}
          <ComparisonView keywords={data.keywords} />
        </>
      ) : activeKw ? (
        <KeywordDetailPanel kw={activeKw} onBack={() => { setView('overview'); }} />
      ) : (
        <p className="text-sm text-[var(--ink-600)]">Select a keyword to view details.</p>
      )}

      {/* Methodology */}
      <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--panel-muted)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)] mb-2">How to read this data</p>
        <div className="space-y-2 text-[11px] leading-5 text-[var(--ink-700)]">
          <p><span className="font-semibold">Brand share</span> represents your brand&apos;s percentage of the total market activity for each search query — e.g., if you have 5% click share, all other sellers collectively have 95%.</p>
          <p><span className="font-semibold">Total counts</span> (impressions, clicks, etc.) are estimated from your brand counts divided by your share. These approximate the total market size for that keyword.</p>
          <p><span className="font-semibold">Trend direction</span> compares your average brand click share over the last 3 weeks against the prior 3 weeks. &quot;Gaining&quot; means your share is growing; &quot;Losing&quot; means competitors are taking ground.</p>
          <p><span className="font-semibold">Conversion edge</span> compares your brand&apos;s conversion rate (purchases/clicks) against the total market conversion rate. Above 100% means you convert better than the average seller.</p>
        </div>
      </div>
    </div>
  );
}
