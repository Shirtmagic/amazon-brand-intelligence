import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percent' | 'number';
  className?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  trend = 'neutral',
  format = 'number',
  className
}: KpiCardProps) {
  const formattedValue = formatValue(value, format);
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-[var(--line-soft)] bg-white/90 p-6 shadow-[0_18px_40px_rgba(19,44,74,0.06)] transition-all duration-200 hover:shadow-[0_24px_56px_rgba(19,44,74,0.12)] hover:-translate-y-0.5',
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-100/0 transition-opacity duration-200 group-hover:from-blue-50/30 group-hover:to-blue-100/20" />

      <div className="relative">
        {/* Label and trend badge */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-600)]">
            {label}
          </p>
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                isPositive && 'bg-green-100 text-green-700',
                isNegative && 'bg-red-100 text-red-700',
                !isPositive && !isNegative && 'bg-gray-100 text-gray-600'
              )}
            >
              {isPositive && <TrendingUp size={10} />}
              {isNegative && <TrendingDown size={10} />}
              {delta}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mt-2">
          <p className="text-3xl font-semibold tracking-tight text-[var(--ink-950)] lg:text-4xl">
            {formattedValue}
          </p>
        </div>

        {/* Trend indicator line */}
        {trend !== 'neutral' && (
          <div className="mt-4 flex items-center gap-2">
            <div
              className={cn(
                'h-1 w-16 rounded-full',
                isPositive && 'bg-gradient-to-r from-green-400 to-green-600',
                isNegative && 'bg-gradient-to-r from-red-400 to-red-600'
              )}
            />
            <span className="text-[10px] font-medium text-[var(--ink-600)]">
              {isPositive ? 'Trending up' : 'Trending down'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function formatValue(value: string | number, format: 'currency' | 'percent' | 'number'): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}
