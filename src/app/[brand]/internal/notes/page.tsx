import { notFound } from 'next/navigation';
import { RenuvInternalNotesPage } from '@/components/renuv/internal-notes-page';
import { fetchNotesSnapshot } from '@/lib/renuv-notes.server';
import { isSupportedBrand } from '@/lib/renuv-routes';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  if (!isSupportedBrand(brand)) notFound();
  const snapshot = await fetchNotesSnapshot();
  return <RenuvInternalNotesPage snapshot={snapshot} brand={brand} />;
}
