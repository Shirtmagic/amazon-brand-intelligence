'use client';

import { RenuvClientPortalPage } from '@/components/renuv/client-portal-page';
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';
import { renuvClientPortalMock } from '@/lib/renuv-client-portal';

/**
 * Review Mode Route
 * 
 * Dedicated route for presentation/export mode.
 * Automatically activates review mode for clean PDF capture.
 * 
 * Usage:
 * /client/renuv/review - Full portal in review mode
 * 
 * Features:
 * - No navigation or interactive controls
 * - Print-optimized layout
 * - Clean page breaks
 * - Brand-scoped metadata
 */
export default function ClientRenuvReviewRoute() {
  return (
    <ReviewModeWrapper
      isActive={true}
      exportConfig={{
        brand: renuvClientPortalMock.brand,
        periodLabel: renuvClientPortalMock.periodLabel,
        reportType: 'performance-report'
      }}
    >
      <RenuvClientPortalPage snapshot={renuvClientPortalMock} hideControls={true} />
    </ReviewModeWrapper>
  );
}
