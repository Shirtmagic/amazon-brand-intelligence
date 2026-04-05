import { PerformanceDetail } from '@/components/renuv/performance-detail';
import { fetchPerformanceSnapshot } from '@/lib/renuv-performance.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function ClientRenuvPerformancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchPerformanceSnapshot(from, to);
  return <PerformanceDetail snapshot={snapshot} />;
}
