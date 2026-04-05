import { RecommendationsDetail } from '@/components/renuv/recommendations-detail';
import { ReviewModeWrapper } from '@/components/renuv/review-mode-wrapper';
import { fetchRecommendationsSnapshot } from '@/lib/renuv-recommendations.server';

export const dynamic = 'force-dynamic';

export default async function RecommendationsReviewRoute() {
  const snapshot = await fetchRecommendationsSnapshot();
  
  return (
    <ReviewModeWrapper
      isActive={true}
      exportConfig={{
        brand: snapshot.brand,
        periodLabel: snapshot.periodLabel,
        reportType: 'Recommendations'
      }}
    >
      <RecommendationsDetail snapshot={snapshot} />
    </ReviewModeWrapper>
  );
}
