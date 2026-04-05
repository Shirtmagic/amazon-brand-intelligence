import { RenuvAlertsPage } from '@/components/renuv/alerts-page';
import { fetchAlertsSnapshot } from '@/lib/renuv-alerts.server';
import { getDateRange } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvAlertsRoute({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams;
  const { from, to } = getDateRange(params);
  const snapshot = await fetchAlertsSnapshot(from, to);
  return <RenuvAlertsPage snapshot={snapshot} />;
}
