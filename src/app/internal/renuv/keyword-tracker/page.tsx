import { fetchKeywordTrackerData, DEFAULT_TRACKED_KEYWORDS } from '@/lib/renuv-keyword-tracker.server';
import { KeywordTrackerPageClient } from './client';

export const dynamic = 'force-dynamic';

export default async function KeywordTrackerPage() {
  // Server-side: fetch with default keywords for initial render.
  // Client will load saved keywords from localStorage and re-fetch if different.
  const data = await fetchKeywordTrackerData(DEFAULT_TRACKED_KEYWORDS);
  return (
    <KeywordTrackerPageClient
      initialData={data}
      defaultKeywords={DEFAULT_TRACKED_KEYWORDS}
    />
  );
}
