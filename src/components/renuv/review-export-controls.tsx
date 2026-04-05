'use client';

import { useState } from 'react';
import { Printer, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerPrint, generateExportFilename, type ExportFormat } from '@/lib/renuv-export';

type ReviewMode = 'normal' | 'presentation';

export interface ReviewExportControlsProps {
  brand: string;
  periodLabel: string;
  onModeChange?: (mode: ReviewMode) => void;
  onExport?: (format: ExportFormat) => void;
}

export function ReviewExportControls({ 
  brand, 
  periodLabel, 
  onModeChange, 
  onExport 
}: ReviewExportControlsProps) {
  const [reviewMode, setReviewMode] = useState<ReviewMode>('normal');
  const [isExporting, setIsExporting] = useState(false);

  const handleModeToggle = () => {
    const newMode = reviewMode === 'normal' ? 'presentation' : 'normal';
    setReviewMode(newMode);
    onModeChange?.(newMode);
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      onExport?.(format);
      
      const exportConfig = {
        brand,
        periodLabel,
        reportType: 'Performance-Report'
      };
      
      const filename = generateExportFilename(exportConfig);
      
      if (format === 'print' || format === 'pdf') {
        console.log('Exporting:', filename);
        triggerPrint(exportConfig);
      }
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleModeToggle}
        className={cn(
          'mc-btn mc-btn-secondary flex items-center gap-2',
          reviewMode === 'presentation' && 'bg-[var(--blue-700)] text-white hover:bg-[var(--blue-800)]'
        )}
        aria-pressed={reviewMode === 'presentation'}
      >
        <Eye size={16} />
        {reviewMode === 'presentation' ? 'Exit Review Mode' : 'Review Mode'}
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport('print')}
          disabled={isExporting}
          className="mc-btn mc-btn-ghost flex items-center gap-2"
          title="Print report"
        >
          <Printer size={16} />
          Print
        </button>

        <button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="mc-btn mc-btn-ghost flex items-center gap-2"
          title="Export as PDF"
        >
          <Download size={16} />
          Export PDF
        </button>
      </div>

      {reviewMode === 'presentation' && (
        <div className="flex items-center gap-2 rounded-full bg-[#e7f4ee] px-4 py-2 text-xs font-semibold text-[#2d8a56]">
          <CheckCircle2 size={14} />
          Presentation Mode Active
        </div>
      )}
    </div>
  );
}

/**
 * Print-specific styles to be included in global CSS
 * These ensure the report prints cleanly and professionally
 */
export const printStyles = `
@media print {
  /* Hide navigation, controls, and non-essential UI */
  .mc-btn,
  nav,
  header:not(.print-preserve),
  footer:not(.print-preserve),
  [data-print-hide],
  .print-hide {
    display: none !important;
  }

  /* Optimize page layout */
  body {
    background: white !important;
    margin: 0;
    padding: 0;
  }

  main {
    background: white !important;
    max-width: 100% !important;
    padding: 0 !important;
  }

  /* Remove shadows and gradients for print */
  * {
    box-shadow: none !important;
    background-image: none !important;
  }

  /* Preserve essential backgrounds */
  [data-print-preserve-bg] {
    background-color: inherit !important;
  }

  /* Ensure readable text */
  body,
  p,
  span,
  div {
    color: #000 !important;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #1a1a1a !important;
    page-break-after: avoid;
  }

  /* Avoid breaking content */
  article,
  section,
  .card,
  [data-print-keep-together] {
    page-break-inside: avoid;
  }

  /* Chart and metric containers */
  .chart-container,
  .kpi-card,
  .metric-block {
    page-break-inside: avoid;
    margin-bottom: 1rem;
  }

  /* Ensure borders are visible */
  table,
  .bordered {
    border: 1px solid #ddd !important;
  }

  /* Page margins */
  @page {
    margin: 1.5cm 2cm;
    size: letter;
  }

  /* Long content handling */
  .long-section {
    page-break-inside: auto;
  }

  /* Chart breakpoint protection */
  .chart-wrapper {
    page-break-inside: avoid;
    max-height: 400px;
    overflow: visible;
  }

  /* Preserve spacing in lists */
  ul, ol {
    page-break-inside: avoid;
  }

  li {
    page-break-inside: avoid;
  }
}
`;
