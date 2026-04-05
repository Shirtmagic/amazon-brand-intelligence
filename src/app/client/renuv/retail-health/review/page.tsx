'use client';

import { RetailHealthDetail } from '@/components/renuv/retail-health-detail';
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';
import { renuvRetailHealthMock } from '@/lib/renuv-retail-health';

export default function RetailHealthReviewRoute() {
  return (
    <ReviewModeWrapper
      isActive={true}
      exportConfig={{
        brand: renuvRetailHealthMock.brand,
        periodLabel: renuvRetailHealthMock.periodLabel,
        reportType: 'Retail-Health-Detail'
      }}
    >
      <RetailHealthDetail snapshot={renuvRetailHealthMock} />
    </ReviewModeWrapper>
  );
}
