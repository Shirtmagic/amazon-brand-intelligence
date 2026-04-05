import { notFound } from 'next/navigation';
import { RenuvClientPortalPage } from '@/components/renuv/client-portal-page';
import { fetchClientPortalSnapshot } from '@/lib/renuv-client-portal.server';
import { getDateRange } from '@/lib/date-utils';
import { isSupportedBrand } from '@/lib/renuv-routes';

export const dynamic = 'force-dynamic';

export default async function Page({ params, searchParams }: { params: Promise<{ brand: string }>; searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const { brand } = await params;
  if (!isSupportedBrand(brand)) notFound();
  const sp = await searchParams;
  const { from, to } = getDateRange(sp);
  const snapshot = await fetchClientPortalSnapshot(from, to);
  return <RenuvClientPortalPage snapshot={snapshot} brand={brand} />;
}
