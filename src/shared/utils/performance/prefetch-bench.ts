/**
 * @fileoverview Prefetch benchmarking harness
 * @description Runs MediaService.prefetchNextMedia under different schedule modes and collects simple metrics.
 */
import { globalTimerManager } from '../timer-management';

export type PrefetchBenchMode = 'immediate' | 'idle' | 'raf' | 'microtask';

export interface PrefetchBenchConfig {
  readonly urls: readonly string[];
  readonly currentIndex: number;
  readonly prefetchRange?: number;
  readonly maxConcurrent?: number;
  readonly modes?: readonly PrefetchBenchMode[];
  /** Max time to wait for prefetch to settle per mode (ms). Default: 1000 */
  readonly timeoutMsPerMode?: number;
  /** Poll interval for settling checks (ms). Default: 5 */
  readonly pollIntervalMs?: number;
}

export interface PrefetchBenchEntry {
  readonly mode: PrefetchBenchMode;
  readonly elapsedMs: number;
  readonly cacheEntries: number;
  readonly hitRate?: number;
}

export interface PrefetchBenchReport {
  readonly entries: readonly PrefetchBenchEntry[];
  readonly bestMode: PrefetchBenchMode;
  readonly timestamp: number;
}

type MediaServiceLike = {
  prefetchNextMedia: (
    mediaItems: readonly string[],
    currentIndex: number,
    options: {
      prefetchRange?: number;
      maxConcurrent?: number;
      schedule?: PrefetchBenchMode;
    }
  ) => Promise<void>;
  getPrefetchMetrics: () => {
    cacheHits: number;
    cacheMisses: number;
    cacheEntries: number;
    hitRate: number;
    activePrefetches: number;
  };
  clearPrefetchCache: () => void;
  cancelAllPrefetch: () => void;
};

function expectedPrefetchCount(
  urls: readonly string[],
  currentIndex: number,
  range: number
): number {
  const total = Math.max(0, urls.length);
  const idx = Math.min(Math.max(0, Math.floor(currentIndex)), Math.max(0, total - 1));
  const possible = Math.max(0, total - 1 - idx);
  return Math.max(0, Math.min(Math.max(0, Math.floor(range)), possible));
}

async function waitUntil(
  check: () => boolean,
  timeoutMs: number,
  pollIntervalMs: number
): Promise<void> {
  const start = Date.now();
  while (true) {
    if (check()) return;
    if (Date.now() - start > timeoutMs) return; // timeboxed — report whatever we have
    await new Promise<void>(resolve =>
      globalTimerManager.setTimeout(() => resolve(), pollIntervalMs)
    );
  }
}

/**
 * Run a simple A/B benchmark for different prefetch scheduling modes.
 * Returns elapsed wall-clock time and resulting cache size per mode.
 */
export async function runPrefetchBench(
  svc: MediaServiceLike,
  cfg: PrefetchBenchConfig
): Promise<PrefetchBenchReport> {
  const {
    urls,
    currentIndex,
    prefetchRange = 2,
    maxConcurrent = 2,
    modes = ['raf', 'idle', 'microtask'],
    timeoutMsPerMode = 1000,
    pollIntervalMs = 5,
  } = cfg;

  const entries: PrefetchBenchEntry[] = [];
  const expectCount = expectedPrefetchCount(urls, currentIndex, prefetchRange);

  for (const mode of modes) {
    // reset state between runs
    svc.cancelAllPrefetch();
    svc.clearPrefetchCache();

    const t0 = Date.now();
    await svc.prefetchNextMedia(urls, currentIndex, {
      prefetchRange,
      maxConcurrent,
      schedule: mode,
    });

    // wait until the service reports idle or timeout reached
    await waitUntil(
      () => {
        const m = svc.getPrefetchMetrics();
        return m.activePrefetches === 0 && m.cacheEntries >= expectCount;
      },
      timeoutMsPerMode,
      pollIntervalMs
    );

    const t1 = Date.now();
    const m = svc.getPrefetchMetrics();
    entries.push({
      mode,
      elapsedMs: Math.max(0, t1 - t0),
      cacheEntries: m.cacheEntries,
      hitRate: m.hitRate,
    });
  }

  const best = entries.reduce<PrefetchBenchEntry | undefined>((acc, cur) => {
    if (!acc) return cur;
    return cur.elapsedMs < acc.elapsedMs ? cur : acc;
  }, undefined);
  const bestMode = best ? best.mode : (modes[0] ?? 'raf');
  return { entries, bestMode, timestamp: Date.now() };
}
