'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const METRIC_HELP: Record<string, string> = {
  'revenue': 'Total revenue from orders placed in this period, sourced from Amazon Seller Central order reports.',
  'ordered revenue': 'Total revenue from orders placed in this period, sourced from Amazon Seller Central order reports.',
  'ad spend': 'Total advertising spend across all campaign types (Sponsored Products, Brands, Display).',
  'total ad spend': 'Total advertising spend across all campaign types (Sponsored Products, Brands, Display).',
  'tacos': 'Total Advertising Cost of Sale = Ad Spend ÷ Total Revenue × 100. Lower is more efficient.',
  'acos': 'Advertising Cost of Sale = Ad Spend ÷ Ad-Attributed Revenue × 100. Measures per-campaign efficiency.',
  'roas': 'Return on Ad Spend = Ad-Attributed Revenue ÷ Ad Spend. Higher means more revenue per dollar spent.',
  'conversion rate': 'Orders ÷ Sessions × 100, from Amazon Business Reports. Measures how well traffic converts.',
  'cvr': 'Conversion Rate = Orders ÷ Sessions × 100, from Amazon Business Reports.',
  'aov': 'Average Order Value = Total Revenue ÷ Number of Orders.',
  'average order value': 'Average Order Value = Total Revenue ÷ Number of Orders.',
  'fee rate': 'Estimated Amazon fees (referral + FBA) as a percentage of revenue.',
  'estimated fees': 'Projected Amazon fees for this period based on product category fee schedules.',
  'sessions': 'Total product detail page views, deduplicated per customer per day. Sourced from Business Reports.',
  'units': 'Total number of individual units ordered across all ASINs in this period.',
  'units sold': 'Total number of individual units ordered across all ASINs in this period.',
  'orders': 'Total number of orders placed in this period from Amazon Seller Central.',
  'order volume': 'Total number of orders placed in this period from Amazon Seller Central.',
  'revenue / session': 'Revenue per session = Total Revenue ÷ Sessions. Measures traffic monetisation quality.',
  'revenue per session': 'Revenue per session = Total Revenue ÷ Sessions. Measures traffic monetisation quality.',
  'click share': 'Your product clicks ÷ total clicks for a given search term. Sourced from Search Query Performance.',
  'share of voice': 'Percentage of search-result impressions captured by your brand for tracked queries.',
  'impressions': 'Total times your product appeared in search results or ad placements.',
  'clicks': 'Total clicks on your product listings from search results or ad placements.',
  'ad attributed sales': 'Revenue directly attributed to ad clicks within the attribution window.',
  'attributed sales': 'Revenue directly attributed to ad clicks within the attribution window.',
  'tacos impact': 'This campaign’s contribution to the overall TACOS metric.',
  'spend share': 'This channel’s share of total advertising spend.',
  'sales share': 'This channel’s share of total ad-attributed revenue.',
  'traffic share': 'This ASIN’s share of total sessions across the catalog.',
  'ad share': 'Percentage of this ASIN’s revenue that is attributed to advertising.',
  'revenue delta': 'Difference between order-reported and retail-reported revenue for reconciliation.',
  'reimbursement watch': 'Estimated value of FBA inventory eligible for reimbursement claims.',
  'organic %': 'Share of impressions or clicks coming from organic (non-paid) search results.',
  'sponsored %': 'Share of impressions or clicks coming from sponsored (paid) ad placements.',
  'ctr': 'Click-Through Rate = Clicks ÷ Impressions × 100. Measures listing appeal in search results.',
  'avg position': 'Average ranking position in Amazon search results for tracked queries.',
};

export function getMetricHelp(label: string): string | undefined {
  return METRIC_HELP[label.toLowerCase().trim()];
}

interface MetricTooltipProps {
  label: string;
  className?: string;
  helpText?: string;
}

export function MetricTooltip({ label, className, helpText }: MetricTooltipProps) {
  const help = helpText || getMetricHelp(label);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const width = Math.min(288, window.innerWidth - 16);
      const left = Math.min(Math.max(rect.left + rect.width / 2 + window.scrollX, width / 2 + 8), window.scrollX + window.innerWidth - width / 2 - 8);
      setPos({ top: rect.bottom + window.scrollY + 10, left });
    };
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    update();
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  if (!help) return null;

  return (
    <span className={cn('inline-flex print-hide', className)}>
      <button
        ref={btnRef}
        type="button"
        title={help}
        aria-label={`${label}: ${help}`}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white/80 text-[var(--ink-600)] transition-colors hover:border-[var(--blue-500)] hover:text-[var(--blue-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]"
      >
        <HelpCircle size={10} />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[300] w-72 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-xl border border-[var(--line-soft)] bg-white px-3 py-2.5 text-left text-[12px] font-normal normal-case leading-5 tracking-normal text-[var(--ink-800)] shadow-[0_12px_32px_rgba(19,44,74,0.14)]"
        >
          {help}
        </div>,
        document.body
      )}
    </span>
  );
}

export function KpiLabel({ children, className }: { children: string; className?: string }) {
  return (
    <p className={cn('text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]', className)}>
      <span className="inline-flex items-center gap-0">
        {children}
        <MetricTooltip label={children} />
      </span>
    </p>
  );
}
