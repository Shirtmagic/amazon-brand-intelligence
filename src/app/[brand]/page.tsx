import { notFound, redirect } from 'next/navigation';
import { isSupportedBrand } from '@/lib/renuv-routes';

export default async function BrandEntry({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  if (!isSupportedBrand(brand)) notFound();
  redirect(`/${brand}/internal`);
}
