/**
 * Renuv Amazon Intelligence Data Validation
 * Empty state handling, stale data detection, and data quality checks
 */

import type { ClientPortalSnapshot, ClientKpi } from './renuv-client-portal';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Validate client portal snapshot data
 */
export function validateSnapshot(snapshot: ClientPortalSnapshot): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!snapshot.brand || snapshot.brand.trim() === '') {
    errors.push({
      field: 'brand',
      message: 'Brand name is required',
      severity: 'critical'
    });
  }

  if (!snapshot.periodLabel || snapshot.periodLabel.trim() === '') {
    errors.push({
      field: 'periodLabel',
      message: 'Period label is required',
      severity: 'critical'
    });
  }

  // KPIs validation
  if (!snapshot.kpis || snapshot.kpis.length === 0) {
    errors.push({
      field: 'kpis',
      message: 'At least one KPI is required',
      severity: 'critical'
    });
  } else {
    snapshot.kpis.forEach((kpi, idx) => {
      if (!kpi.value || kpi.value === '0' || kpi.value === '$0') {
        warnings.push({
          field: `kpis[${idx}].value`,
          message: `KPI "${kpi.label}" has zero or empty value`,
          suggestion: 'Verify data source and refresh if needed'
        });
      }
    });
  }

  // Trend data validation
  if (!snapshot.trendData || snapshot.trendData.length === 0) {
    warnings.push({
      field: 'trendData',
      message: 'No trend data available',
      suggestion: 'Charts will show empty state'
    });
  } else if (snapshot.trendData.length < 7) {
    warnings.push({
      field: 'trendData',
      message: `Only ${snapshot.trendData.length} data points (recommended: 7+)`,
      suggestion: 'Trend visualization may be limited'
    });
  }

  // Growth drivers
  if (!snapshot.growthDrivers || snapshot.growthDrivers.length === 0) {
    warnings.push({
      field: 'growthDrivers',
      message: 'No growth drivers identified',
      suggestion: 'Empty state will be shown'
    });
  }

  // Risks
  if (!snapshot.risks || snapshot.risks.length === 0) {
    warnings.push({
      field: 'risks',
      message: 'No risks identified',
      suggestion: 'Consider if this is expected for the period'
    });
  }

  // Next steps
  if (!snapshot.nextSteps || snapshot.nextSteps.length === 0) {
    warnings.push({
      field: 'nextSteps',
      message: 'No next steps provided',
      suggestion: 'Recommendations section will be empty'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if data is stale (older than threshold)
 */
export function isDataStale(
  snapshot: ClientPortalSnapshot,
  maxAgeHours: number = 24
): { stale: boolean; age: number; message?: string } {
  // Extract date from period label or use current time
  // For V1, assume data is fresh if it exists
  // In production, this would check actual data timestamps
  
  const now = new Date();
  const dataAge = 0; // hours - placeholder for actual calculation
  
  if (dataAge > maxAgeHours) {
    return {
      stale: true,
      age: dataAge,
      message: `Data is ${dataAge} hours old (threshold: ${maxAgeHours}h)`
    };
  }

  return { stale: false, age: dataAge };
}

/**
 * Detect missing data patterns
 */
export function detectMissingData(snapshot: ClientPortalSnapshot): string[] {
  const missing: string[] = [];

  // Check for missing revenue data
  const hasRevenue = snapshot.kpis.some(kpi => 
    kpi.key === 'revenue' && kpi.value !== '0' && kpi.value !== '$0'
  );
  if (!hasRevenue) {
    missing.push('Revenue data');
  }

  // Check for missing trend data
  if (!snapshot.trendData || snapshot.trendData.length === 0) {
    missing.push('Historical trend data');
  }

  // Check for missing context
  if (!snapshot.executiveSummary || snapshot.executiveSummary.trim() === '') {
    missing.push('Executive summary');
  }

  if (!snapshot.marketContext || 
      !snapshot.marketContext.categoryTrend || 
      snapshot.marketContext.categoryTrend.trim() === '') {
    missing.push('Market context');
  }

  return missing;
}

/**
 * Validate brand isolation (no cross-brand leakage)
 */
export function validateBrandIsolation(
  snapshot: ClientPortalSnapshot,
  expectedBrand: string
): { isolated: boolean; leaks: string[] } {
  const leaks: string[] = [];

  // Check if brand name matches everywhere
  if (snapshot.brand !== expectedBrand) {
    leaks.push(`Snapshot brand "${snapshot.brand}" does not match expected "${expectedBrand}"`);
  }

  // In a real implementation, check all nested data for brand consistency
  // For V1, we trust the data source

  return {
    isolated: leaks.length === 0,
    leaks
  };
}

/**
 * Generate empty state message
 */
export function getEmptyStateMessage(field: string): string {
  const messages: Record<string, string> = {
    kpis: 'No KPI data available for this period. Data may still be processing.',
    trendData: 'Historical data is not yet available. Check back soon.',
    growthDrivers: 'No significant growth drivers identified for this period.',
    risks: 'No notable risks detected. Continue monitoring key metrics.',
    nextSteps: 'No recommendations at this time. Review will be updated as insights emerge.',
    marketContext: 'Market context data is currently unavailable.'
  };

  return messages[field] || 'No data available.';
}

/**
 * Audit data quality for launch
 */
export interface DataQualityReport {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  completeness: number; // 0-100
  freshness: 'current' | 'recent' | 'stale' | 'unknown';
  issues: string[];
  recommendations: string[];
}

export function auditDataQuality(snapshot: ClientPortalSnapshot): DataQualityReport {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const validation = validateSnapshot(snapshot);
  const staleness = isDataStale(snapshot);
  const missing = detectMissingData(snapshot);

  // Calculate completeness score
  const totalFields = 7; // kpis, trendData, growthDrivers, risks, nextSteps, marketContext, executiveSummary
  const populatedFields = totalFields - missing.length;
  const completeness = Math.round((populatedFields / totalFields) * 100);

  // Collect issues
  if (validation.errors.length > 0) {
    issues.push(`${validation.errors.length} critical validation errors`);
  }
  if (validation.warnings.length > 0) {
    issues.push(`${validation.warnings.length} validation warnings`);
  }
  if (missing.length > 0) {
    issues.push(`Missing: ${missing.join(', ')}`);
  }
  if (staleness.stale) {
    issues.push(`Data is stale (${staleness.age} hours old)`);
  }

  // Generate recommendations
  if (completeness < 70) {
    recommendations.push('Ensure all data sources are connected and refreshing');
  }
  if (validation.warnings.length > 0) {
    recommendations.push('Review validation warnings and address data gaps');
  }
  if (staleness.stale) {
    recommendations.push('Refresh data pipeline to ensure timely updates');
  }

  // Determine overall quality
  let overall: DataQualityReport['overall'];
  if (completeness >= 90 && validation.errors.length === 0 && !staleness.stale) {
    overall = 'excellent';
  } else if (completeness >= 75 && validation.errors.length === 0) {
    overall = 'good';
  } else if (completeness >= 50) {
    overall = 'fair';
  } else {
    overall = 'poor';
  }

  // Determine freshness
  let freshness: DataQualityReport['freshness'];
  if (staleness.stale) {
    freshness = 'stale';
  } else if (staleness.age < 6) {
    freshness = 'current';
  } else {
    freshness = 'recent';
  }

  return {
    overall,
    completeness,
    freshness,
    issues,
    recommendations
  };
}
