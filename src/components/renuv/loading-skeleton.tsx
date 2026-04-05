import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        className
      )}
      style={{
        animation: 'shimmer 2s infinite linear',
        ...style
      }}
    />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-3xl border border-[var(--line-soft)] bg-white/90 p-6 shadow-[0_18px_40px_rgba(19,44,74,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-10 w-32" />
      <Skeleton className="mt-3 h-1 w-20 rounded-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-sm">
      <div className="border-b border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3.5">
        <div className="flex gap-8">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="divide-y divide-[var(--line-soft)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5">
            <div className="flex gap-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-6 shadow-sm">
      <Skeleton className="mb-4 h-5 w-32" />
      <Skeleton className="h-px w-full" />
      <div className="mt-4 flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-full"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Add shimmer animation to globals.css if not present
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-[var(--line-soft)] border-t-[var(--blue-700)]',
          sizeMap[size]
        )}
      />
    </div>
  );
}
