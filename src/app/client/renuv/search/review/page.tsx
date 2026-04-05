'use client';

import { SearchDetail } from '@/components/renuv/search-detail';
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';
import { renuvSearchMock } from '@/lib/renuv-search';

export default function SearchReviewRoute() {
  return (
    <ReviewModeWrapper
      isActive={true}
      exportConfig={{
        brand: renuvSearchMock.brand,
        periodLabel: renuvSearchMock.periodLabel,
        reportType: 'Search-Detail'
      }}
    >
      <SearchDetail snapshot={renuvSearchMock} />
    </ReviewModeWrapper>
  );
}
