/**
 * Renuv Amazon Intelligence V1 Pilot Acceptance Checklist
 * Comprehensive testing and validation for launch readiness
 */

export interface ChecklistItem {
  id: string;
  category: 'permissions' | 'data-quality' | 'ui-ux' | 'export' | 'mobile' | 'brand-isolation';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tested: boolean;
  passed?: boolean;
  notes?: string;
  testSteps?: string[];
}

export const pilotAcceptanceChecklist: ChecklistItem[] = [
  // Permission Audit
  {
    id: 'perm-001',
    category: 'permissions',
    title: 'Client can access own brand portal',
    description: 'Verify client user can view their brand\'s portal page',
    priority: 'critical',
    tested: false,
    testSteps: [
      'Log in as client user',
      'Navigate to /client/renuv',
      'Verify brand name matches client\'s brand',
      'Confirm all sections load properly'
    ]
  },
  {
    id: 'perm-002',
    category: 'permissions',
    title: 'Client cannot access other brands',
    description: 'Ensure brand isolation prevents cross-brand access',
    priority: 'critical',
    tested: false,
    testSteps: [
      'Log in as client user for Brand A',
      'Attempt to access Brand B data via URL manipulation',
      'Verify access is denied',
      'Check no Brand B data leaks in UI'
    ]
  },
  {
    id: 'perm-003',
    category: 'permissions',
    title: 'Internal users can access all brands',
    description: 'Internal team members should see all client portals',
    priority: 'high',
    tested: false,
    testSteps: [
      'Log in as internal user',
      'Access multiple brand portals',
      'Verify full data visibility',
      'Confirm internal workspace access'
    ]
  },

  // Empty State Audit
  {
    id: 'empty-001',
    category: 'data-quality',
    title: 'KPI section handles empty data',
    description: 'Empty state displays when no KPI data available',
    priority: 'high',
    tested: false,
    testSteps: [
      'Mock snapshot with empty kpis array',
      'Load portal page',
      'Verify empty state component renders',
      'Check message is clear and helpful'
    ]
  },
  {
    id: 'empty-002',
    category: 'data-quality',
    title: 'Trend chart handles missing data',
    description: 'Chart shows appropriate empty state',
    priority: 'high',
    tested: false,
    testSteps: [
      'Mock snapshot with empty trendData',
      'Verify chart area shows empty state',
      'Ensure no JavaScript errors',
      'Check layout remains intact'
    ]
  },
  {
    id: 'empty-003',
    category: 'data-quality',
    title: 'Growth drivers empty state',
    description: 'Gracefully handle no growth drivers',
    priority: 'medium',
    tested: false,
    testSteps: [
      'Mock snapshot with empty growthDrivers',
      'Verify empty state message displays',
      'Confirm section remains visible'
    ]
  },
  {
    id: 'empty-004',
    category: 'data-quality',
    title: 'Risks section empty state',
    description: 'Show appropriate message when no risks',
    priority: 'medium',
    tested: false,
    testSteps: [
      'Mock snapshot with empty risks',
      'Verify positive empty state message',
      'Check it communicates "no risks detected"'
    ]
  },

  // Stale Data Behavior
  {
    id: 'stale-001',
    category: 'data-quality',
    title: 'Detect stale data',
    description: 'System identifies when data is outdated',
    priority: 'high',
    tested: false,
    testSteps: [
      'Mock snapshot with old timestamp',
      'Verify staleness detection triggers',
      'Check warning banner displays',
      'Confirm age is calculated correctly'
    ]
  },
  {
    id: 'stale-002',
    category: 'data-quality',
    title: 'Stale data banner visibility',
    description: 'Warning banner shows for outdated data',
    priority: 'high',
    tested: false,
    testSteps: [
      'Trigger stale data condition',
      'Verify banner appears at top',
      'Check message clarity',
      'Test refresh action if available'
    ]
  },

  // Export and Filename Audit
  {
    id: 'export-001',
    category: 'export',
    title: 'PDF export generates correct filename',
    description: 'Filename follows brand-scoped naming convention',
    priority: 'critical',
    tested: false,
    testSteps: [
      'Click "Export PDF" button',
      'Verify filename format: {brand}-amazon-performance-{period}-{date}',
      'Check brand name is sanitized',
      'Confirm no special characters or spaces'
    ]
  },
  {
    id: 'export-002',
    category: 'export',
    title: 'Print mode hides UI controls',
    description: 'Print layout removes buttons and navigation',
    priority: 'high',
    tested: false,
    testSteps: [
      'Open portal page',
      'Trigger print mode',
      'Verify all .print-hide elements hidden',
      'Check clean, professional layout'
    ]
  },
  {
    id: 'export-003',
    category: 'export',
    title: 'Long pages print correctly',
    description: 'Multi-page reports break appropriately',
    priority: 'medium',
    tested: false,
    testSteps: [
      'Load portal with full data',
      'Print preview',
      'Check chart breakpoints don\'t split charts',
      'Verify cards stay together',
      'Test page margins'
    ]
  },
  {
    id: 'export-004',
    category: 'export',
    title: 'Review mode styling',
    description: 'Presentation mode provides clean view',
    priority: 'medium',
    tested: false,
    testSteps: [
      'Enable Review Mode',
      'Verify simplified UI',
      'Check background changes',
      'Test toggle back to normal'
    ]
  },

  // Cross-Brand Leakage Audit
  {
    id: 'brand-001',
    category: 'brand-isolation',
    title: 'No brand name leakage',
    description: 'Verify only correct brand appears throughout',
    priority: 'critical',
    tested: false,
    testSteps: [
      'Load portal for Brand A',
      'Inspect all text content',
      'Search page source for other brand names',
      'Verify isolation in all sections'
    ]
  },
  {
    id: 'brand-002',
    category: 'brand-isolation',
    title: 'Export filenames are brand-specific',
    description: 'Each export contains only correct brand',
    priority: 'critical',
    tested: false,
    testSteps: [
      'Export from Brand A portal',
      'Check filename contains "brand-a"',
      'Export from Brand B portal',
      'Verify filename contains "brand-b"',
      'Ensure no cross-contamination'
    ]
  },
  {
    id: 'brand-003',
    category: 'brand-isolation',
    title: 'Data source views are isolated',
    description: 'SourceView annotations reference correct brand',
    priority: 'high',
    tested: false,
    testSteps: [
      'Check all sourceView values',
      'Verify they reference reporting_amazon.client_* views',
      'Confirm no internal-only data leaks to client portal'
    ]
  },

  // Mobile Fit Pass
  {
    id: 'mobile-001',
    category: 'mobile',
    title: 'Overview section mobile responsive',
    description: 'Hero section stacks properly on mobile',
    priority: 'high',
    tested: false,
    testSteps: [
      'Open portal on mobile device or resize to 375px',
      'Verify hero section readable',
      'Check "Performance at a glance" card stacks below',
      'Test all buttons are tappable (44px min)'
    ]
  },
  {
    id: 'mobile-002',
    category: 'mobile',
    title: 'KPI wall stacks on mobile',
    description: 'KPI cards display in single column',
    priority: 'high',
    tested: false,
    testSteps: [
      'View KPI section on mobile',
      'Verify single column layout',
      'Check cards are readable',
      'Test touch targets'
    ]
  },
  {
    id: 'mobile-003',
    category: 'mobile',
    title: 'Chart overflow handling',
    description: 'Charts scroll horizontally on small screens',
    priority: 'high',
    tested: false,
    testSteps: [
      'View trend chart on mobile',
      'Verify horizontal scroll works',
      'Check scroll indicator/shadow visible',
      'Test chart remains functional'
    ]
  },
  {
    id: 'mobile-004',
    category: 'mobile',
    title: 'Commentary cards stack properly',
    description: 'Growth drivers and risks single-column on mobile',
    priority: 'medium',
    tested: false,
    testSteps: [
      'Check growth drivers on mobile',
      'Verify single column layout',
      'Test risks section stacking',
      'Confirm readability maintained'
    ]
  },
  {
    id: 'mobile-005',
    category: 'mobile',
    title: 'Review mode mobile compatibility',
    description: 'Review mode works on mobile devices',
    priority: 'medium',
    tested: false,
    testSteps: [
      'Enable review mode on mobile',
      'Check layout adjustments',
      'Verify export controls accessible',
      'Test print from mobile'
    ]
  },

  // UI/UX Polish
  {
    id: 'ux-001',
    category: 'ui-ux',
    title: 'Loading states implemented',
    description: 'Show appropriate loading indicators',
    priority: 'medium',
    tested: false,
    testSteps: [
      'Simulate slow data load',
      'Verify loading states display',
      'Check no flash of empty state',
      'Test skeleton screens if implemented'
    ]
  },
  {
    id: 'ux-002',
    category: 'ui-ux',
    title: 'Premium aesthetic maintained',
    description: 'Design quality meets brand standards',
    priority: 'high',
    tested: false,
    testSteps: [
      'Visual review of all sections',
      'Check spacing, typography, colors',
      'Verify consistent border radius',
      'Test shadow and gradient quality'
    ]
  },
  {
    id: 'ux-003',
    category: 'ui-ux',
    title: 'No console errors',
    description: 'Clean browser console in production',
    priority: 'high',
    tested: false,
    testSteps: [
      'Open DevTools console',
      'Load portal page',
      'Navigate through all sections',
      'Verify no errors or warnings'
    ]
  }
];

/**
 * Calculate checklist completion status
 */
export function getChecklistStatus(checklist: ChecklistItem[]) {
  const total = checklist.length;
  const tested = checklist.filter(item => item.tested).length;
  const passed = checklist.filter(item => item.passed === true).length;
  const failed = checklist.filter(item => item.tested && item.passed === false).length;
  
  const critical = checklist.filter(item => item.priority === 'critical');
  const criticalPassed = critical.filter(item => item.passed === true).length;
  
  const readyForPilot = critical.every(item => item.passed === true) && 
                        failed === 0 &&
                        tested / total >= 0.9; // 90% tested

  return {
    total,
    tested,
    passed,
    failed,
    untested: total - tested,
    critical: critical.length,
    criticalPassed,
    completionPercent: Math.round((tested / total) * 100),
    passRate: tested > 0 ? Math.round((passed / tested) * 100) : 0,
    readyForPilot
  };
}

/**
 * Group checklist by category
 */
export function groupChecklistByCategory(checklist: ChecklistItem[]) {
  return checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);
}
