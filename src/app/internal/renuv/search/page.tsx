import { RenuvInternalSearchPage } from '@/components/renuv/internal-search-page';
import { fetchSearchSnapshot } from '@/lib/renuv-search.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvSearchRoute({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchSearchSnapshot(from, to);
  return <RenuvInternalSearchPage snapshot={snapshot} />;
}
