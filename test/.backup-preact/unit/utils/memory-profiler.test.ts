import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isMemoryProfilingSupported,
  takeMemorySnapshot,
  MemoryProfiler,
} from '@/shared/utils/memory';

// Helper to patch/unpatch performance.memory
function setPerformanceMemory(
  mem:
    | Partial<{
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }>
    | undefined
) {
  const perf: any = globalThis.performance as any;
  if (!perf) return;
  if (mem === undefined) {
    if (perf.memory !== undefined) {
      try {
        delete perf.memory;
      } catch {
        perf.memory = undefined;
      }
    }
    return;
  }
  perf.memory = {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    ...mem,
  };
}

describe('MemoryProfiler utility', () => {
  beforeEach(() => {
    // reset any previous patch
    setPerformanceMemory(undefined);
    vi.useRealTimers();
  });

  it('returns noop on unsupported environments', () => {
    setPerformanceMemory(undefined);

    expect(isMemoryProfilingSupported()).toBe(false);
    expect(takeMemorySnapshot()).toBeNull();

    const profiler = new MemoryProfiler();
    expect(profiler.start()).toBe(false);
    expect(profiler.stop()).toBeNull();
  });

  it('takes snapshot when performance.memory is available', () => {
    setPerformanceMemory({
      usedJSHeapSize: 1_000_000,
      totalJSHeapSize: 2_000_000,
      jsHeapSizeLimit: 4_000_000,
    });

    expect(isMemoryProfilingSupported()).toBe(true);
    const snap = takeMemorySnapshot();
    expect(snap).not.toBeNull();
    expect(snap!).toMatchObject({
      usedJSHeapSize: expect.any(Number),
      totalJSHeapSize: expect.any(Number),
      jsHeapSizeLimit: expect.any(Number),
      timestamp: expect.any(Number),
    });
  });

  it('profiles delta between start and stop', () => {
    // start values
    setPerformanceMemory({
      usedJSHeapSize: 1_000_000,
      totalJSHeapSize: 2_000_000,
      jsHeapSizeLimit: 4_000_000,
    });

    const profiler = new MemoryProfiler();
    expect(profiler.start()).toBe(true);

    // simulate growth before stop
    setPerformanceMemory({
      usedJSHeapSize: 1_500_000,
      totalJSHeapSize: 2_100_000,
      jsHeapSizeLimit: 4_000_000,
    });

    const result = profiler.stop();
    expect(result).not.toBeNull();
    expect(result!.delta.usedJSHeapSize).toBe(500_000);
    expect(result!.delta.totalJSHeapSize).toBe(100_000);
    expect(result!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('measure(fn) rethrows on error but ensures stop is executed', async () => {
    setPerformanceMemory({
      usedJSHeapSize: 1_000_000,
      totalJSHeapSize: 2_000_000,
      jsHeapSizeLimit: 4_000_000,
    });

    const profiler = new MemoryProfiler();

    await expect(
      profiler.measure(async () => {
        setPerformanceMemory({
          usedJSHeapSize: 1_250_000,
          totalJSHeapSize: 2_050_000,
          jsHeapSizeLimit: 4_000_000,
        });
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    // After measure throws, profiler should already be stopped
    expect(profiler.stop()).toBeNull();
  });
});
