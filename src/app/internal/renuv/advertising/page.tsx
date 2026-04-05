import { RenuvInternalAdvertisingPage } from '@/components/renuv/internal-advertising-page';
import { fetchAdvertisingSnapshot } from '@/lib/renuv-advertising.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvAdvertisingRoute({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchAdvertisingSnapshot(from, to);
  return <RenuvInternalAdvertisingPage snapshot={snapshot} />;
}
