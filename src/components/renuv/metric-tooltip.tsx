'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Compact question-mark help affordance for KPI labels.
 * Hover (desktop) or tap (mobile) reveals a one-sentence explanation.
 */

// ── Metric help dictionary ──────────────────────────────────────────
// Keys are normalised to lower-case so look-ups are case-insensitive.

const METRIC_HELP: Record<string, string> = {
  'revenue': 'Total revenue from orders placed in this period, sourced from Amazon Seller Central order reports.',
  'ordered revenue': 'Total revenue from orders placed in this period, sourced from Amazon Seller Central order reports.',
  'ad spend': 'Total advertising spend across all campaign types (Sponsored Products, Brands, Display).',
  'total ad spend': 'Total advertising spend across all campaign types (Sponsored Products, Brands, Display).',
  'tacos': 'Total Advertising Cost of Sale = Ad Spend \u00f7 Total Revenue \u00d7 100. Lower is more efficient.',
  'acos': 'Advertising Cost of Sale = Ad Spend \u00f7 Ad-Attributed Revenue \u00d7 100. Measures per-campaign efficiency.',
  'roas': 'Return on Ad Spend = Ad-Attributed Revenue \u00f7 Ad Spend. Higher means more revenue per dollar spent.',
  'conversion rate': 'Orders \u00f7 Sessions \u00d7 100, from Amazon Business Reports. Measures how well traffic converts.',
  'cvr': 'Conversion Rate = Orders \u00f7 Sessions \u00d7 100, from Amazon Business Reports.',
  'aov': 'Average Order Value = Total Revenue \u00f7 Number of Orders.',
  'average order value': 'Average Order Value = Total Revenue \u00f7 Number of Orders.',
  'fee rate': 'Estimated Amazon fees (referral + FBA) as a percentage of revenue.',
  'estimated fees': 'Projected Amazon fees for this period based on product category fee schedules.',
  'sessions': 'Total product detail page views, deduplicated per customer per day. Sourced from Business Reports.',
  'units': 'Total number of individual units ordered across all ASINs in this period.',
  'units sold': 'Total number of individual units ordered across all ASINs in this period.',
  'orders': 'Total number of orders placed in this period from Amazon Seller Central.',
  'order volume': 'Total number of orders placed in this period from Amazon Seller Central.',
  'revenue / session': 'Revenue per session = Total Revenue \u00f7 Sessions. Measures traffic monetisation quality.',
  'revenue per session': 'Revenue per session = Total Revenue \u00f7 Sessions. Measures traffic monetisation quality.',
  'click share': 'Your product clicks \u00f7 total clicks for a given search term. Sourced from Search Query Performance.',
  'share of voice': 'Percentage of search-result impressions captured by your brand for tracked queries.',
  'impressions': 'Total times your product appeared in search results or ad placements.',
  'clicks': 'Total clicks on your product listings from search results or ad placements.',
  'ad attributed sales': 'Revenue directly attributed to ad clicks within the attribution window.',
  'attributed sales': 'Revenue directly attributed to ad clicks within the attribution window.',
  'tacos impact': 'This campaign\u2019s contribution to the overall TACOS metric.',
  'spend share': 'This channel\u2019s share of total advertising spend.',
  'sales share': 'This channel\u2019s share of total ad-attributed revenue.',
  'traffic share': 'This ASIN\u2019s share of total sessions across the catalog.',
  'ad share': 'Percentage of this ASIN\u2019s revenue that is attributed to advertising.',
  'revenue delta': 'Difference between order-reported and retail-reported revenue for reconciliation.',
  'reimbursement watch': 'Estimated value of FBA inventory eligible for reimbursement claims.',
  'organic %': 'Share of impressions or clicks coming from organic (non-paid) search results.',
  'sponsored %': 'Share of impressions or clicks coming from sponsored (paid) ad placements.',
  'ctr': 'Click-Through Rate = Clicks \u00f7 Impressions \u00d7 100. Measures listing appeal in search results.',
  'avg position': 'Average ranking position in Amazon search results for tracked queries.',
  'active asins': 'Number of ASINs with at least one session or order in this period.',
  'top-3 concentration': 'Revenue share held by the top 3 ASINs — high values signal catalog dependency risk.',
  'hero sku share': 'Revenue share held by the single best-selling SKU.',
  'catalog breadth': 'Number of distinct ASINs generating meaningful revenue (above a minimum threshold).',
  'in-stock rate': 'Percentage of active ASINs that are currently in stock and orderable.',
  'buy box %': 'Percentage of page views where your offer holds the Buy Box.',
  'listing health': 'Composite score reflecting content completeness, suppression risk, and listing quality.',
  'suppression risk': 'Number of ASINs at risk of being suppressed due to listing quality or policy issues.',
};

export function getMetricHelp(label: string): string | undefined {
  return METRIC_HELP[label.toLowerCase().trim()];
}

interface MetricTooltipProps {
  label: string;
  className?: string;
}

export function MetricTooltip({ label, className }: MetricTooltipProps) {
  const help = getMetricHelp(label);
  if (!help) return null;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <span className={cn('relative inline-flex print-hide', className)}>
      <button
        ref={ref}
        type="button"
        aria-label={`What is ${label}?`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="ml-1 inline-flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/80 text-[var(--ink-600)] transition-colors hover:border-[var(--blue-500)] hover:text-[var(--blue-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]"
      >
        <HelpCircle size={10} />
      </button>
      {open && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2.5 text-[12px] font-normal normal-case leading-5 tracking-normal text-[var(--ink-800)] shadow-[0_12px_32px_rgba(19,44,74,0.14)]"
        >
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-[var(--line-soft)] bg-white" />
          {help}
        </div>
      )}
    </span>
  );
}

/**
 * Convenience wrapper: renders a KPI label with an inline help icon.
 * Use this in place of bare <p> labels when you want the tooltip affordance.
 */
export function KpiLabel({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p className={cn('text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]', className)}>
      <span className="inline-flex items-center gap-0">
        {children}
        <MetricTooltip label={children} />
      </span>
    </p>
  );
}
