# Review/Export Mode — Stage 8 Documentation

## Overview

The Review/Export Mode system provides clean, print-friendly PDF capture for Renuv Amazon Intelligence reports. It strips navigation, applies professional layout, and ensures proper page breaks for multi-page documents.

## Components

### 1. ReviewModeWrapper
**Location:** `/src/components/renuv/review-mode-wrapper.tsx`

Core wrapper component that manages review/presentation mode state.

**Features:**
- Strips all navigation and interactive controls
- Applies clean white background
- Adds print-specific metadata (brand, period, export date)
- Renders print-only header/footer
- Optimizes page breaks

**Usage:**
```tsx
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';

<ReviewModeWrapper
  isActive={true}
  exportConfig={{
    brand: 'Renuv',
    periodLabel: 'Last 30 days',
    reportType: 'Performance-Report'
  }}
>
  <YourReportComponent />
</ReviewModeWrapper>
```

**Hook:**
```tsx
const { isReviewMode, toggleReviewMode, enterReviewMode, exitReviewMode } = useReviewMode();
```

### 2. ReviewExportControls
**Location:** `/src/components/renuv/review-export-controls.tsx`

UI controls for toggling review mode and triggering exports.

**Features:**
- Review mode toggle button
- Print button (triggers browser print dialog)
- Export PDF button (uses print-to-PDF)
- Visual indicator when review mode is active
- Brand-scoped export naming

**Props:**
```tsx
interface ReviewExportControlsProps {
  brand: string;
  periodLabel: string;
  onModeChange?: (mode: 'normal' | 'presentation') => void;
  onExport?: (format: 'pdf' | 'print') => void;
}
```

## Print CSS System

**Location:** `/src/app/globals.css`

Comprehensive print styles ensure clean PDF capture:

### Page Setup
- **Size:** Letter (8.5" × 11")
- **Margins:** 1.5cm top/bottom, 2cm left/right
- **Orientation:** Portrait

### What Gets Hidden
- All `.mc-btn` buttons
- Navigation elements
- Header/footer (unless `.print-preserve`)
- Elements with `.print-hide` or `[data-print-hide]`
- Review export controls

### What Gets Preserved
- Brand colors (with `-webkit-print-color-adjust: exact`)
- Essential backgrounds (`[data-print-preserve-bg]`)
- Table borders and styling
- Status badges and indicators

### Page Break Control
- **Avoid breaks inside:** Articles, sections, cards, KPI cards, charts, tables, lists
- **Avoid breaks after:** All headings (h1-h6)
- **Avoid orphaned content:** Headers stay with following content

### Typography Optimization
- Body text: 10pt, line-height 1.4
- H1: 24pt
- H2: 18pt
- H3: 14pt
- H4-H6: 12pt
- All text forced to black/dark gray for readability

## Export Utilities

**Location:** `/src/lib/renuv-export.ts`

### Key Functions

#### `generateExportFilename(config)`
Generates standardized filename following brand naming convention.

**Format:** `{Brand}-Amazon-{Report-Type}-{Period}-{YYYY-MM-DD}`

**Example:** `Renuv-Amazon-Performance-Report-Last-30-Days-2026-04-01`

```tsx
const filename = generateExportFilename({
  brand: 'Renuv',
  periodLabel: 'Last 30 days',
  reportType: 'Performance-Report',
  includeTimestamp: true
});
```

#### `triggerPrint(config)`
Triggers browser print dialog with proper setup and cleanup.

```tsx
triggerPrint({
  brand: 'Renuv',
  periodLabel: 'Last 30 days',
  reportType: 'Performance-Report'
});
```

#### `preparePdfExport(config?)`
Low-level function for manual print preparation. Returns cleanup function.

```tsx
const cleanup = preparePdfExport(config);
// Do custom export logic
cleanup(); // Restore original state
```

## Routes

### Dedicated Review Mode Routes
Each report type has a dedicated review mode route that auto-activates review mode:

- `/client/renuv/review` — Full portal
- `/client/renuv/performance/review` — Performance detail
- `/client/renuv/advertising/review` — Advertising detail
- `/client/renuv/search/review` — Search detail
- `/client/renuv/retail-health/review` — Retail health detail
- `/client/renuv/recommendations/review` — Recommendations

