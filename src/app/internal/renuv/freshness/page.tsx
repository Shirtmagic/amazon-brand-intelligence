import { RenuvInternalFreshnessPage } from '@/components/renuv/internal-freshness-page';
import { fetchFreshnessSnapshot } from '@/lib/renuv-freshness.server';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvFreshnessRoute() {
  const snapshot = await fetchFreshnessSnapshot();
  return <RenuvInternalFreshnessPage snapshot={snapshot} />;
}
