'use client';

/**
 * Competitive Tracker — internal page.
 *
 * One unified view that replaces the old "Keyword Tracker" and
 * "Competitor Intelligence" tabs. The layout is keyword-first:
 *
 *   1. Hero header with source cards
 *   2. Three big SOV KPI cards (impression / click / purchase)
 *   3. 12-week SOV trend chart
 *   4. Competitive position table (workhorse) — sortable, with an
 *      expandable row per keyword showing weekly trend, conversion
 *      edge, estimated market volume, and the top 3 clicked ASINs
 *   5. Opportunities vs Risks callouts
 *   6. Competitor ASIN leaderboard (if data is available)
 *   7. Keyword management (add / remove / reset, localStorage backed)
 *
 * The component is fully client-side because it needs interactivity
 * (sort, expand, keyword editing). Initial data is SSR'd by the
 * server page and passed in as a prop, and the client re-fetches
 * against /api/competitive-tracker whenever the tracked list changes.
 */

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Database,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';
import { internalRoute } from '@/lib/renuv-routes';
import type {
  CompetitiveTrackerData,
  CompetitiveKeyword,
} from '@/lib/renuv-competitive-tracker';

/** Shared localStorage key — same key the old Keyword Tracker used so
 * any already-saved keyword lists carry over seamlessly. */
const STORAGE_KEY = 'renuv_tracked_keywords';

