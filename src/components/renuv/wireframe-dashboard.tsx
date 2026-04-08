'use client';

import { useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie,
  Cell, RadialBarChart, RadialBar,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Demo data generators ───────────────────────────────────────────────────

function generateDailyData(days: number) {
  const data = [];
  const baseDate = new Date('2026-03-08');
  let revenue = 14200;
  let adSpend = 2800;
  let sessions = 1650;
  let orders = 92;

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.78 : 1;
    const trend = 1 + (i / days) * 0.18;

    revenue = Math.round(revenue * (0.94 + Math.random() * 0.12) * weekendFactor * trend);
    adSpend = Math.round(adSpend * (0.95 + Math.random() * 0.10) * weekendFactor);
    sessions = Math.round(sessions * (0.92 + Math.random() * 0.16) * weekendFactor * trend);
    orders = Math.round(orders * (0.93 + Math.random() * 0.14) * weekendFactor * trend);

    const conversionRate = sessions > 0 ? (orders / sessions) * 100 : 0;
    const roas = adSpend > 0 ? revenue / adSpend : 0;
    const acos = revenue > 0 ? (adSpend / revenue) * 100 : 0;
    const netProfit = revenue * 0.28 - adSpend;

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString().split('T')[0],
      revenue,
      adSpend,
      sessions,
      orders,
      units: Math.round(orders * 1.26),
      conversionRate: +conversionRate.toFixed(1),
      roas: +roas.toFixed(2),
      acos: +acos.toFixed(1),
      netProfit: Math.round(netProfit),
      organicRevenue: Math.round(revenue * 0.62),
      ppcRevenue: Math.round(revenue * 0.38),
    });
  }
  return data;
}

const dailyData = generateDailyData(30);

const campaignData = [
  { campaign: 'SP — Scar Gel Exact', channel: 'SP', spend: 4820, sales: 28400, roas: 5.89, acos: 17.0, status: 'positive' },
  { campaign: 'SP — Post Surgery Broad', channel: 'SP', spend: 3210, sales: 14600, roas: 4.55, acos: 22.0, status: 'positive' },
  { campaign: 'SP — Category Defense', channel: 'SP', spend: 2890, sales: 9800, roas: 3.39, acos: 29.5, status: 'neutral' },
  { campaign: 'SB — Brand Video', channel: 'SB', spend: 1840, sales: 11200, roas: 6.09, acos: 16.4, status: 'positive' },
  { campaign: 'SB — Store Spotlight', channel: 'SB', spend: 1220, sales: 5400, roas: 4.43, acos: 22.6, status: 'neutral' },
  { campaign: 'SD — Retargeting', channel: 'SD', spend: 980, sales: 3200, roas: 3.27, acos: 30.6, status: 'warning' },
  { campaign: 'SP — Competitor Conquest', channel: 'SP', spend: 1640, sales: 4100, roas: 2.50, acos: 40.0, status: 'warning' },
];

const spendMixData = [
  { name: 'Sponsored Products', value: 62, color: '#2563eb' },
  { name: 'Sponsored Brands', value: 24, color: '#8b5cf6' },
  { name: 'Sponsored Display', value: 14, color: '#06b6d4' },
];

const organicPpcSplit = [
  { name: 'Organic', value: 62, color: '#10b981' },
  { name: 'PPC', value: 38, color: '#2563eb' },
];

const topAsins = [
  { asin: 'B0F4NZ679Q', title: 'Renuv Advanced Scar Gel 30ml', revenue: 128400, units: 764, sessions: 8420, cvr: 9.1, adShare: 34, organicRank: 3, trend: 'up' },
  { asin: 'B08BMJN33K', title: 'Renuv Silicone Scar Sheets (4pk)', revenue: 86200, units: 512, sessions: 5680, cvr: 9.0, adShare: 28, organicRank: 5, trend: 'up' },
  { asin: 'B0BZSZ4CB1', title: 'Renuv Recovery Kit', revenue: 64800, units: 324, sessions: 4120, cvr: 7.9, adShare: 42, organicRank: 8, trend: 'flat' },
  { asin: 'B0DZT3RLM9', title: 'Renuv C-Section Scar Treatment', revenue: 52100, units: 298, sessions: 3840, cvr: 7.8, adShare: 38, organicRank: 12, trend: 'down' },
  { asin: 'B0EXAMPLE5', title: 'Renuv Scar Gel Travel Size', revenue: 31600, units: 248, sessions: 2180, cvr: 11.4, adShare: 22, organicRank: 6, trend: 'up' },
];

