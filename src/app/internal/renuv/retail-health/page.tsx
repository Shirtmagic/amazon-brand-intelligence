import { RenuvInternalRetailHealthPage } from '@/components/renuv/internal-retail-health-page';
import { fetchRetailHealthSnapshot } from '@/lib/renuv-retail-health.server';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvRetailHealthRoute() {
  const snapshot = await fetchRetailHealthSnapshot();
  return <RenuvInternalRetailHealthPage snapshot={snapshot} />;
}
