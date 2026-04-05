'use client';

import { type ReactNode } from 'react';
import { AlertCircle, Database, FileQuestion, Loader2, TrendingUp } from 'lucide-react';

export type EmptyStateVariant = 'loading' | 'no-data' | 'error' | 'filtered' | 'metrics';

export interface EmptyStateProps {
  /**
   * Visual variant - determines icon and styling
   */
  variant?: EmptyStateVariant;
  
  /**
   * Primary heading text
   */
  title?: string;
  
  /**
   * Supporting description text
   */  
  description?: string;
  
  /**
   * Optional icon override
   * If not provided, uses variant-based default
   */
  icon?: ReactNode;
  
  /**
   * Optional action buttons or links
   */
  action?: ReactNode;
  
  /**
   * Optional CSS class for container
   */
  className?: string;
  
  /**
   * Compact mode - reduces padding and text size
   */
  compact?: boolean;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: typeof AlertCircle;
  defaultTitle: string;
  defaultDescription: string;
  iconColor: string;
}> = {
  loading: {
    icon: Loader2,
    defaultTitle: 'Loading data...',
    defaultDescription: 'Please wait while we fetch your Amazon performance metrics.',
    iconColor: 'text-blue-500'
  },
  'no-data': {
    icon: Database,
    defaultTitle: 'No data available',
    defaultDescription: 'There is no data for the selected time period. Try adjusting your filters or date range.',
    iconColor: 'text-gray-400'
  },
  error: {
    icon: AlertCircle,
    defaultTitle: 'Unable to load data',
    defaultDescription: 'An error occurred while fetching your data. Please try refreshing the page.',
    iconColor: 'text-red-500'
  },
  filtered: {
    icon: FileQuestion,
    defaultTitle: 'No results found',
    defaultDescription: 'No data matches your current filters. Try adjusting your selection.',
    iconColor: 'text-gray-400'
  },
  metrics: {
    icon: TrendingUp,
    defaultTitle: 'Awaiting data',
    defaultDescription: 'Performance metrics will appear here once data is available.',
    iconColor: 'text-gray-400'
  }
};

/**
 * EmptyState - Consistent empty state UI across all Renuv views
 * 
 * Prevents broken UI when data contracts return empty arrays or null values.
 * Provides clear messaging and visual consistency.
 * 
 * @example Loading state
 * ```tsx
 * {isLoading && <EmptyState variant="loading" />}
 * ```
 * 
 * @example No data with custom message
 * ```tsx
 * {data.length === 0 && (
 *   <EmptyState 
 *     variant="no-data"
 *     title="No advertising data yet"
 *     description="Amazon advertising metrics will appear here once campaigns are active."
 *   />
 * )}
 * ```
 * 
 * @example With action button
 * ```tsx
 * <EmptyState 
 *   variant="filtered"
 *   action={
 *     <button onClick={clearFilters}>Clear filters</button>
 *   }
 * />
 * ```
 * 
 * @example Compact mode for cards
 * ```tsx
 * <div className="card">
 *   {!metrics && <EmptyState variant="metrics" compact />}
 * </div>
 * ```
 */
export function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  className = '',
  compact = false
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon ? null : config.icon;
  
  const isLoading = variant === 'loading';
  
  return (
    <div 
      className={`
        flex flex-col items-center justify-center text-center
        ${compact ? 'py-8 px-4' : 'py-16 px-6'}
        ${className}
      `}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={isLoading ? 'polite' : 'off'}
    >
      {/* Icon */}
      <div className={`mb-4 ${compact ? 'scale-90' : ''}`}>
        {icon ? (
          <div className="w-12 h-12 flex items-center justify-center">
            {icon}
          </div>
        ) : Icon ? (
          <Icon 
            className={`
              ${compact ? 'w-10 h-10' : 'w-12 h-12'}
              ${config.iconColor}
              ${isLoading ? 'animate-spin' : ''}
            `}
            strokeWidth={1.5}
          />
        ) : null}
      </div>
      
      {/* Title */}
      <h3 className={`
        font-semibold text-gray-900
        ${compact ? 'text-base' : 'text-lg'}
        mb-2
      `}>
        {title || config.defaultTitle}
      </h3>
      
      {/* Description */}
      <p className={`
        text-gray-600 max-w-md
        ${compact ? 'text-sm' : 'text-base'}
        ${action ? 'mb-4' : ''}
      `}>
        {description || config.defaultDescription}
      </p>
      
      {/* Optional action */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyStateCard - Pre-styled card wrapper for empty states
 * Use in dashboard grid layouts
 * 
 * @example
 * ```tsx
 * {!hasData && (
 *   <EmptyStateCard variant="no-data" title="No orders today" />
 * )}
 * ```
 */
export function EmptyStateCard(props: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <EmptyState {...props} compact />
    </div>
  );
}

/**
 * EmptyStateInline - Minimal inline empty state
 * For small UI sections like metric badges or mini charts
 * 
 * @example
 * ```tsx
 * <div className="metric-badge">
 *   {value === null ? (
 *     <EmptyStateInline>No data</EmptyStateInline>
 *   ) : (
 *     <span>{value}</span>
 *   )}
 * </div>
 * ```
 */
export function EmptyStateInline({ 
  children = '—' 
}: { 
  children?: ReactNode 
}) {
  return (
    <span className="text-gray-400 text-sm italic">
      {children}
    </span>
  );
}

/**
 * Conditional wrapper - only renders empty state if condition is true
 * Useful for inline conditional rendering
 * 
 * @example
 * ```tsx
 * <ConditionalEmpty 
 *   isEmpty={data.length === 0}
 *   variant="no-data"
 *   fallback={<DataTable data={data} />}
 * />
 * ```
 */
export function ConditionalEmpty({
  isEmpty,
  fallback,
  ...emptyStateProps
}: EmptyStateProps & {
  isEmpty: boolean;
  fallback?: ReactNode;
}) {
  if (!isEmpty && fallback) {
    return <>{fallback}</>;
  }
  
  if (!isEmpty) {
    return null;
  }
  
  return <EmptyState {...emptyStateProps} />;
}
