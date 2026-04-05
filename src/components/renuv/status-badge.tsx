import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatusBadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({
  children,
  variant = 'neutral',
  size = 'md',
  className
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-wide',
        // Variants
        variant === 'success' && 'bg-green-100 text-green-700 border-green-200',
        variant === 'warning' && 'bg-amber-100 text-amber-700 border-amber-200',
        variant === 'danger' && 'bg-red-100 text-red-700 border-red-200',
        variant === 'info' && 'bg-blue-100 text-blue-700 border-blue-200',
        variant === 'neutral' && 'bg-gray-100 text-gray-700 border-gray-200',
        // Sizes
        size === 'sm' && 'px-2 py-0.5 text-[9px] border',
        size === 'md' && 'px-2.5 py-1 text-[10px] border',
        size === 'lg' && 'px-3 py-1.5 text-xs border',
        className
      )}
    >
      {children}
    </span>
  );
}

// Preset badge for common statuses
export function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const config = {
    healthy: { variant: 'success' as const, label: 'Healthy' },
    warning: { variant: 'warning' as const, label: 'Warning' },
    critical: { variant: 'danger' as const, label: 'Critical' }
  };

  const { variant, label } = config[status];

  return <StatusBadge variant={variant}>{label}</StatusBadge>;
}

export function RiskBadge({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' }) {
  const config = {
    low: { variant: 'info' as const, label: 'Low Risk' },
    medium: { variant: 'warning' as const, label: 'Medium Risk' },
    high: { variant: 'warning' as const, label: 'High Risk' },
    critical: { variant: 'danger' as const, label: 'Critical' }
  };

  const { variant, label } = config[severity];

  return <StatusBadge variant={variant}>{label}</StatusBadge>;
}

export function FreshnessBadge({ status }: { status: 'fresh' | 'stale' | 'outdated' }) {
  const config = {
    fresh: { variant: 'success' as const, label: 'Fresh' },
    stale: { variant: 'warning' as const, label: 'Stale' },
    outdated: { variant: 'danger' as const, label: 'Outdated' }
  };

  const { variant, label } = config[status];

  return <StatusBadge variant={variant} size="sm">{label}</StatusBadge>;
}
