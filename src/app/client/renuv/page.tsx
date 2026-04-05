import { RenuvClientPortalPage } from '@/components/renuv/client-portal-page';
import { fetchClientPortalSnapshot } from '@/lib/renuv-client-portal.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function ClientRenuvPortalRoute({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchClientPortalSnapshot(from, to);
  return <RenuvClientPortalPage snapshot={snapshot} />;
}
