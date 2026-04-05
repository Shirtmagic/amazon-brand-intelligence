/**
 * Shared dashboard snapshot cache.
 *
 * Extracted into its own module to avoid circular imports between
 * mission-control.ts (reads) and mission-control-store.ts (writes).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let snapshotCache: { data: any; fetchedAt: number } | null = null;

export const SNAPSHOT_CACHE_TTL_MS = 15_000; // 15 seconds

export function getCachedSnapshot() {
  if (snapshotCache && (Date.now() - snapshotCache.fetchedAt) < SNAPSHOT_CACHE_TTL_MS) {
    return snapshotCache.data;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setCachedSnapshot(data: any) {
  snapshotCache = { data, fetchedAt: Date.now() };
}

export function invalidateDashboardCache() {
  snapshotCache = null;
}
