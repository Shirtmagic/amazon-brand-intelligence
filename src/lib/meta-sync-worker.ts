/**
 * Background Meta sync worker.
 *
 * Runs `syncFacebookCommentApprovals()` on a fixed interval so that
 * dashboard reads never trigger a live Meta Graph crawl.  The worker
 * caches the last successful connection status for cheap reads.
 */

import { syncFacebookCommentApprovals } from '@/lib/mission-control-store';
import { getMetaConnectionStatus } from '@/lib/meta-facebook';
import type { MetaConnectionStatus } from '@/lib/meta-facebook';
import { invalidateDashboardCache } from '@/lib/dashboard-cache';

const SYNC_INTERVAL_MS = 90_000; // 90 seconds — matches prior Meta cache TTL
const FIRST_SYNC_TIMEOUT_MS = 12_000; // max wait for first sync before falling back

let lastConnection: MetaConnectionStatus | null = null;
let lastSyncedAt: number = 0;
let syncInFlight: Promise<void> | null = null;
let intervalHandle: ReturnType<typeof setInterval> | null = null;

// Resolved once the very first sync completes (success or failure).
let firstSyncDone = false;
let firstSyncResolve: (() => void) | null = null;
const firstSyncPromise = new Promise<void>(resolve => {
  firstSyncResolve = resolve;
});

async function runSync() {
  const isFirstSync = !firstSyncDone;
  try {
    const result = await syncFacebookCommentApprovals();
    lastConnection = result.connection;
    lastSyncedAt = Date.now();
  } catch (err) {
    // Log but don't crash — the dashboard will use stale data gracefully.
    console.error('[meta-sync-worker] background sync failed:', err);
    // Even on failure, try to populate connection status so the dashboard
    // doesn't stay stuck on the "warming up" fallback with posting blocked.
    if (!lastConnection) {
      try {
        lastConnection = await getMetaConnectionStatus();
        lastSyncedAt = Date.now();
      } catch { /* best-effort */ }
    }
  } finally {
    if (isFirstSync) {
      firstSyncDone = true;
      firstSyncResolve?.();
      // Flush stale dashboard snapshot so the next request picks up the real
      // connection status instead of serving a cached warmup fallback.
      invalidateDashboardCache();
    }
  }
}

function tick() {
  if (syncInFlight) return; // skip if previous tick is still running
  syncInFlight = runSync().finally(() => {
    syncInFlight = null;
  });
}

/** Start the background interval (idempotent). */
export function ensureMetaSyncWorker() {
  if (intervalHandle) return;
  // Fire immediately on first call, then repeat on interval.
  tick();
  intervalHandle = setInterval(tick, SYNC_INTERVAL_MS);
  // Allow the Node process to exit even if the interval is still scheduled.
  if (intervalHandle && typeof intervalHandle === 'object' && 'unref' in intervalHandle) {
    intervalHandle.unref();
  }
}

/**
 * Wait for the first background sync to finish (or timeout).
 * This lets the dashboard avoid the "sync has not completed" fallback on
 * cold start by giving the worker a chance to warm before reading state.
 */
export async function waitForFirstSync(): Promise<void> {
  if (firstSyncDone) return;
  await Promise.race([
    firstSyncPromise,
    new Promise<void>(resolve => setTimeout(resolve, FIRST_SYNC_TIMEOUT_MS)),
  ]);
}

/** Return the last connection status from a background sync, or null if none yet. */
export function getLastMetaConnection(): MetaConnectionStatus | null {
  return lastConnection;
}

/** Epoch ms of the last successful background sync (0 = never). */
export function getLastMetaSyncedAt(): number {
  return lastSyncedAt;
}

/**
 * Update the cached connection after a write-path sync so the next
 * dashboard read sees fresh data without waiting for the next tick.
 */
export function setLastMetaConnection(connection: MetaConnectionStatus) {
  lastConnection = connection;
  lastSyncedAt = Date.now();
}
