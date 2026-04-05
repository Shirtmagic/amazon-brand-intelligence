# Review/Export Mode — Integration Guide

Quick reference for adding review/export mode to new Renuv reports.

## For New Report Pages

### Step 1: Add ReviewExportControls to Your Page Component

```tsx
import { ReviewExportControls } from './review-export-controls';
import { useState } from 'react';

export function YourReportPage({ snapshot }) {
  const [reviewMode, setReviewMode] = useState<'normal' | 'presentation'>('normal');

  const handleExport = (format: 'pdf' | 'print') => {
    console.log('Exporting as:', format);
    // Export logic handled by ReviewExportControls
  };

  return (
    <main data-review-mode={reviewMode}>
      {/* Add controls in header section */}
      <div className="flex gap-3">
        <ReviewExportControls
          brand={snapshot.brand}
          periodLabel={snapshot.periodLabel}
          onModeChange={setReviewMode}
          onExport={handleExport}
        />
      </div>

      {/* Your report content */}
    </main>
  );
}
```

### Step 2: Create Dedicated Review Route

Create `/app/client/renuv/your-report/review/page.tsx`:

```tsx
'use client';

import { YourReportDetail } from '@/components/renuv/your-report-detail';
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';
import { yourReportMock } from '@/lib/renuv-your-report';

export default function YourReportReviewRoute() {
  return (
    <ReviewModeWrapper
      isActive={true}
      exportConfig={{
        brand: yourReportMock.brand,
        periodLabel: yourReportMock.periodLabel,
        reportType: 'Your-Report-Type' // e.g., 'Traffic-Detail'
      }}
    >
      <YourReportDetail snapshot={yourReportMock} />
    </ReviewModeWrapper>
  );
}
```

### Step 3: Add Print-Friendly Markup

Mark elements for print behavior:

```tsx
{/* Hide in print */}
<button className="print-hide mc-btn">
  Interactive Action
</button>

{/* Show only in print */}
<div className="print-only">
  This appears only in PDFs
</div>

{/* Keep together (no page breaks) */}
<div data-print-keep-together>
  <h3>Important Chart</h3>
  <div className="chart-container">...</div>
</div>

{/* Preserve background color */}
<div className="bg-blue-100 print-preserve-bg">
  Brand-colored section
</div>
```

### Step 4: Update Export Config Type (if needed)

Add your report type to `/lib/renuv-export.ts`:

```tsx
export const reportTypeNames = {
  // ... existing types
  yourReport: 'Your-Report-Type'
} as const;
```

## Common Patterns

### Hide Navigation in Review Mode
```tsx
{!hideControls && (
  <nav className="print-hide">
    <Link href="/dashboard">Back</Link>
  </nav>
)}
```

### Conditional Review Mode Styling
```tsx
<main className={cn(
  "min-h-screen bg-gradient-to-b from-blue-50 to-white",
  reviewMode === 'presentation' && 'bg-white'
)}>
```

### Print-Optimized Tables
```tsx
<table className="w-full border-collapse">
  <thead className="print:bg-gray-100">
    <tr>
      <th className="border border-gray-300 p-2">Column</th>
    </tr>
  </thead>
  <tbody>
    {/* Rows will auto-break across pages if needed */}
  </tbody>
</table>
```

### Chart Containers
```tsx
<div className="chart-container" data-print-keep-together>
  {/* Keep charts on one page */}
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>...</LineChart>
  </ResponsiveContainer>
</div>
```

## Testing Your Integration

1. **Review Mode Toggle:** Click "Review Mode" → nav/buttons should hide
2. **Print Preview:** Click "Print" → check browser print preview
3. **Page Breaks:** Ensure charts/cards don't split across pages
4. **Filename:** Check console for generated filename
5. **Multi-Page:** For long reports, verify clean pagination
6. **Colors:** Confirm brand colors appear in print preview
7. **Review Route:** Visit `/your-report/review` → should auto-activate

## Quick Fixes

### "My content is splitting across pages"
Add `data-print-keep-together` or `page-break-inside: avoid`:
```tsx
<div className="[page-break-inside:avoid]">...</div>
```

### "Background colors disappear in print"
Add `print-preserve-bg` class:
```tsx
<div className="bg-blue-500 print-preserve-bg">...</div>
```

### "Review mode isn't hiding my button"
Add `print-hide` class:
```tsx
<button className="print-hide">...</button>
```

### "Filename is wrong"
Check your `exportConfig.reportType`:
```tsx
reportType: 'Correct-Report-Type-With-Caps'
```

## Full Example

See `/components/renuv/client-portal-page.tsx` for a complete reference implementation.

---

**That's it!** Three steps to full review/export mode support.
