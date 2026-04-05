import { notFound } from 'next/navigation';
import { RenuvAlertsPage } from '@/components/renuv/alerts-page';
import { fetchAlertsSnapshot } from '@/lib/renuv-alerts.server';
import { getDateRange } from '@/lib/date-utils';
import { isSupportedBrand } from '@/lib/renuv-routes';

export const dynamic = 'force-dynamic';

export default async function Page({ params, searchParams }: { params: Promise<{ brand: string }>; searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const { brand } = await params;
  if (!isSupportedBrand(brand)) notFound();
  const sp = await searchParams;
  const { from, to } = getDateRange(sp);
  const snapshot = await fetchAlertsSnapshot(from, to);
  return <RenuvAlertsPage snapshot={snapshot} brand={brand} />;
}
