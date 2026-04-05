'use client';

import { PerformanceDetail } from '@/components/renuv/performance-detail';
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';
import { renuvPerformanceMock } from '@/lib/renuv-performance';

export default function PerformanceReviewRoute() {
  return (
    <ReviewModeWrapper
      isActive={true}
      exportConfig={{
        brand: renuvPerformanceMock.brand,
        periodLabel: renuvPerformanceMock.periodLabel,
        reportType: 'Performance-Detail'
      }}
    >
      <PerformanceDetail snapshot={renuvPerformanceMock} />
    </ReviewModeWrapper>
  );
}
