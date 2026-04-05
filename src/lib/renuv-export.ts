/**
 * Renuv Amazon Intelligence Export Utilities
 * Brand-scoped export naming and PDF compatibility
 */

export interface ExportConfig {
  brand: string;
  periodLabel: string;
  reportType?: string;
  includeTimestamp?: boolean;
}

/**
 * Generate a standardized filename for exports
 * Format: {Brand}-Amazon-{Report-Type}-{Period}-{Timestamp}
 * Example: Renuv-Amazon-Performance-Report-2026-04-01
 */
export function generateExportFilename(config: ExportConfig): string {
  const {
    brand,
    periodLabel,
    reportType = 'Performance-Report',
    includeTimestamp = true
  } = config;

  // Sanitize but preserve capitalization for brand names
  const sanitizeBrand = (str: string) => 
    str
      .replace(/[^a-zA-Z0-9\s]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  
  // Sanitize other fields (lowercase)
  const sanitize = (str: string) => 
    str.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const parts = [
    sanitizeBrand(brand),
    'Amazon',
    reportType, // Keep as-is (already formatted)
    sanitize(periodLabel)
  ];

  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    parts.push(timestamp);
  }

  return parts.join('-');
}

/**
 * Prepare document for PDF export
 * Returns cleanup function to restore state
 */
export function preparePdfExport(config?: ExportConfig): () => void {
  const body = document.body;
  const html = document.documentElement;
  
  // Store original state
  const originalOverflow = body.style.overflow;
  const originalHeight = html.style.height;
  const originalTitle = document.title;
  
  // Apply print-friendly styles
  body.style.overflow = 'visible';
  html.style.height = 'auto';
  
  // Add print class for additional styling
  body.classList.add('pdf-export-mode');
  
  // Set document title if config provided
  if (config) {
    document.title = generateExportFilename(config);
  }
  
  // Return cleanup function
  return () => {
    body.style.overflow = originalOverflow;
    html.style.height = originalHeight;
    body.classList.remove('pdf-export-mode');
    document.title = originalTitle;
  };
}

/**
 * Check if content will span multiple pages
 * Useful for warning about chart breakpoints
 */
export function estimatePageCount(element: HTMLElement): number {
  // Standard letter page height in pixels at 96 DPI
  const pageHeight = 1056; // 11 inches * 96 DPI
  const marginTop = 144; // 1.5 inches * 96 DPI
  const marginBottom = 192; // 2 inches * 96 DPI
  const usableHeight = pageHeight - marginTop - marginBottom;
  
  const contentHeight = element.scrollHeight;
  return Math.ceil(contentHeight / usableHeight);
}

/**
 * Get export metadata for tracking and auditing
 */
export function getExportMetadata(config: ExportConfig) {
  return {
    filename: generateExportFilename(config),
    brand: config.brand,
    period: config.periodLabel,
    reportType: config.reportType || 'performance',
    exportedAt: new Date().toISOString(),
    exportedBy: 'renuv-amazon-intelligence-v1',
    pageCount: 'calculated-at-export',
    sourceView: 'reporting_amazon.client_portal_export'
  };
}

/**
 * Validate export permissions
 * Placeholder for future permission system integration
 */
export function validateExportPermission(
  brandId: string, 
  userId?: string
): { allowed: boolean; reason?: string } {
  // TODO: Integrate with actual permission system
  // For V1, all exports are allowed (read-only portal)
  return { allowed: true };
}

/**
 * Export format configuration
 */
export const exportFormats = {
  pdf: {
    extension: '.pdf',
    mimeType: 'application/pdf',
    description: 'PDF Document'
  },
  print: {
    extension: '',
    mimeType: '',
    description: 'Browser Print'
  }
} as const;

export type ExportFormat = keyof typeof exportFormats;

/**
 * Trigger browser print dialog with proper setup
 */
export function triggerPrint(config: ExportConfig): void {
  const cleanup = preparePdfExport(config);
  
  // Small delay to ensure styles are applied
  setTimeout(() => {
    window.print();
    
    // Cleanup after print dialog closes
    // Note: This won't fire until the dialog closes
    setTimeout(cleanup, 100);
  }, 100);
}

/**
 * Generate a review mode URL for a specific report
 */
export function getReviewModeUrl(basePath: string): string {
  return `${basePath}/review`;
}

/**
 * Export naming conventions by report type
 */
export const reportTypeNames = {
  portal: 'Performance-Report',
  performance: 'Performance-Detail',
  advertising: 'Advertising-Detail',
  search: 'Search-Detail',
  retailHealth: 'Retail-Health-Detail',
  recommendations: 'Recommendations'
} as const;

export type ReportType = keyof typeof reportTypeNames;
