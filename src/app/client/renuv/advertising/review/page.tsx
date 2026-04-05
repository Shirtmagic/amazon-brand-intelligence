'use client';

import { AdvertisingDetail } from '@/components/renuv/advertising-detail';
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';
import { renuvAdvertisingMock } from '@/lib/renuv-advertising';

export default function AdvertisingReviewRoute() {
  return (
    <ReviewModeWrapper
      isActive={true}
      exportConfig={{
        brand: renuvAdvertisingMock.brand,
        periodLabel: renuvAdvertisingMock.periodLabel,
        reportType: 'Advertising-Detail'
      }}
    >
      <AdvertisingDetail snapshot={renuvAdvertisingMock} />
    </ReviewModeWrapper>
  );
}
