'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Brand tenant identifiers
 * Each brand gets isolated data scoping
 */
export type BrandId = 'renuv' | 'vya' | 'demo';

export interface BrandMetadata {
  id: BrandId;
  name: string;
  displayName: string;
  
  /**
   * Primary brand color (hex)
   */
  primaryColor: string;
  
  /**
   * Amazon-specific identifiers
   */
  amazon?: {
    sellerId?: string;
    marketplaceId?: string;
    advertisingProfileId?: string;
  };
  
  /**
   * Feature flags per brand
   */
  features?: {
    advertisingEnabled?: boolean;
    searchAnalyticsEnabled?: boolean;
    recommendationsEnabled?: boolean;
    exportEnabled?: boolean;
  };
}

/**
 * Brand registry - central source of truth for brand configs
 */
const BRAND_REGISTRY: Record<BrandId, BrandMetadata> = {
  renuv: {
    id: 'renuv',
    name: 'renuv',
    displayName: 'Renuv',
    primaryColor: '#2563eb', // Blue
    amazon: {
      // V1: Placeholder IDs
      // TODO: Replace with actual Amazon credentials
      sellerId: 'RENUV_SELLER_ID',
      marketplaceId: 'ATVPDKIKX0DER', // US marketplace
      advertisingProfileId: 'RENUV_PROFILE_ID'
    },
    features: {
      advertisingEnabled: true,
      searchAnalyticsEnabled: true,
      recommendationsEnabled: true,
      exportEnabled: true
    }
  },
  vya: {
    id: 'vya',
    name: 'vya',
    displayName: 'VYA',
    primaryColor: '#7c3aed', // Purple
    amazon: {
      sellerId: 'VYA_SELLER_ID',
      marketplaceId: 'ATVPDKIKX0DER',
      advertisingProfileId: 'VYA_PROFILE_ID'
    },
    features: {
      advertisingEnabled: true,
      searchAnalyticsEnabled: true,
      recommendationsEnabled: false, // Not enabled for VYA yet
      exportEnabled: true
    }
  },
  demo: {
    id: 'demo',
    name: 'demo',
    displayName: 'Demo Brand',
    primaryColor: '#059669', // Green
    features: {
      advertisingEnabled: false,
      searchAnalyticsEnabled: false,
      recommendationsEnabled: false,
      exportEnabled: false
    }
  }
};

interface BrandContextValue {
  /**
   * Current brand metadata
   */
  brand: BrandMetadata;
  
  /**
   * Check if a feature is enabled for current brand
   */
  hasFeature: (feature: keyof NonNullable<BrandMetadata['features']>) => boolean;
  
  /**
   * Get brand-scoped data filter
   * Apply to all data queries to prevent cross-brand leakage
   */
  getDataFilter: () => { brandId: BrandId };
}

const BrandContext = createContext<BrandContextValue | null>(null);

export interface BrandProviderProps {
  /**
   * Brand ID to scope this context to
   */
  brandId: BrandId;
  
  /**
   * Child components
   */
  children: ReactNode;
  
  /**
   * Optional brand metadata override
   * For testing or custom configurations
   */
  brandOverride?: Partial<BrandMetadata>;
}

/**
 * BrandProvider - Scopes all data access to a single brand tenant
 * 
 * CRITICAL: All brand-specific pages must wrap content with BrandProvider
 * to ensure no data leakage between brands.
 * 
 * @example Page-level usage
 * ```tsx
 * // In src/app/renuv/page.tsx
 * export default function RenuvDashboard() {
 *   return (
 *     <BrandProvider brandId="renuv">
 *       <DashboardContent />
 *     </BrandProvider>
 *   );
 * }
 * ```
 * 
 * @example In components
 * ```tsx
 * function MetricsPanel() {
 *   const { brand, getDataFilter } = useBrand();
 *   
 *   const metrics = await fetchMetrics({
 *     ...getDataFilter(), // { brandId: 'renuv' }
 *     dateRange: 'last-30-days'
 *   });
 *   
 *   return <MetricsDisplay data={metrics} brandName={brand.displayName} />;
 * }
 * ```
 */
