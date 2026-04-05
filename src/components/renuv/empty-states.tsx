/**
 * Empty State Components for Renuv Amazon Intelligence
 * Graceful handling of missing or unavailable data
 */

import { FileQuestion, TrendingUp, Lightbulb, Shield, CheckCircle2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  variant: 'kpis' | 'trends' | 'growth-drivers' | 'risks' | 'next-steps' | 'generic';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  variant, 
  title, 
  message, 
  action,
  className 
}: EmptyStateProps) {
  const config = getEmptyStateConfig(variant);
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-[24px] border border-[var(--line-soft)]',
        'bg-gradient-to-br from-[rgba(94,168,255,0.04)] to-white',
        'p-8 md:p-12 text-center',
        'min-h-[240px]',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(94,168,255,0.12)]">
        <Icon size={32} className="text-[var(--blue-700)]" />
      </div>
      
      <h3 className="mt-6 text-lg font-semibold text-[var(--ink-950)]">
        {title || config.title}
      </h3>
      
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ink-700)]">
        {message || config.message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="mc-btn mc-btn-secondary mt-6"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function getEmptyStateConfig(variant: EmptyStateProps['variant']) {
  const configs = {
    kpis: {
      icon: BarChart3,
      title: 'No KPI data available',
      message: 'Performance metrics are not yet available for this period. Data may still be processing or the reporting period may not have started.'
    },
    trends: {
      icon: TrendingUp,
      title: 'No trend data available',
      message: 'Historical performance data is not yet available. Check back soon as data is collected and processed.'
    },
    'growth-drivers': {
      icon: Lightbulb,
      title: 'No growth drivers identified',
      message: 'No significant growth drivers have been identified for this period. This may indicate stable performance or insufficient data for analysis.'
    },
    risks: {
      icon: Shield,
      title: 'No risks detected',
      message: 'No notable risks have been identified. Continue monitoring key metrics and market conditions.'
    },
    'next-steps': {
      icon: CheckCircle2,
      title: 'No recommendations at this time',
      message: 'No specific action items are available. This report will be updated as new insights emerge.'
    },
    generic: {
      icon: FileQuestion,
      title: 'No data available',
      message: 'Data for this section is currently unavailable. Please check back later or contact support if this persists.'
    }
  };

  return configs[variant];
}

interface StaleDataBannerProps {
  ageHours: number;
  onRefresh?: () => void;
}

export function StaleDataBanner({ ageHours, onRefresh }: StaleDataBannerProps) {
  return (
    <div className="mb-6 rounded-[24px] border border-[#876a18]/30 bg-[linear-gradient(135deg,rgba(255,248,232,0.7),rgba(255,255,255,0.98))] p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-[#876a18]">
          <FileQuestion size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--ink-950)]">Data may be outdated</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-700)]">
            This report was last updated {ageHours} hours ago. Some metrics may not reflect the most recent performance.
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mc-btn mc-btn-secondary mt-4"
            >
              Refresh data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DataQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  completeness: number;
  issues?: string[];
  className?: string;
}

export function DataQualityIndicator({ 
  quality, 
  completeness, 
  issues,
  className 
}: DataQualityIndicatorProps) {
  const config = {
    excellent: {
      color: 'text-[#2d8a56]',
      bg: 'bg-[#e7f4ee]',
      label: 'Excellent'
    },
    good: {
      color: 'text-[var(--blue-700)]',
      bg: 'bg-[rgba(94,168,255,0.12)]',
      label: 'Good'
    },
    fair: {
      color: 'text-[#876a18]',
      bg: 'bg-[#fff8e8]',
      label: 'Fair'
    },
    poor: {
      color: 'text-[#c42e1f]',
      bg: 'bg-[rgba(196,46,31,0.12)]',
      label: 'Poor'
    }
  }[quality];

  if (quality === 'excellent' && !issues?.length) {
    return null; // Don't show indicator if everything is perfect
  }

  return (
    <div className={cn('rounded-[20px] border border-[var(--line-soft)] bg-white p-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-600)]">
            Data quality
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', config.color, config.bg)}>
              {config.label}
            </span>
            <span className="text-sm text-[var(--ink-700)]">
              {completeness}% complete
            </span>
          </div>
        </div>
      </div>
      
      {issues && issues.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-[var(--ink-600)]">
          {issues.slice(0, 3).map((issue, idx) => (
            <li key={idx}>• {issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