const keywordRankData = [
  { keyword: 'scar gel for surgery', ranks: [8, 7, 6, 5, 4, 3, 3] },
  { keyword: 'silicone scar treatment', ranks: [12, 11, 10, 9, 8, 7, 5] },
  { keyword: 'post surgery scar cream', ranks: [15, 14, 12, 10, 9, 8, 7] },
  { keyword: 'c section scar treatment', ranks: [18, 16, 14, 12, 11, 10, 8] },
  { keyword: 'renuv scar gel', ranks: [2, 2, 1, 1, 1, 1, 1] },
];

const keywordChartData = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'].map((week, i) => {
  const point: Record<string, string | number> = { week };
  keywordRankData.forEach(kw => { point[kw.keyword] = kw.ranks[i]; });
  return point;
});

const daypartData: { hour: number; day: string; roas: number }[] = [];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
for (const day of days) {
  for (let h = 6; h <= 23; h++) {
    const base = day === 'Sat' || day === 'Sun' ? 2.8 : 4.2;
    const peak = h >= 9 && h <= 14 ? 1.4 : h >= 19 && h <= 22 ? 1.2 : 0.8;
    daypartData.push({ hour: h, day, roas: +(base * peak * (0.85 + Math.random() * 0.3)).toFixed(1) });
  }
}

const inventoryData = [
  { sku: 'RNV-GEL-30', title: 'Advanced Scar Gel 30ml', stock: 842, dos: 34, status: 'healthy', reorderDate: 'Apr 22', inbound: 500 },
  { sku: 'RNV-SHEET-4', title: 'Silicone Sheets 4pk', stock: 324, dos: 18, status: 'watch', reorderDate: 'Apr 12', inbound: 0 },
  { sku: 'RNV-KIT-1', title: 'Recovery Kit', stock: 156, dos: 12, status: 'warning', reorderDate: 'ASAP', inbound: 200 },
  { sku: 'RNV-CS-1', title: 'C-Section Treatment', stock: 98, dos: 8, status: 'critical', reorderDate: 'ASAP', inbound: 0 },
  { sku: 'RNV-TRAVEL', title: 'Travel Size Gel', stock: 520, dos: 42, status: 'healthy', reorderDate: 'May 8', inbound: 0 },
];

const healthScores = [
  { name: 'ODR', value: 0.12, target: 1.0, fill: '#10b981' },
  { name: 'Late Ship', value: 0.8, target: 4.0, fill: '#10b981' },
  { name: 'Cancel Rate', value: 1.2, target: 2.5, fill: '#10b981' },
  { name: 'Buy Box %', value: 97.4, target: 95, fill: '#2563eb' },
];

const waterfallSteps = [
  { name: 'Revenue', value: 542800, total: 542800, fill: '#2563eb' },
  { name: 'FBA Fees', value: -89200, total: 453600, fill: '#ef4444' },
  { name: 'Referral', value: -81400, total: 372200, fill: '#ef4444' },
  { name: 'COGS', value: -108600, total: 263600, fill: '#ef4444' },
  { name: 'Ad Spend', value: -89100, total: 174500, fill: '#f59e0b' },
  { name: 'Net Profit', value: 174500, total: 174500, fill: '#10b981' },
];

// ─── Gap Analysis Data ──────────────────────────────────────────────────────

type GapItem = { feature: string; status: 'built' | 'placeholder' | 'missing'; priority: 'high' | 'medium' | 'low'; notes: string };

