import { notFound } from 'next/navigation';
import { RenuvInternalOverviewPage } from '@/components/renuv/internal-overview-page';
import { fetchOverviewSnapshot } from '@/lib/renuv-overview.server';
import { getDateRange } from '@/lib/date-utils';
import { isSupportedBrand } from '@/lib/renuv-routes';

export const dynamic = 'force-dynamic';

export default async function BrandInternalOverviewRoute({ params, searchParams }: { params: Promise<{ brand: string }>; searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const { brand } = await params;
  if (!isSupportedBrand(brand)) notFound();
  const sp = await searchParams;
  const { from, to } = getDateRange(sp);
  const snapshot = await fetchOverviewSnapshot(from, to);
  return <RenuvInternalOverviewPage snapshot={snapshot} brand={brand} />;
}
