import { RecommendationsDetail } from '@/components/renuv/recommendations-detail';
import { fetchRecommendationsSnapshot } from '@/lib/renuv-recommendations.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function ClientRenuvRecommendationsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchRecommendationsSnapshot(from, to);
  return <RecommendationsDetail snapshot={snapshot} />;
}
