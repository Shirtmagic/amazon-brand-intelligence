/**
 * Renuv Mobile Optimization Utilities
 * Responsive behavior helpers for client portal
 */

/**
 * Mobile breakpoints matching Tailwind defaults
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

/**
 * Detect if viewport is mobile-sized
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
}

/**
 * Detect if viewport is tablet-sized
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
}

/**
 * Chart configuration for mobile
 * Reduces data points and adjusts sizing for smaller screens
 */
export function getMobileChartConfig(dataPoints: number) {
  const mobile = isMobile();
  
  return {
    showDataPoints: mobile ? Math.min(dataPoints, 14) : dataPoints, // Last 2 weeks on mobile
    height: mobile ? 200 : 256,
    fontSize: mobile ? 11 : 12,
    showLegend: !mobile,
    showGrid: !mobile,
    strokeWidth: mobile ? 2 : 3,
    pointRadius: mobile ? 2 : 3
  };
}

/**
 * KPI grid configuration by screen size
 */
export function getKpiGridClass(): string {
  // Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols
  return 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3';
}

/**
 * Card stacking configuration
 * Determines whether cards should stack vertically on mobile
 */
export function getCardStackingClass(forceStack?: boolean): string {
  if (forceStack) return 'flex flex-col gap-4';
  return 'grid gap-4 md:grid-cols-2';
}

/**
 * Horizontal scroll container for tables/charts on mobile
 */
export function getOverflowScrollClass(): string {
  return 'overflow-x-auto -mx-2 px-2 md:mx-0 md:px-0 md:overflow-x-visible';
}

/**
 * Typography scaling for mobile
 */
export const mobileTypography = {
  hero: 'text-3xl md:text-4xl lg:text-6xl',
  h2: 'text-xl md:text-2xl',
  h3: 'text-lg md:text-xl',
  body: 'text-sm md:text-base',
  caption: 'text-xs md:text-sm'
} as const;

/**
 * Spacing adjustments for mobile
 */
export const mobileSpacing = {
  section: 'px-4 py-6 md:px-6 md:py-8 lg:px-8',
  card: 'p-4 md:p-5 lg:p-6',
  gap: 'gap-4 md:gap-5 lg:gap-6'
} as const;

/**
 * Touch-friendly button sizing
 */
export const mobileTouchTarget = {
  minHeight: 'min-h-[44px]', // iOS minimum touch target
  padding: 'px-4 py-3 md:px-5 md:py-2.5'
} as const;
