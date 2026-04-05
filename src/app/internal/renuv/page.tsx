import { RenuvInternalOverviewPage } from '@/components/renuv/internal-overview-page';
import { fetchOverviewSnapshot } from '@/lib/renuv-overview.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvOverviewRoute({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchOverviewSnapshot(from, to);
  return <RenuvInternalOverviewPage snapshot={snapshot} />;
}
