import { RenuvInternalNotesPage } from '@/components/renuv/internal-notes-page';
import { fetchNotesSnapshot } from '@/lib/renuv-notes.server';

export const dynamic = 'force-dynamic';

export default async function InternalRenuvNotesRoute() {
  const snapshot = await fetchNotesSnapshot();
  return <RenuvInternalNotesPage snapshot={snapshot} />;
}