const gapAnalysis: { section: string; items: GapItem[] }[] = [
  {
    section: 'Charts & Visualizations',
    items: [
      { feature: 'Revenue & Spend Trend Line (multi-line, dual Y-axis)', status: 'built', priority: 'high', notes: 'OverviewChart on internal overview — works with live data' },
      { feature: 'Advertising trend chart (spend, sales, ROAS)', status: 'placeholder', priority: 'high', notes: 'advertising-detail.tsx has placeholder text, no recharts implementation' },
      { feature: 'Performance trend chart (revenue, orders, CVR)', status: 'placeholder', priority: 'high', notes: 'performance-detail.tsx has placeholder text, no recharts implementation' },
      { feature: 'Client portal trend chart', status: 'placeholder', priority: 'high', notes: 'client-portal-page.tsx shows "Performance trends shown in detailed reports"' },
      { feature: 'Organic vs PPC revenue donut chart', status: 'missing', priority: 'high', notes: 'Not built anywhere — critical for client understanding of attribution' },
      { feature: 'Profit waterfall chart', status: 'missing', priority: 'high', notes: 'Revenue → Fees → COGS → Ad Spend → Net Profit — not built' },
      { feature: 'ROAS by campaign (horizontal bar)', status: 'missing', priority: 'high', notes: 'Campaign data exists in tables but no visual bar chart' },
      { feature: 'Ad type spend mix (donut/stacked bar)', status: 'missing', priority: 'medium', notes: 'SP/SB/SD breakdown is in data but not visualized' },
      { feature: 'Keyword rank tracker (inverted line)', status: 'missing', priority: 'medium', notes: 'Keyword data exists but no rank history chart' },
      { feature: 'Dayparting heatmap', status: 'missing', priority: 'medium', notes: 'No hourly bid data visualization' },
      { feature: 'Inventory forecast / days of supply chart', status: 'missing', priority: 'medium', notes: 'Inventory data exists but no projected stockout visualization' },
      { feature: 'Account health gauges', status: 'missing', priority: 'low', notes: 'No radial/gauge charts for ODR, late ship, etc.' },
    ],
  },
  {
    section: 'Internal Agency Pages',
    items: [
      { feature: 'Portfolio Overview Dashboard', status: 'built', priority: 'high', notes: 'Internal overview page is comprehensive' },
      { feature: 'PPC Campaign Manager', status: 'built', priority: 'high', notes: 'Internal advertising page with campaign tables' },
      { feature: 'Keyword & Organic Rankings', status: 'built', priority: 'high', notes: 'Internal search page with position tracking' },
      { feature: 'Inventory Management', status: 'built', priority: 'high', notes: 'Internal retail health page with SKU grid' },
      { feature: 'Account Health Monitor', status: 'missing', priority: 'high', notes: 'No dedicated page for ODR, late ship, cancellation, Buy Box %' },
      { feature: 'Profit & Loss Analytics', status: 'missing', priority: 'high', notes: 'No P&L page — fee summary exists on overview but no COGS/margin/waterfall' },
      { feature: 'Competitor & Market Intelligence', status: 'missing', priority: 'medium', notes: 'No competitor ASIN monitoring, pricing history, or category share tracking' },
      { feature: 'Task & SOP Manager', status: 'missing', priority: 'medium', notes: 'Notes page exists but no task boards, SOP checklists, or audit workflows' },
      { feature: 'Client CRM', status: 'missing', priority: 'low', notes: 'No client roster, billing, or service tier management' },
    ],
  },
  {
    section: 'Client Portal Pages',
    items: [
      { feature: 'Executive Summary', status: 'built', priority: 'high', notes: 'Client portal page is well-built' },
      { feature: 'Sales Performance detail', status: 'built', priority: 'high', notes: 'Performance detail page exists — chart is placeholder' },
      { feature: 'Advertising Performance detail', status: 'built', priority: 'high', notes: 'Advertising detail page exists — chart is placeholder' },
      { feature: 'Search / Keyword Rankings', status: 'built', priority: 'high', notes: 'Search detail page with top terms' },
      { feature: 'Inventory Status (client-facing)', status: 'built', priority: 'medium', notes: 'Retail health detail page exists' },
      { feature: 'Recommendations', status: 'built', priority: 'medium', notes: 'Recommendations page with priority sections' },
      { feature: 'Profitability Report (client-facing)', status: 'missing', priority: 'high', notes: 'No waterfall chart or margin-per-ASIN view for clients' },
      { feature: 'Goals & Progress tracking', status: 'missing', priority: 'medium', notes: 'No target vs actual bars, milestone tracking, or goal configuration' },
      { feature: 'Account Health (client-facing)', status: 'missing', priority: 'medium', notes: 'No client-facing health scorecard' },
    ],
  },
  {
    section: 'Key Differentiators',
    items: [
      { feature: 'AI-generated monthly narrative summary', status: 'built', priority: 'high', notes: 'Commentary + implications on every page — strong' },
      { feature: 'TACOS as primary metric', status: 'built', priority: 'high', notes: 'TACOS shown on overview and advertising pages' },
      { feature: 'Proactive alert system', status: 'built', priority: 'high', notes: 'Alerts page with critical/warning/info tiers from live BigQuery' },
      { feature: 'Source data transparency', status: 'built', priority: 'high', notes: 'Every section shows sourceView tag — unique differentiator' },
      { feature: 'Competitor price tracker', status: 'missing', priority: 'medium', notes: 'No competitor pricing data ingestion or alerts' },
      { feature: 'Reimbursement tracker', status: 'missing', priority: 'medium', notes: 'Mentioned in fee summary but no dedicated tracking page' },
      { feature: 'Client-facing task feed', status: 'missing', priority: 'medium', notes: 'No "what we\'re working on" visibility for clients' },
    ],
  },
];

