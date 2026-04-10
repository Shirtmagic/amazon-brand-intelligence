import {
  fetchCompetitiveTrackerData,
  DEFAULT_TRACKED_KEYWORDS,
} from '@/lib/renuv-competitive-tracker.server';
import { RenuvInternalCompetitiveTrackerPage } from '@/components/renuv/internal-competitive-tracker-page';

export const dynamic = 'force-dynamic';

/**
 * /internal/renuv/competitive-tracker
 *
 * Unified replacement for the old "Keyword Tracker" and
 * "Competitor Intelligence" tabs. Server-renders with the
 * default tracked keyword list; the client component then
 * reads the user's saved list from localStorage on mount
 * and refetches if it differs.
 */
export default async function CompetitiveTrackerRoute() {
  const data = await fetchCompetitiveTrackerData(DEFAULT_TRACKED_KEYWORDS);
  return (
    <RenuvInternalCompetitiveTrackerPage
      initialData={data}
      defaultKeywords={DEFAULT_TRACKED_KEYWORDS}
    />
  );
}
