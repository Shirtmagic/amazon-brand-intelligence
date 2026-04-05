import { SearchDetail } from '@/components/renuv/search-detail';
import { fetchSearchSnapshot } from '@/lib/renuv-search.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function ClientRenuvSearchPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchSearchSnapshot(from, to);
  return <SearchDetail snapshot={snapshot} />;
}