type SortKey =
  | 'keyword'
  | 'volume'
  | 'clickShare'
  | 'purchaseShare'
  | 'wow'
  | 'opportunity';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function RenuvInternalCompetitiveTrackerPage({
  initialData,
  defaultKeywords,
  brand,
}: {
  initialData: CompetitiveTrackerData;
  defaultKeywords: string[];
  brand?: string;
}) {
  const [data, setData] = useState<CompetitiveTrackerData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [trackedKeywords, setTrackedKeywords] = useState<string[]>(
    initialData.trackedKeywordList,
  );
  const [initialized, setInitialized] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newKeyword, setNewKeyword] = useState('');

  const refetch = useCallback(async (keywords: string[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/competitive-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });
      if (res.ok) {
        const next = (await res.json()) as CompetitiveTrackerData;
        setData(next);
      }
    } catch (err) {
      console.error('[CompetitiveTracker] refetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount, load saved keywords from localStorage and refetch if they
  // differ from the server-rendered defaults.
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: string[] = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          const defaultSet = new Set(defaultKeywords.map((d) => d.toLowerCase()));
          const isDifferent =
            saved.length !== defaultKeywords.length ||
            saved.some((k) => !defaultSet.has(k.toLowerCase()));
          if (isDifferent) {
            setTrackedKeywords(saved);
            refetch(saved);
          }
        }
      }
    } catch {
      /* swallow — localStorage can be unavailable in some environments */
    }
    // We intentionally only want this to run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (kws: string[]) => {
      setTrackedKeywords(kws);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(kws));
      } catch {
        /* noop */
      }
      refetch(kws);
    },
    [refetch],
  );

  const handleAddKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    if (trackedKeywords.some((k) => k.toLowerCase() === kw)) {
      setNewKeyword('');
      return;
    }
    persist([...trackedKeywords, kw]);
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    persist(trackedKeywords.filter((k) => k.toLowerCase() !== kw.toLowerCase()));
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'keyword' ? 'asc' : 'desc');
    }
  };

  const toggleExpand = (keyword: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  const sortedKeywords = useMemo(() => {
    const arr = [...data.keywords];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case 'keyword':
          va = a.keyword;
          vb = b.keyword;
          break;
        case 'volume':
          va = a.searchVolume;
          vb = b.searchVolume;
          break;
        case 'clickShare':
          va = a.ourClickShare;
          vb = b.ourClickShare;
          break;
        case 'purchaseShare':
          va = a.ourPurchaseShare;
          vb = b.ourPurchaseShare;
          break;
        case 'wow':
          va = a.clickShareChange;
          vb = b.clickShareChange;
          break;
        case 'opportunity':
          va = a.opportunityScore;
          vb = b.opportunityScore;
          break;
      }
      if (va === vb) return 0;
      return va > vb ? dir : -dir;
    });
    return arr;
  }, [data.keywords, sortKey, sortDir]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(94,168,255,0.18),transparent_32%),linear-gradient(180deg,#eef5fb_0%,#f7f9fc_58%,#edf3f9_100%)] text-[var(--ink-950)]">
      <div className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-10">
        {/* -------------------------------------------------------------- */}
        {/* Hero header                                                     */}
        {/* -------------------------------------------------------------- */}
        <section className="mb-6 overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_24px_80px_rgba(19,44,74,0.10)] backdrop-blur sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,420px)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-700)]">
                <Link
                  href={internalRoute(brand)}
                  className="mc-btn mc-btn-ghost !min-h-0 !px-4 !py-2 !text-[11px]"
                >
                  <ArrowLeft size={14} /> Back to Renuv overview
                </Link>
                <Badge tone="navy">Internal workspace</Badge>
                <Badge tone="blue">Competitive Tracker</Badge>
                {data.weekLabel && <Badge tone="soft">Week of {data.weekLabel}</Badge>}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--blue-700)]">
                  Amazon intelligence
                </p>
                <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-950)] md:text-4xl lg:text-6xl">
                  Competitive Tracker
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)] md:text-lg">
                  Market share across every keyword you care about. How much of the pie do we own,
                  who&apos;s beating us, and which search terms are slipping. One view, updated weekly
                  from Brand Analytics.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={internalRoute(brand, 'advertising')} className="mc-btn mc-btn-primary">
                  Open advertising <ArrowUpRight size={15} />
                </Link>
                <Link href={internalRoute(brand, 'search')} className="mc-btn mc-btn-secondary">
                  Open search intelligence <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniSummaryCard
                title="Tracked keywords"
                value={`${data.totalTrackedKeywords}`}
                detail={`${data.keywordsWithData} with Brand Analytics data this week. Scroll down to add or remove keywords.`}
                icon={<Search size={18} />}
              />
              <MiniSummaryCard
                title="Direction of travel"
                value={`${data.gainingCount} up · ${data.losingCount} down`}
                detail={`${data.stableCount} stable over the last 6 weeks of click share.`}
                icon={<TrendingUp size={18} />}
              />
              <MiniSummaryCard
                title="Primary source"
                value="Brand Analytics"
                detail="ops_amazon.sp_ba_search_query_by_week_v1_view · weekly refresh · 12-week rolling window."
                icon={<Database size={18} />}
              />
            </div>
          </div>
        </section>

        {isLoading && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#eef2f6] px-4 py-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--blue-700)] border-t-transparent" />
            <p className="text-xs font-medium text-[var(--ink-700)]">Refreshing competitive data…</p>
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* SOV KPI cards                                                   */}
        {/* -------------------------------------------------------------- */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SovKpiCard
            label="Impression Share"
            subtitle="Avg across tracked keywords"
            value={data.currentSOV.impressionShare}
            delta={data.sovWowDelta.impressionShare}
            trend={data.sovTrend.map((w) => w.avgImpressionShare)}
            color="#5ea8ff"
          />
          <SovKpiCard
            label="Click Share"
            subtitle="Avg across tracked keywords"
            value={data.currentSOV.clickShare}
            delta={data.sovWowDelta.clickShare}
            trend={data.sovTrend.map((w) => w.avgClickShare)}
            color="#1a5490"
          />
          <SovKpiCard
            label="Purchase Share"
            subtitle="Avg across tracked keywords"
            value={data.currentSOV.purchaseShare}
            delta={data.sovWowDelta.purchaseShare}
            trend={data.sovTrend.map((w) => w.avgPurchaseShare)}
            color="#2d8a56"
          />
        </section>

        {/* -------------------------------------------------------------- */}
        {/* SOV trend chart                                                 */}
        {/* -------------------------------------------------------------- */}
        <section className="mb-6">
          <Panel>
            <SectionHeading
              eyebrow="Share of Voice"
              title="Weekly trend across tracked keywords"
            />
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
              Average impression / click / purchase share across your {data.totalTrackedKeywords}{' '}
              tracked keywords. When the purchase line sits above the click line, our conversion is
              beating the field.
            </p>
            <div className="mt-5 h-[320px] w-full">
              {data.sovTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)]/40 text-sm text-[var(--ink-600)]">
                  No Brand Analytics data for the tracked keywords yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.sovTrend.map((w) => ({
                      week: w.weekEnding,
                      Impression: w.avgImpressionShare * 100,
                      Click: w.avgClickShare * 100,
                      Purchase: w.avgPurchaseShare * 100,
                    }))}
                  >
                    <defs>
                      <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5ea8ff" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#5ea8ff" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradClk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1a5490" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#1a5490" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradPur" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2d8a56" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2d8a56" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: '#627587' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#627587' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '13px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                      formatter={(v: number) => `${v.toFixed(2)}%`}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="Impression"
                      stroke="#5ea8ff"
                      strokeWidth={2}
                      fill="url(#gradImp)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Click"
                      stroke="#1a5490"
                      strokeWidth={2}
                      fill="url(#gradClk)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Purchase"
                      stroke="#2d8a56"
                      strokeWidth={2}
                      fill="url(#gradPur)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Competitive position table                                      */}
        {/* -------------------------------------------------------------- */}
        <section className="mb-6">
          <Panel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionHeading eyebrow="Keyword-level view" title="Competitive position" />
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
                  One row per tracked keyword. Click any row to expand the weekly trend,
                  conversion edge, and which competitor ASINs are showing up in the top 3 clicked
                  positions for that term.
                </p>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-[var(--panel-muted)]">
                    <tr>
                      <Th
                        sortable
                        active={sortKey === 'keyword'}
                        dir={sortDir}
                        onClick={() => toggleSort('keyword')}
                        className="min-w-[220px]"
                      >
                        Keyword
                      </Th>
                      <Th
                        sortable
                        active={sortKey === 'volume'}
                        dir={sortDir}
                        align="right"
                        onClick={() => toggleSort('volume')}
                      >
                        Search Volume
                      </Th>
                      <Th
                        sortable
                        active={sortKey === 'clickShare'}
                        dir={sortDir}
                        align="right"
                        onClick={() => toggleSort('clickShare')}
                      >
                        Click Share
                      </Th>
                      <Th
                        sortable
                        active={sortKey === 'purchaseShare'}
                        dir={sortDir}
                        align="right"
                        onClick={() => toggleSort('purchaseShare')}
                      >
                        Purchase Share
                      </Th>
                      <Th
                        sortable
                        active={sortKey === 'wow'}
                        dir={sortDir}
                        align="right"
                        onClick={() => toggleSort('wow')}
                      >
                        WoW Δ
                      </Th>
                      <Th>Trend</Th>
                      <Th
                        sortable
                        active={sortKey === 'opportunity'}
                        dir={sortDir}
                        align="right"
                        onClick={() => toggleSort('opportunity')}
                      >
                        Opportunity
                      </Th>
                      <Th>Top competitor</Th>
                      <Th align="right" className="w-[40px]">
                        {' '}
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKeywords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-12 text-center text-sm text-[var(--ink-600)]"
                        >
                          No tracked keywords have data yet. Add keywords below to get started.
                        </td>
                      </tr>
                    ) : (
                      sortedKeywords.map((kw) => {
                        const isExp = expanded.has(kw.keyword);
                        const topCompetitor = kw.topPositions.find((p) => !p.isOurs);
                        return (
                          <Fragment key={kw.keyword}>
                            <tr
                              className={cn(
                                'cursor-pointer border-t border-[var(--line-soft)] transition-colors hover:bg-[var(--panel-muted)]/60',
                                isExp && 'bg-[var(--panel-muted)]/40',
                              )}
                              onClick={() => toggleExpand(kw.keyword)}
                            >
                              <td className="px-4 py-3 text-sm font-semibold text-[var(--ink-900)]">
                                {kw.keyword}
                              </td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">
                                {kw.searchVolume.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">
                                {formatPct(kw.ourClickShare)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">
                                {formatPct(kw.ourPurchaseShare)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                <DeltaChip delta={kw.clickShareChange} />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <TrendPill
                                  trend={
                                    kw.trend === 'gaining'
                                      ? 'up'
                                      : kw.trend === 'losing'
                                        ? 'down'
                                        : 'flat'
                                  }
                                >
                                  {kw.trend}
                                </TrendPill>
                              </td>
                              <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">
                                {Math.round(kw.opportunityScore).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--ink-700)]">
                                {topCompetitor ? (
                                  <span className="font-mono text-[11px]">
                                    {topCompetitor.asin}{' '}
                                    <span className="text-[var(--ink-600)]">
                                      ({formatPct(topCompetitor.clickShare)})
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-[var(--ink-600)]">—</span>
                                )}
                              </td>
                              <td className="px-2 py-3 text-right">
                                {isExp ? (
                                  <ChevronDown
                                    size={16}
                                    className="inline text-[var(--ink-600)]"
                                  />
                                ) : (
                                  <ChevronRight
                                    size={16}
                                    className="inline text-[var(--ink-600)]"
                                  />
                                )}
                              </td>
                            </tr>
                            {isExp && (
                              <tr className="border-t border-[var(--line-soft)] bg-[var(--panel-muted)]/30">
                                <td colSpan={9} className="px-4 py-5">
                                  <KeywordDetailPanel kw={kw} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Opportunities + Risks (side by side)                            */}
        {/* -------------------------------------------------------------- */}
        <section className="mb-6 grid gap-6 xl:grid-cols-2">
          <Panel>
            <SectionHeading eyebrow="Where to go after" title="Biggest opportunities" />
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-700)]">
              High-volume keywords where we own a small slice of the pie. Every click-share point
              we take here converts to real revenue.
            </p>
            <div className="mt-5 space-y-3">
              {data.topOpportunities.length === 0 ? (
                <EmptyNote>No opportunities ranked yet.</EmptyNote>
              ) : (
                data.topOpportunities.map((kw) => (
                  <CalloutCard key={kw.keyword} kw={kw} mode="opportunity" />
                ))
              )}
            </div>
          </Panel>
          <Panel>
            <SectionHeading eyebrow="What to defend" title="Biggest risks" />
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--ink-700)]">
              Keywords where our click share dropped the most week-over-week on meaningful volume.
              These are the terms bleeding out first.
            </p>
            <div className="mt-5 space-y-3">
              {data.biggestRisks.length === 0 ? (
                <EmptyNote>Nothing losing ground materially this week. Nice.</EmptyNote>
              ) : (
                data.biggestRisks.map((kw) => (
                  <CalloutCard key={kw.keyword} kw={kw} mode="risk" />
                ))
              )}
            </div>
          </Panel>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Competitor ASIN leaderboard                                     */}
        {/* -------------------------------------------------------------- */}
        {data.hasCompetitorAsinData && (
          <section className="mb-6">
            <Panel>
              <SectionHeading
                eyebrow="Who keeps beating us"
                title="Competitor ASIN leaderboard"
              />
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
                Non-Renuv ASINs that show up across our tracked keywords in the last 14 days,
                ranked by how many of our keywords they appear on. The higher the number, the
                broader the threat.
              </p>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_18px_42px_rgba(19,44,74,0.05)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[var(--panel-muted)]">
                      <tr>
                        <Th>ASIN</Th>
                        <Th>Product</Th>
                        <Th align="right">Keywords</Th>
                        <Th align="right">Avg click share</Th>
                        <Th align="right">Avg purchase share</Th>
                        <Th>Sample keywords</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.competitorAsins.slice(0, 15).map((c) => (
                        <tr key={c.asin} className="border-t border-[var(--line-soft)]">
                          <td className="px-4 py-3 font-mono text-xs text-[var(--ink-900)]">
                            {c.asin}
                          </td>
                          <td
                            className="max-w-[340px] truncate px-4 py-3 text-sm text-[var(--ink-800)]"
                            title={c.productName}
                          >
                            {c.productName}
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">
                            {c.keywordOverlap}
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">
                            {formatPct(c.avgClickShare)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--ink-800)]">
                            {formatPct(c.avgPurchaseShare)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--ink-600)]">
                            {c.topKeywords.slice(0, 3).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Keyword management                                              */}
        {/* -------------------------------------------------------------- */}
        <section className="mb-6">
          <Panel>
            <SectionHeading eyebrow="Tracked keyword list" title="Manage tracking" />
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-700)]">
              These are the keywords we pull competitive data for. Changes are saved to your
              browser and applied on the next refresh. 8–20 keywords gives the cleanest share-of-
              voice signal.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {trackedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-white px-3 py-1.5 text-sm text-[var(--ink-800)] shadow-[0_4px_12px_rgba(19,44,74,0.04)]"
                >
                  {kw}
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="rounded-full p-0.5 text-[var(--ink-600)] transition-colors hover:bg-[var(--panel-muted)] hover:text-[var(--ink-900)]"
                    aria-label={`Remove ${kw}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Add a keyword (e.g., washing machine cleaner)"
                className="min-w-[260px] flex-1 rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-600)] focus:border-[var(--blue-700)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,84,144,0.2)]"
              />
              <button
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--blue-700)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(26,84,144,0.25)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} /> Add keyword
              </button>
              {trackedKeywords.length !== defaultKeywords.length && (
                <button
                  onClick={() => persist(defaultKeywords)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-700)] hover:text-[var(--ink-900)]"
                >
                  Reset to defaults
                </button>
              )}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_24px_70px_rgba(19,44,74,0.08)] backdrop-blur md:p-6">
      {children}
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--blue-700)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">
        {title}
      </h2>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: 'navy' | 'blue' | 'soft';
  children: ReactNode;
}) {
  const styles = {
    navy: 'bg-[var(--navy-900)] text-white',
    blue: 'bg-[var(--blue-700)] text-white',
    soft: 'border border-[var(--line-soft)] bg-white text-[var(--ink-700)]',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]',
        styles[tone],
      )}
    >
      {children}
    </span>
  );
}

function MiniSummaryCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--line-soft)] bg-white p-4 shadow-[0_16px_32px_rgba(19,44,74,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">
          {title}
        </p>
        {icon ? <span className="text-[var(--blue-700)]">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-950)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">{detail}</p>
    </div>
  );
}

function TrendPill({
  trend,
  children,
}: {
  trend: 'up' | 'down' | 'flat';
  children: ReactNode;
}) {
  const styles = {
    up: 'bg-[#e7f4ee] text-[#2d8a56]',
    down: 'bg-[#fff0e8] text-[#b15d27]',
    flat: 'bg-[#eef2f6] text-[#627587]',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        styles[trend],
      )}
    >
      {children}
    </span>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.0005) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2f6] px-2.5 py-1 text-[11px] font-semibold text-[#627587]">
        <Minus size={11} /> 0.0pts
      </span>
    );
  }
  const isUp = delta > 0;
  const cls = isUp ? 'bg-[#e7f4ee] text-[#2d8a56]' : 'bg-[#fff0e8] text-[#b15d27]';
  const sign = isUp ? '+' : '';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums',
        cls,
      )}
    >
      {isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />} {sign}
      {(delta * 100).toFixed(1)}pts
    </span>
  );
}

function Th({
  children,
  sortable,
  active,
  dir,
  align = 'left',
  className,
  onClick,
}: {
  children: ReactNode;
  sortable?: boolean;
  active?: boolean;
  dir?: SortDir;
  align?: 'left' | 'center' | 'right';
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        'select-none px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        sortable && 'cursor-pointer hover:text-[var(--ink-900)]',
        active && 'text-[var(--blue-700)]',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1',
          align === 'right' && 'w-full justify-end',
        )}
      >
        {children}
        {sortable && active && (dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </span>
    </th>
  );
}

function SovKpiCard({
  label,
  subtitle,
  value,
  delta,
  trend,
  color,
}: {
  label: string;
  subtitle: string;
  value: number;
  delta: number;
  trend: number[];
  color: string;
}) {
  const sparkData = trend.map((v, i) => ({ i, v: v * 100 }));
  return (
    <article className="rounded-[24px] border border-[var(--line-soft)] bg-white/90 p-5 shadow-[0_18px_40px_rgba(19,44,74,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">
            {label}
          </p>
          <p className="mt-1 text-[11px] text-[var(--ink-600)]">{subtitle}</p>
        </div>
        <DeltaChip delta={delta} />
      </div>
      <p className="mt-4 text-4xl font-semibold tabular-nums tracking-[-0.04em] text-[var(--ink-950)] md:text-5xl">
        {(value * 100).toFixed(1)}%
      </p>
      {sparkData.length > 1 && (
        <div className="mt-3 h-[48px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

function KeywordDetailPanel({ kw }: { kw: CompetitiveKeyword }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* Weekly trend chart */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">
          Weekly share trend
        </p>
        <div className="mt-2 h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={kw.weeklyHistory.map((w) => ({
                week: w.weekEnding,
                Impression: w.ourImpressionShare * 100,
                Click: w.ourClickShare * 100,
                Purchase: w.ourPurchaseShare * 100,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#627587' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#627587' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(v: number) => `${v.toFixed(2)}%`}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="Impression"
                stroke="#5ea8ff"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Click"
                stroke="#1a5490"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Purchase"
                stroke="#2d8a56"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Right rail: metrics + top clicked ASINs */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Conversion edge"
            value={kw.conversionEdge > 0 ? `${kw.conversionEdge.toFixed(2)}×` : '—'}
            hint={kw.conversionEdge >= 1 ? 'Better than field' : 'Below field'}
          />
          <Metric
            label="Est. market purchases"
            value={
              kw.estimatedTotalPurchases > 0
                ? kw.estimatedTotalPurchases.toLocaleString()
                : '—'
            }
            hint="Total weekly purchases"
          />
          <Metric
            label="Our purchases (wk)"
            value={kw.ourPurchaseCount.toLocaleString()}
            hint="Our ASINs, latest week"
          />
          <Metric
            label="Our clicks (wk)"
            value={kw.ourClickCount.toLocaleString()}
            hint="Our ASINs, latest week"
          />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">
            Top clicked ASINs this week
          </p>
          <div className="mt-2 space-y-1.5">
            {kw.topPositions.length === 0 ? (
              <p className="text-xs text-[var(--ink-600)]">
                No top-positions data from Brand Analytics this week.
              </p>
            ) : (
              kw.topPositions.map((p) => (
                <div
                  key={`${p.rank}-${p.asin}`}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-[14px] border px-3 py-2 text-xs',
                    p.isOurs
                      ? 'border-[rgba(45,138,86,0.3)] bg-[#e7f4ee] text-[#2d8a56]'
                      : 'border-[var(--line-soft)] bg-white text-[var(--ink-800)]',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-[10px] font-semibold text-white">
                      {p.rank}
                    </span>
                    <span className="shrink-0 font-mono text-[11px]">{p.asin}</span>
                    {p.isOurs && (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide">
                        Ours
                      </span>
                    )}
                    <span className="truncate text-[11px] text-[var(--ink-600)]">
                      {p.productName}
                    </span>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatPct(p.clickShare)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--line-soft)] bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums text-[var(--ink-900)]">{value}</p>
      {hint && <p className="text-[10px] text-[var(--ink-600)]">{hint}</p>}
    </div>
  );
}

function CalloutCard({
  kw,
  mode,
}: {
  kw: CompetitiveKeyword;
  mode: 'opportunity' | 'risk';
}) {
  return (
    <div
      className={cn(
        'rounded-[18px] border px-4 py-3 shadow-[0_8px_20px_rgba(19,44,74,0.04)]',
        mode === 'opportunity'
          ? 'border-[rgba(94,168,255,0.22)] bg-[linear-gradient(135deg,rgba(94,168,255,0.10),rgba(255,255,255,0.96))]'
          : 'border-[rgba(177,93,39,0.2)] bg-[linear-gradient(135deg,rgba(255,240,232,0.7),rgba(255,255,255,0.96))]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--ink-900)]">{kw.keyword}</p>
          <p className="mt-1 text-[11px] text-[var(--ink-600)]">
            {kw.searchVolume.toLocaleString()} weekly searches · {formatPct(kw.ourClickShare)}{' '}
            click share
          </p>
        </div>
        {mode === 'risk' ? (
          <DeltaChip delta={kw.clickShareChange} />
        ) : (
          <span className="shrink-0 text-[11px] font-semibold text-[var(--blue-700)]">
            {Math.round(kw.opportunityScore).toLocaleString()} opp
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[var(--line-soft)] bg-[var(--panel-muted)]/40 px-4 py-5 text-center text-sm text-[var(--ink-600)]">
      {children}
    </div>
  );
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