// ─── Helper components ──────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('mb-8 rounded-[28px] border border-[var(--line-soft)] bg-white/90 p-6 shadow-[0_18px_40px_rgba(19,44,74,0.06)]', className)}>
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--blue-700)]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-950)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ChartCard({ title, subtitle, children, height = 320 }: { title: string; subtitle?: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="rounded-[22px] border border-[var(--line-soft)] bg-gradient-to-br from-[rgba(94,168,255,0.03)] to-white p-5">
      <p className="text-sm font-semibold text-[var(--ink-900)]">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-[var(--ink-600)]">{subtitle}</p>}
      <div className="mt-4" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-emerald-500', positive: 'bg-emerald-500',
    watch: 'bg-amber-500', warning: 'bg-amber-500', neutral: 'bg-sky-500',
    critical: 'bg-rose-500', negative: 'bg-rose-500',
    up: 'bg-emerald-500', down: 'bg-rose-500', flat: 'bg-sky-500',
  };
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', colors[status] || 'bg-slate-400')} />;
}

const COLORS = ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const KW_COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

// ─── Main component ─────────────────────────────────────────────────────────

export function WireframeDashboard() {
  const [activeTab, setActiveTab] = useState<'report' | 'wireframe'>('report');

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">

        {/* Header */}
        <section className="mb-8 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">Platform upgrade plan</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-5xl">
            Gap Analysis & Wireframe Preview
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
            Comparison of your research brief against the current codebase, with working chart wireframes for every missing visualization.
          </p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className={cn('rounded-full px-5 py-2.5 text-sm font-semibold transition',
                activeTab === 'report' ? 'bg-[var(--blue-700)] text-white' : 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:bg-[var(--ink-50)]'
              )}
            >
              Gap Analysis Report
            </button>
            <button
              onClick={() => setActiveTab('wireframe')}
              className={cn('rounded-full px-5 py-2.5 text-sm font-semibold transition',
                activeTab === 'wireframe' ? 'bg-[var(--blue-700)] text-white' : 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)] hover:bg-[var(--ink-50)]'
              )}
            >
              Chart Wireframes
            </button>
          </div>
        </section>

        {/* ─── TAB: Gap Analysis Report ─────────────────────────────────────── */}
        {activeTab === 'report' && (
          <>
            {/* Scorecard */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Built & Working', count: gapAnalysis.flatMap(s => s.items).filter(i => i.status === 'built').length, total: gapAnalysis.flatMap(s => s.items).length, color: 'bg-emerald-500' },
                { label: 'Placeholder (needs chart)', count: gapAnalysis.flatMap(s => s.items).filter(i => i.status === 'placeholder').length, total: gapAnalysis.flatMap(s => s.items).length, color: 'bg-amber-500' },
                { label: 'Missing (not built)', count: gapAnalysis.flatMap(s => s.items).filter(i => i.status === 'missing').length, total: gapAnalysis.flatMap(s => s.items).length, color: 'bg-rose-500' },
                { label: 'High priority gaps', count: gapAnalysis.flatMap(s => s.items).filter(i => i.status !== 'built' && i.priority === 'high').length, total: gapAnalysis.flatMap(s => s.items).filter(i => i.status !== 'built').length, color: 'bg-[var(--blue-700)]' },
              ].map(card => (
                <div key={card.label} className="rounded-[24px] border border-[var(--line-soft)] bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">{card.label}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-3xl font-semibold text-[var(--ink-950)]">{card.count}</p>
                    <p className="text-sm text-[var(--ink-600)]">/ {card.total}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ink-100)]">
                    <div className={cn('h-full rounded-full', card.color)} style={{ width: `${(card.count / card.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Gap tables by section */}
            {gapAnalysis.map(section => (
              <Section key={section.section} eyebrow="Gap analysis" title={section.section}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--line-soft)]">
                        <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Feature</th>
                        <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Status</th>
                        <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Priority</th>
                        <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map(item => (
                        <tr key={item.feature} className="border-b border-[var(--line-soft)] last:border-0">
                          <td className="px-3 py-3.5 text-sm font-medium text-[var(--ink-900)]">{item.feature}</td>
                          <td className="px-3 py-3.5">
                            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold',
                              item.status === 'built' && 'bg-emerald-100 text-emerald-800',
                              item.status === 'placeholder' && 'bg-amber-100 text-amber-800',
                              item.status === 'missing' && 'bg-rose-100 text-rose-800',
                            )}>
                              {item.status === 'built' ? 'Built' : item.status === 'placeholder' ? 'Placeholder' : 'Missing'}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold',
                              item.priority === 'high' && 'bg-[var(--blue-100)] text-[var(--blue-800)]',
                              item.priority === 'medium' && 'bg-[var(--ink-100)] text-[var(--ink-700)]',
                              item.priority === 'low' && 'bg-[var(--ink-50)] text-[var(--ink-500)]',
                            )}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-xs text-[var(--ink-600)]">{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            ))}

            {/* Database Coverage */}
            <Section eyebrow="Database audit" title="BigQuery Data Available vs. Used">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Data currently used (9 tables)</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                    <li>core_amazon.fact_sales_traffic_daily — Revenue, orders, sessions, CVR</li>
                    <li>ops_amazon.sp_fba_manage_inventory_health — 35+ inventory fields</li>
                    <li>ops_amazon.amzn_ads_sp_campaigns — SP campaign metrics</li>
                    <li>ops_amazon.amzn_ads_sb_campaigns — SB campaign metrics</li>
                    <li>ops_amazon.amzn_ads_sd_campaigns — SD campaign metrics</li>
                    <li>ops_amazon.amzn_ads_sp_search_terms — Paid search term data</li>
                    <li>ops_amazon.sp_ba_search_query_by_week — Brand Analytics queries</li>
                    <li>ops_amazon.sp_ba_search_catalog_by_week — Brand Analytics catalog</li>
                    <li>reporting_amazon.data_freshness_status — Pipeline health</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Data available but not visualized</p>
                  <ul className="mt-3 space-y-2 text-sm text-amber-900">
                    <li>Hourly campaign metrics — Available for dayparting heatmap</li>
                    <li>Historical pricing (featuredoffer_price) — Available for price tracking</li>
                    <li>Storage costs + LTSF exposure — Available but not charted</li>
                    <li>Sales velocity by ASIN — Available for forecasting</li>
                    <li>Inventory aging buckets — Available but not visualized</li>
                    <li>Buy Box percentage history — Available for health gauges</li>
                    <li>Campaign-level ROAS over time — Available for bar/line charts</li>
                    <li>SP/SB/SD spend split over time — Available for stacked bar</li>
                  </ul>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* ─── TAB: Chart Wireframes ────────────────────────────────────────── */}
        {activeTab === 'wireframe' && (
          <>
            {/* 1. Revenue & Spend Trend (the existing chart pattern, enhanced) */}
            <Section eyebrow="Chart 1 — Currently placeholder" title="Revenue, Ad Spend & Net Profit Trend">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Multi-line 30-day trend with dual Y-axis. This replaces the placeholder in advertising-detail and performance-detail pages.</p>
              <ChartCard title="Revenue vs Ad Spend vs Net Profit" subtitle="30-day daily view with dual axes">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} width={60} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} width={50} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} formatter={(v: number, name: string) => [name === 'Sessions' ? v.toLocaleString() : fmt(v), name]} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#gRev)" />
                    <Area yAxisId="left" type="monotone" dataKey="adSpend" name="Ad Spend" stroke="#f59e0b" strokeWidth={2} fill="none" />
                    <Area yAxisId="left" type="monotone" dataKey="netProfit" name="Net Profit" stroke="#10b981" strokeWidth={2} fill="url(#gProfit)" />
                    <Area yAxisId="right" type="monotone" dataKey="sessions" name="Sessions" stroke="#8b5cf6" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>

            {/* 2. Organic vs PPC Donut + Ad Type Mix Donut */}
            <Section eyebrow="Chart 2 — Missing" title="Revenue Attribution & Ad Spend Mix">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Two donut charts side by side: organic vs PPC revenue split, and SP/SB/SD spend breakdown.</p>
              <div className="grid gap-6 md:grid-cols-2">
                <ChartCard title="Organic vs PPC Revenue" subtitle="Where revenue comes from" height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={organicPpcSplit} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                        {organicPpcSplit.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Ad Spend by Channel" subtitle="SP / SB / SD breakdown" height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={spendMixData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                        {spendMixData.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </Section>

            {/* 3. ROAS by Campaign — Horizontal Bar */}
            <Section eyebrow="Chart 3 — Missing" title="ROAS by Campaign">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Horizontal bar chart sorted by performance. Green = above 4x target, amber = 3-4x, red = below 3x.</p>
              <ChartCard title="Campaign ROAS (sorted)" subtitle="Color-coded against 4x ROAS target" height={340}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignData.sort((a, b) => b.roas - a.roas)} layout="vertical" margin={{ left: 140, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#627587' }} domain={[0, 7]} />
                    <YAxis type="category" dataKey="campaign" tick={{ fontSize: 11, fill: '#627587' }} width={130} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px' }} formatter={(v: number) => [`${v.toFixed(2)}x`, 'ROAS']} />
                    <Bar dataKey="roas" radius={[0, 6, 6, 0]}>
                      {campaignData.sort((a, b) => b.roas - a.roas).map((entry, idx) => (
                        <Cell key={idx} fill={entry.roas >= 4 ? '#10b981' : entry.roas >= 3 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>

            {/* 4. Profit Waterfall */}
            <Section eyebrow="Chart 4 — Missing" title="Profit Waterfall">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Revenue → FBA Fees → Referral → COGS → Ad Spend → Net Profit. Shows exactly where money goes.</p>
              <ChartCard title="Revenue to Net Profit Breakdown" subtitle="30-day P&L waterfall" height={340}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallSteps} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#627587' }} />
                    <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#627587' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px' }} formatter={(v: number) => [fmt(Math.abs(v)), '']} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {waterfallSteps.map((entry, idx) => (<Cell key={idx} fill={entry.fill} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>

            {/* 5. Keyword Rank Tracker (inverted) */}
            <Section eyebrow="Chart 5 — Missing" title="Keyword Rank Tracker">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Inverted Y-axis (rank 1 at top). Tracks organic position for top keywords over 7 weeks.</p>
              <ChartCard title="Organic Rank History" subtitle="Lower rank number = better position (rank 1 at top)" height={340}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={keywordChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#627587' }} />
                    <YAxis reversed domain={[1, 20]} tick={{ fontSize: 11, fill: '#627587' }} label={{ value: 'Rank', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#627587' } }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {keywordRankData.map((kw, idx) => (
                      <Line key={kw.keyword} type="monotone" dataKey={kw.keyword} stroke={KW_COLORS[idx]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>

            {/* 6. ASIN Performance Table (enhanced) */}
            <Section eyebrow="Chart 6 — Enhancement" title="Top ASIN Performance Dashboard">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Revenue by ASIN with conversion rate, ad dependency, and organic rank. Sortable by any column.</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--line-soft)]">
                      {['ASIN', 'Product', 'Revenue', 'Units', 'Sessions', 'CVR', 'Ad Share', 'Org Rank', 'Trend'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topAsins.map(a => (
                      <tr key={a.asin} className="border-b border-[var(--line-soft)] last:border-0">
                        <td className="px-3 py-3.5 font-mono text-sm font-medium text-[var(--blue-700)]">{a.asin}</td>
                        <td className="px-3 py-3.5 text-sm text-[var(--ink-900)]">{a.title}</td>
                        <td className="px-3 py-3.5 font-mono text-sm font-semibold text-[var(--ink-950)]">{fmt(a.revenue)}</td>
                        <td className="px-3 py-3.5 font-mono text-sm text-[var(--ink-800)]">{a.units.toLocaleString()}</td>
                        <td className="px-3 py-3.5 font-mono text-sm text-[var(--ink-800)]">{a.sessions.toLocaleString()}</td>
                        <td className="px-3 py-3.5 font-mono text-sm text-[var(--ink-800)]">{a.cvr}%</td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--ink-100)]">
                              <div className="h-full rounded-full bg-[var(--blue-600)]" style={{ width: `${a.adShare}%` }} />
                            </div>
                            <span className="font-mono text-xs text-[var(--ink-700)]">{a.adShare}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-sm text-[var(--ink-800)]">#{a.organicRank}</td>
                        <td className="px-3 py-3.5"><StatusDot status={a.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* 7. Inventory Status with Days of Supply Bars */}
            <Section eyebrow="Chart 7 — Enhancement" title="Inventory Health Dashboard">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Traffic-light inventory status with days-of-supply bars and reorder dates.</p>
              <div className="space-y-3">
                {inventoryData.map(item => (
                  <div key={item.sku} className="flex items-center gap-4 rounded-xl border border-[var(--line-soft)] bg-[var(--ink-25)] p-4">
                    <StatusDot status={item.status} />
                    <div className="min-w-[100px]">
                      <p className="font-mono text-xs font-medium text-[var(--ink-900)]">{item.sku}</p>
                      <p className="text-xs text-[var(--ink-600)]">{item.title}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--ink-100)]">
                          <div
                            className={cn('h-full rounded-full',
                              item.dos >= 30 ? 'bg-emerald-500' : item.dos >= 14 ? 'bg-amber-500' : 'bg-rose-500'
                            )}
                            style={{ width: `${Math.min(item.dos / 45 * 100, 100)}%` }}
                          />
                        </div>
                        <span className="w-14 text-right font-mono text-xs font-semibold text-[var(--ink-800)]">{item.dos} days</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-[var(--ink-800)]">{item.stock.toLocaleString()} units</p>
                      <p className="text-[11px] text-[var(--ink-600)]">Reorder: {item.reorderDate}</p>
                    </div>
                    {item.inbound > 0 && (
                      <span className="rounded-full bg-[var(--blue-100)] px-2.5 py-1 text-[11px] font-semibold text-[var(--blue-800)]">
                        {item.inbound} inbound
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* 8. Account Health Gauges */}
            <Section eyebrow="Chart 8 — Missing" title="Account Health Scorecard">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Radial gauges for key account health metrics. Green = within threshold, amber = approaching, red = at risk.</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {healthScores.map(metric => {
                  const pct = metric.name === 'Buy Box %' ? metric.value : Math.min((metric.value / metric.target) * 100, 100);
                  const displayPct = metric.name === 'Buy Box %' ? metric.value : pct;
                  const gaugeData = [{ name: metric.name, value: displayPct, fill: metric.fill }];
                  return (
                    <div key={metric.name} className="rounded-[22px] border border-[var(--line-soft)] bg-gradient-to-br from-[rgba(94,168,255,0.03)] to-white p-5 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-600)]">{metric.name}</p>
                      <div className="mx-auto h-[120px] w-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={gaugeData}>
                            <RadialBar dataKey="value" cornerRadius={8} fill={metric.fill} background={{ fill: '#e5e7eb' }} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-2xl font-semibold text-[var(--ink-950)]">
                        {metric.name === 'Buy Box %' ? `${metric.value}%` : `${metric.value}%`}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-600)]">
                        Target: {metric.name === 'Buy Box %' ? `>${metric.target}%` : `<${metric.target}%`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* 9. Client Portal Trend Chart */}
            <Section eyebrow="Chart 9 — Placeholder fix" title="Client Portal — Performance Trends">
              <p className="mb-4 text-sm text-[var(--ink-700)]">This replaces the "Performance trends shown in detailed reports" placeholder on the client portal page.</p>
              <ChartCard title="Revenue, Orders & Ad Spend" subtitle="Monthly view for client executive summary" height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRevClient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px' }} formatter={(v: number) => [fmt(v), '']} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#gRevClient)" />
                    <Area type="monotone" dataKey="adSpend" name="Ad Spend" stroke="#f59e0b" strokeWidth={2} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>

            {/* 10. Conversion Rate + ACOS Trend */}
            <Section eyebrow="Chart 10 — Enhancement" title="Conversion Rate & ACOS Trend">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Dual-metric line chart showing CVR improvement alongside ACOS efficiency over time.</p>
              <ChartCard title="CVR vs ACOS (30-day)" subtitle="Improving CVR with stable ACOS = healthy growth" height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} domain={[0, 30]} tickFormatter={(v: number) => `${v}%`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#627587' }} tickLine={false} axisLine={false} domain={[0, 50]} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px' }} formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="conversionRate" name="CVR" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="acos" name="ACOS" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>

            {/* 11. Dayparting Heatmap */}
            <Section eyebrow="Chart 11 — Missing" title="Dayparting Heatmap">
              <p className="mb-4 text-sm text-[var(--ink-700)]">Hours x Days grid showing ROAS intensity. Identifies optimal bid windows.</p>
              <ChartCard title="ROAS by Hour & Day" subtitle="Green = high ROAS, Red = low ROAS — use for bid scheduling" height={320}>
                <div className="grid gap-[2px]" style={{ gridTemplateColumns: `60px repeat(18, 1fr)` }}>
                  {/* Header row */}
                  <div />
                  {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                    <div key={h} className="text-center text-[9px] font-mono text-[var(--ink-500)]">{h}:00</div>
                  ))}
                  {/* Data rows */}
                  {days.map(day => (
                    <>
                      <div key={`label-${day}`} className="flex items-center text-xs font-semibold text-[var(--ink-700)]">{day}</div>
                      {daypartData.filter(d => d.day === day).map((cell, idx) => {
                        const intensity = Math.min(cell.roas / 6, 1);
                        const r = Math.round(239 - intensity * 200);
                        const g = Math.round(68 + intensity * 107);
                        const b = Math.round(68 + intensity * 62);
                        return (
                          <div
                            key={`${day}-${idx}`}
                            className="flex aspect-square items-center justify-center rounded-[3px] text-[8px] font-mono text-white"
                            style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                            title={`${day} ${cell.hour}:00 — ROAS: ${cell.roas}x`}
                          >
                            {cell.roas.toFixed(1)}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </ChartCard>
            </Section>

            {/* Build priority summary */}
            <Section eyebrow="Implementation plan" title="Recommended Build Order">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-5">
                  <p className="text-sm font-semibold text-rose-800">Phase 1 — This week</p>
                  <p className="mt-1 text-xs text-rose-700">Wire up placeholder charts with live BigQuery data</p>
                  <ul className="mt-3 space-y-2 text-sm text-rose-900">
                    <li>1. Replace advertising-detail placeholder with real AreaChart</li>
                    <li>2. Replace performance-detail placeholder with real AreaChart</li>
                    <li>3. Replace client-portal placeholder with trend chart</li>
                    <li>4. Add Organic vs PPC donut to client portal</li>
                    <li>5. Add ROAS by Campaign bar chart to advertising pages</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-800">Phase 2 — Next 2 weeks</p>
                  <p className="mt-1 text-xs text-amber-700">New pages and visualizations</p>
                  <ul className="mt-3 space-y-2 text-sm text-amber-900">
                    <li>6. Profit waterfall chart (new section on overview)</li>
                    <li>7. Keyword rank tracker with history</li>
                    <li>8. Account health scorecard page</li>
                    <li>9. Inventory days-of-supply bars</li>
                    <li>10. Ad spend mix donut chart</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-800">Phase 3 — Month 2</p>
                  <p className="mt-1 text-xs text-emerald-700">Advanced features and new pages</p>
                  <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                    <li>11. Dayparting heatmap</li>
                    <li>12. P&L analytics page</li>
                    <li>13. Competitor intelligence page</li>
                    <li>14. Goals & progress tracking</li>
                    <li>15. Client-facing task feed</li>
                  </ul>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </main>
  );
}
