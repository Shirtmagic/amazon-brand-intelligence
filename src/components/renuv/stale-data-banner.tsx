'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, X, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type DataFreshnessLevel = 'fresh' | 'stale' | 'critical' | 'unknown';

export interface DataFreshnessConfig {
  /**
   * Timestamp when data was last updated
   * ISO string or Date object
   */
  lastUpdated: string | Date | null;
  
  /**
   * Hours until data is considered stale
   * Default: 24 hours
   */
  staleThresholdHours?: number;
  
  /**
   * Hours until data is considered critically stale
   * Default: 72 hours
   */
  criticalThresholdHours?: number;
  
  /**
   * Data source name for messaging
   * Example: "Amazon Advertising API", "Retail Analytics"
   */
  sourceName?: string;
}

export interface StaleDataBannerProps extends DataFreshnessConfig {
  /**
   * Optional refresh callback
   * Shows refresh button if provided
   */
  onRefresh?: () => void | Promise<void>;
  
  /**
   * Whether refresh is currently in progress
   */
  isRefreshing?: boolean;
  
  /**
   * Allow user to dismiss the banner
   * Default: true for stale, false for critical
   */
  dismissible?: boolean;
  
  /**
   * Custom message override
   */
  message?: string;
  
  /**
   * Optional CSS class
   */
  className?: string;
}

/**
 * Calculate data freshness level based on last update time
 */
export function calculateFreshnessLevel({
  lastUpdated,
  staleThresholdHours = 24,
  criticalThresholdHours = 72
}: DataFreshnessConfig): {
  level: DataFreshnessLevel;
  hoursStale: number | null;
} {
  if (!lastUpdated) {
    return { level: 'unknown', hoursStale: null };
  }
  
  const lastUpdateTime = typeof lastUpdated === 'string' 
    ? new Date(lastUpdated) 
    : lastUpdated;
    
  const now = new Date();
  const diffMs = now.getTime() - lastUpdateTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours >= criticalThresholdHours) {
    return { level: 'critical', hoursStale: Math.floor(diffHours) };
  }
  
  if (diffHours >= staleThresholdHours) {
    return { level: 'stale', hoursStale: Math.floor(diffHours) };
  }
  
  return { level: 'fresh', hoursStale: Math.floor(diffHours) };
}

/**
 * StaleDataBanner - Warn users when data freshness exceeds threshold
 * 
 * Integrates with data freshness contracts to show contextual warnings
 * when Amazon API data becomes outdated.
 * 
 * @example Basic usage
 * ```tsx
 * <StaleDataBanner 
 *   lastUpdated={metricsData.lastSyncedAt}
 *   sourceName="Amazon Advertising"
 * />
 * ```
 * 
 * @example With refresh action
 * ```tsx
 * <StaleDataBanner 
 *   lastUpdated={data.timestamp}
 *   onRefresh={handleRefresh}
 *   isRefreshing={isRefreshing}
 *   sourceName="Retail Analytics"
 * />
 * ```
 * 
 * @example Custom thresholds
 * ```tsx
 * <StaleDataBanner 
 *   lastUpdated={metrics.updatedAt}
 *   staleThresholdHours={6}
 *   criticalThresholdHours={24}
 *   sourceName="Real-time Sales Data"
 * />
 * ```
 */
export function StaleDataBanner({
  lastUpdated,
  staleThresholdHours = 24,
  criticalThresholdHours = 72,
  sourceName = 'Data',
  onRefresh,
  isRefreshing = false,
  dismissible,
  message,
  className = ''
}: StaleDataBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { level, hoursStale } = calculateFreshnessLevel({
    lastUpdated,
    staleThresholdHours,
    criticalThresholdHours
  });
  
  // Don't show banner if data is fresh or user dismissed it
  if (level === 'fresh' || isDismissed) {
    return null;
  }
  
  // Default dismissible behavior
  const canDismiss = dismissible ?? (level !== 'critical');
  
  // Generate appropriate message
  const getDefaultMessage = () => {
    if (!lastUpdated) {
      return `${sourceName} availability unknown. Some metrics may be unavailable.`;
    }
    
    const timeAgo = formatDistanceToNow(
      typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated,
      { addSuffix: true }
    );
    
    if (level === 'critical') {
      return `${sourceName} has not updated in ${hoursStale}+ hours (last update ${timeAgo}). Data may be significantly outdated.`;
    }
    
    return `${sourceName} was last updated ${timeAgo}. Some metrics may be delayed.`;
  };
  
  const displayMessage = message || getDefaultMessage();
  
  // Styling based on severity
  const severityStyles = {
    unknown: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: Clock,
      iconColor: 'text-gray-400'
    },
    stale: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: Clock,
      iconColor: 'text-amber-500'
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: AlertTriangle,
      iconColor: 'text-red-500'
    },
    fresh: {
      bg: '',
      border: '',
      text: '',
      icon: Clock,
      iconColor: ''
    }
  };
  
  const styles = severityStyles[level];
  const Icon = styles.icon;
  
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      await onRefresh();
    }
  };
  
  return (
    <div 
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border rounded-lg p-4
        flex items-start gap-3
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <Icon className={`${styles.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {displayMessage}
        </p>
        
        {lastUpdated && (
          <p className="text-xs mt-1 opacity-75">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5
              text-xs font-medium rounded-md
              transition-colors
              ${level === 'critical' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-amber-600 text-white hover:bg-amber-700'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Refresh data"
          >
            <RefreshCw 
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
        
        {/* Dismiss button */}
        {canDismiss && (
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for managing data freshness state
 * Returns freshness level and helper utilities
 * 
 * @example
 * ```tsx
 * function MetricsDashboard({ data }) {
 *   const freshness = useDataFreshness({
 *     lastUpdated: data.syncedAt,
 *     staleThresholdHours: 24
 *   });
 *   
 *   return (
 *     <>
 *       {freshness.isStale && (
 *         <StaleDataBanner lastUpdated={data.syncedAt} />
 *       )}
 *       <MetricsGrid opacity={freshness.isCritical ? 0.6 : 1} />
 *     </>
 *   );
 * }
 * ```
 */
export function useDataFreshness(config: DataFreshnessConfig) {
  const { level, hoursStale } = calculateFreshnessLevel(config);
  
  return {
    level,
    hoursStale,
    isFresh: level === 'fresh',
    isStale: level === 'stale' || level === 'critical',
    isCritical: level === 'critical',
    isUnknown: level === 'unknown',
    shouldWarn: level === 'stale' || level === 'critical'
  };
}

/**
 * Utility: Get freshness indicator badge component
 * For displaying data age inline
 * 
 * @example
 * ```tsx
 * <div className="card-header">
 *   <h3>Sales Metrics</h3>
 *   <DataFreshnessBadge lastUpdated={data.timestamp} />
 * </div>
 * ```
 */
export function DataFreshnessBadge({
  lastUpdated,
  staleThresholdHours = 24,
  criticalThresholdHours = 72
}: DataFreshnessConfig) {
  const { level } = calculateFreshnessLevel({
    lastUpdated,
    staleThresholdHours,
    criticalThresholdHours
  });
  
  if (!lastUpdated || level === 'fresh') {
    return null;
  }
  
  const badgeStyles = {
    unknown: 'bg-gray-100 text-gray-600',
    stale: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
    fresh: ''
  };
  
  const labels = {
    unknown: 'Unknown',
    stale: 'Delayed',
    critical: 'Stale',
    fresh: ''
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      ${badgeStyles[level]}
    `}>
      <Clock className="w-3 h-3" />
      {labels[level]}
    </span>
  );
}
