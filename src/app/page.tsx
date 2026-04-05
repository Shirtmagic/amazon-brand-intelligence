import { getDashboardSnapshot } from '@/lib/mission-control';
import { listAvailableModels } from '@/lib/mission-control-store';
import { DashboardShell } from '@/components/mission-control/dashboard-shell';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [availableModels, snapshot] = await Promise.all([
    listAvailableModels(),
    getDashboardSnapshot()
  ]);

  return <DashboardShell initialSnapshot={snapshot} availableModels={availableModels} />;
}
