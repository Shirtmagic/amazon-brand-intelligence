import { RenuvInternalAsinPerformancePage } from '@/components/renuv/internal-asin-performance-page';
import { fetchAsinPerformanceSnapshot } from '@/lib/renuv-asins.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvAsinPerformanceRoute({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  const params = await searchParams;
  const range = getDateRange(params);
  const snapshot = await fetchAsinPerformanceSnapshot(range.from, range.to);
  return <RenuvInternalAsinPerformancePage snapshot={snapshot} />;
}
