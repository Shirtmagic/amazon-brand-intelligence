import { CompetitorIntelligenceSection } from '@/components/renuv/competitor-intelligence';
import { fetchCompetitorIntelligence } from '@/lib/renuv-competitors.server';

export const dynamic = 'force-dynamic';

export default async function CompetitorsRoute() {
  const data = await fetchCompetitorIntelligence();

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-[var(--ink-500)]">
        <span>Mission Control</span>
        <span className="mx-1.5">›</span>
        <span>Internal</span>
        <span className="mx-1.5">›</span>
        <span>Renuv</span>
        <span className="mx-1.5">›</span>
        <span className="font-semibold text-[var(--ink-900)]">Competitor Intelligence</span>
      </nav>

      <CompetitorIntelligenceSection data={data} />
    </div>
  );
}
