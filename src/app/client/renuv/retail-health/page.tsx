import { RetailHealthDetail } from '@/components/renuv/retail-health-detail';
import { fetchRetailHealthSnapshot } from '@/lib/renuv-retail-health.server';

export const dynamic = 'force-dynamic';

export default async function ClientRenuvRetailHealthPage() {
  const snapshot = await fetchRetailHealthSnapshot();
  return <RetailHealthDetail snapshot={snapshot} />;
}