export function BrandProvider({ 
  brandId, 
  children,
  brandOverride 
}: BrandProviderProps) {
  const baseBrand = BRAND_REGISTRY[brandId];
  
  if (!baseBrand) {
    throw new Error(`Invalid brand ID: ${brandId}. Must be one of: ${Object.keys(BRAND_REGISTRY).join(', ')}`);
  }
  
  // Merge override if provided
  const brand: BrandMetadata = brandOverride 
    ? { ...baseBrand, ...brandOverride }
    : baseBrand;
  
  const hasFeature = (feature: keyof NonNullable<BrandMetadata['features']>) => {
    return brand.features?.[feature] ?? false;
  };
  
  const getDataFilter = () => ({
    brandId: brand.id
  });
  
  const value: BrandContextValue = {
    brand,
    hasFeature,
    getDataFilter
  };
  
  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

/**
 * useBrand - Access current brand context
 * 
 * Must be used within a BrandProvider.
 * Provides brand metadata and scoping utilities.
 * 
 * @example
 * ```tsx
 * function BrandedHeader() {
 *   const { brand } = useBrand();
 *   
 *   return (
 *     <header style={{ borderColor: brand.primaryColor }}>
 *       <h1>{brand.displayName} Amazon Intelligence</h1>
 *     </header>
 *   );
 * }
 * ```
 * 
 * @throws Error if used outside BrandProvider
 */
export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext);
  
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  
  return context;
}

/**
 * useBrandId - Convenience hook to get just the brand ID
 * 
 * @example
 * ```tsx
 * function ExportButton() {
 *   const brandId = useBrandId();
 *   
 *   const handleExport = () => {
 *     generateExport({ brand: brandId, ... });
 *   };
 *   
 *   return <button onClick={handleExport}>Export</button>;
 * }
 * ```
 */
export function useBrandId(): BrandId {
  const { brand } = useBrand();
  return brand.id;
}

/**
 * useBrandFeature - Check if a specific feature is enabled
 * 
 * @example
 * ```tsx
 * function AdvertisingSection() {
 *   const hasAdvertising = useBrandFeature('advertisingEnabled');
 *   
 *   if (!hasAdvertising) {
 *     return <EmptyState variant="no-data" title="Advertising not enabled" />;
 *   }
 *   
 *   return <AdvertisingMetrics />;
 * }
 * ```
 */
export function useBrandFeature(
  feature: keyof NonNullable<BrandMetadata['features']>
): boolean {
  const { hasFeature } = useBrand();
  return hasFeature(feature);
}

/**
 * withBrandScope - HOC to wrap components with brand context
 * 
 * @example
 * ```tsx
 * const RenuvDashboard = withBrandScope(DashboardContent, 'renuv');
 * export default RenuvDashboard;
 * ```
 */
export function withBrandScope<P extends object>(
  Component: React.ComponentType<P>,
  brandId: BrandId
) {
  return function BrandScopedComponent(props: P) {
    return (
      <BrandProvider brandId={brandId}>
        <Component {...props} />
      </BrandProvider>
    );
  };
}

/**
 * getBrandMetadata - Utility to fetch brand config outside React
 * 
 * @example
 * ```tsx
 * // In API route or server component
 * const brand = getBrandMetadata('renuv');
 * const sellerId = brand.amazon?.sellerId;
 * ```
 */
export function getBrandMetadata(brandId: BrandId): BrandMetadata {
  const brand = BRAND_REGISTRY[brandId];
  
  if (!brand) {
    throw new Error(`Invalid brand ID: ${brandId}`);
  }
  
  return brand;
}

/**
 * listAllBrands - Get all registered brands
 * Useful for admin/internal views
 * 
 * @example
 * ```tsx
 * function BrandSwitcher() {
 *   const brands = listAllBrands();
 *   
 *   return (
 *     <select>
 *       {brands.map(b => (
 *         <option key={b.id} value={b.id}>{b.displayName}</option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function listAllBrands(): BrandMetadata[] {
  return Object.values(BRAND_REGISTRY);
}

/**
 * Brand-scoped data query wrapper
 * Ensures all queries include brand filter
 * 
 * @example
 * ```tsx
 * const metrics = await withBrandFilter('renuv', async (filter) => {
 *   return await db.metrics.findMany({
 *     where: {
 *       ...filter, // { brandId: 'renuv' }
 *       dateRange: 'last-30-days'
 *     }
 *   });
 * });
 * ```
 */
export async function withBrandFilter<T>(
  brandId: BrandId,
  query: (filter: { brandId: BrandId }) => Promise<T>
): Promise<T> {
  const brand = getBrandMetadata(brandId);
  return query({ brandId: brand.id });
}