**Benefits:**
- Shareable review links
- No need to toggle review mode manually
- Clean URLs for PDF capture tools
- Bookmarkable presentation mode

### In-Page Toggle
All main report pages include ReviewExportControls for in-page review mode toggle.

## Report Type Names

Standardized report type names for export filenames:

```typescript
const reportTypeNames = {
  portal: 'Performance-Report',
  performance: 'Performance-Detail',
  advertising: 'Advertising-Detail',
  search: 'Search-Detail',
  retailHealth: 'Retail-Health-Detail',
  recommendations: 'Recommendations'
};
```

## Export Workflow

### User Flow
1. User views any Renuv report
2. User clicks "Review Mode" button → Navigation/controls fade
3. User clicks "Print" or "Export PDF"
4. Browser print dialog opens with clean layout
5. User selects "Save as PDF" destination
6. PDF saves with brand-scoped filename

### Technical Flow
1. ReviewExportControls → `handleExport('pdf')`
2. Calls `triggerPrint(exportConfig)`
3. `preparePdfExport()` applies print-friendly styles
4. Sets document title to generated filename
5. Triggers `window.print()`
6. Cleanup restores original state after print dialog closes

## CSS Classes Reference

### Utility Classes
- `.print-hide` — Hide in print mode
- `.print-only` — Show only in print mode
- `.print-preserve` — Preserve visibility in print
- `.print-preserve-bg` — Preserve background color in print
- `[data-print-keep-together]` — Avoid page breaks inside
- `.review-mode-active` — Applied to body when review mode active

### State Attributes
- `[data-review-mode="active"]` — Applied to wrapper in review mode
- `[data-print-hide]` — Alternative to `.print-hide` class

## Browser Compatibility

### Print CSS Support
- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support
- ✅ Firefox: Full support (use both `page-break-*` and `break-*`)

### Print-to-PDF
- ✅ Chrome: Native "Save as PDF" destination
- ✅ Safari: "Save as PDF" button in print dialog
- ✅ Firefox: "Save to PDF" destination
- ✅ Edge: Native "Save as PDF" destination

## Page Break Strategy

### Avoid Breaks Inside
Content that should never break across pages:
- KPI cards
- Chart containers (max-height: 400px)
- Tables (but allow row breaks if needed)
- Lists
- Individual list items
- Code blocks

### Allow Breaks
Long content that can span pages:
- Main content sections
- Table rows (if table is very long)

### Prevent Orphans
Headers always keep with following content using:
```css
h1, h2, h3 {
  page-break-after: avoid;
}

h1 + *, h2 + *, h3 + * {
  page-break-before: avoid;
}
```

## Testing Checklist

- [ ] Review mode toggle works on all report pages
- [ ] Print dialog opens with clean layout
- [ ] No navigation/buttons visible in print preview
- [ ] Page breaks don't split KPI cards
- [ ] Charts stay together (no mid-chart breaks)
- [ ] Headers stay with following content
- [ ] Brand colors preserved in print
- [ ] Table borders visible
- [ ] Filename follows naming convention
- [ ] Print header/footer show brand and date
- [ ] Multi-page reports paginate cleanly
- [ ] PDF export matches print preview
- [ ] Cleanup restores normal view after print

## Future Enhancements

### Potential Additions
- Server-side PDF generation (Puppeteer/Playwright)
- Batch export (multiple reports → single PDF)
- Email delivery of PDF reports
- Scheduled PDF generation
- Watermark support
- Custom header/footer templates
- Export to Excel/CSV for data tables
- Print preview modal (before triggering browser print)

### Advanced Page Break Control
- Smart chart splitting for very tall charts
- Dynamic page size based on content
- Landscape mode for wide tables
- Custom page breaks via `<!-- pagebreak -->` comments

## Support

For issues or questions about review/export mode:
1. Check browser console for errors
2. Verify print preview shows expected layout
3. Test in multiple browsers (Chrome, Safari, Firefox)
4. Check CSS specificity if custom styles override print styles
5. Review `@media print` rules in `globals.css`

---

**Stage 8 Complete** ✅
Review/Export Mode operational for all Renuv Amazon Intelligence reports.
