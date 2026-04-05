import { RenuvInternalTrafficConversionPage } from '@/components/renuv/internal-traffic-conversion-page';
import { fetchTrafficSnapshot } from '@/lib/renuv-traffic-conversion.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvTrafficConversionRoute({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchTrafficSnapshot(from, to);
  return <RenuvInternalTrafficConversionPage snapshot={snapshot} />;
}
