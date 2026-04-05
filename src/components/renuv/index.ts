/**
 * Renuv Amazon Intelligence - Shared Components
 * 
 * Core infrastructure for launch hardening:
 * - Auth guards for permission control
 * - Empty states for graceful data absence
 * - Stale data warnings for freshness monitoring
 * - Brand context for multi-tenant scoping
 */

// Auth & Permissions
export {
  AuthGuard,
  useUserRole,
  useHasRole,
  withAuthGuard,
  type UserRole,
  type AuthGuardProps
} from './auth-guard';

// Empty States
export {
  EmptyState,
  EmptyStateCard,
  EmptyStateInline,
  ConditionalEmpty,
  type EmptyStateVariant,
  type EmptyStateProps
} from './empty-state';

// Data Freshness
export {
  StaleDataBanner,
  DataFreshnessBadge,
  useDataFreshness,
  calculateFreshnessLevel,
  type DataFreshnessLevel,
  type DataFreshnessConfig,
  type StaleDataBannerProps
} from './stale-data-banner';

// Brand Context & Multi-tenant
export {
  BrandProvider,
  useBrand,
  useBrandId,
  useBrandFeature,
  withBrandScope,
  getBrandMetadata,
  listAllBrands,
  withBrandFilter,
  type BrandId,
  type BrandMetadata,
  type BrandProviderProps
} from './brand-context';

// UI Polish Components
export { Navigation, TopBar } from './navigation';
export { DashboardLayout } from './dashboard-layout';
export { KpiCard } from './kpi-card';
export { TrendChart } from './trend-chart';
export { StatusBadge, HealthBadge, RiskBadge, FreshnessBadge } from './status-badge';
export { DataTable, type Column } from './data-table';
export { SectionHeader } from './section-header';
export { Skeleton, KpiCardSkeleton, TableSkeleton, ChartSkeleton, LoadingSpinner } from './loading-skeleton';
export { MetricTooltip, KpiLabel, getMetricHelp } from './metric-tooltip';
