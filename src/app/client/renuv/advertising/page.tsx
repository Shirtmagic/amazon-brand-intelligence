import { AdvertisingDetail } from '@/components/renuv/advertising-detail';
import { fetchAdvertisingSnapshot } from '@/lib/renuv-advertising.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function ClientRenuvAdvertisingPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchAdvertisingSnapshot(from, to);
  return <AdvertisingDetail snapshot={snapshot} />;
}
