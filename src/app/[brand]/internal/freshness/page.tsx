import { notFound } from 'next/navigation';
import { RenuvInternalFreshnessPage } from '@/components/renuv/internal-freshness-page';
import { fetchFreshnessSnapshot } from '@/lib/renuv-freshness.server';
import { isSupportedBrand } from '@/lib/renuv-routes';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  if (!isSupportedBrand(brand)) notFound();
  const snapshot = await fetchFreshnessSnapshot();
  return <RenuvInternalFreshnessPage snapshot={snapshot} brand={brand} />;
}
