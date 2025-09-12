export interface MemorySnapshot {
  readonly usedJSHeapSize: number;
  readonly totalJSHeapSize: number;
  readonly jsHeapSizeLimit: number;
  readonly timestamp: number; // ms
}

function getNowMs(): number {
  try {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  } catch {
    return Date.now();
  }
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

function hasMemory(obj: object): obj is { memory: unknown } {
  return 'memory' in obj;
}

function isPerformanceMemory(value: unknown): value is PerformanceMemory {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.usedJSHeapSize === 'number' &&
    typeof v.totalJSHeapSize === 'number' &&
    typeof v.jsHeapSizeLimit === 'number'
  );
}

function getPerformanceMemory(): PerformanceMemory | null {
  try {
    const p = (globalThis as { performance?: unknown }).performance;
    if (typeof p === 'object' && p !== null && hasMemory(p) && isPerformanceMemory(p.memory)) {
      return p.memory;
    }
  } catch {
    // ignore
  }
  return null;
}

export function isMemoryProfilingSupported(): boolean {
  return getPerformanceMemory() !== null;
}

export function takeMemorySnapshot(): MemorySnapshot | null {
  const mem = getPerformanceMemory();
  if (!mem) return null;
  const used = Number(mem.usedJSHeapSize);
  const total = Number(mem.totalJSHeapSize);
  const limit = Number(mem.jsHeapSizeLimit);
  return {
    usedJSHeapSize: used,
    totalJSHeapSize: total,
    jsHeapSizeLimit: limit,
    timestamp: getNowMs(),
  };
}

export interface MemoryProfileResult {
  readonly start: MemorySnapshot;
  readonly end: MemorySnapshot;
  readonly delta: {
    readonly usedJSHeapSize: number;
    readonly totalJSHeapSize: number;
  };
  readonly durationMs: number;
}

export class MemoryProfiler {
  private _start: MemorySnapshot | null = null;

  start(): boolean {
    const snap = takeMemorySnapshot();
    if (!snap) return false;
    this._start = snap;
    return true;
  }

  stop(): MemoryProfileResult | null {
    if (!this._start) return null;
    const end = takeMemorySnapshot();
    if (!end) {
      // reset and return null if environment changed
      this._start = null;
      return null;
    }
    const start = this._start;
    this._start = null;
    return {
      start,
      end,
      delta: {
        usedJSHeapSize: Math.max(0, end.usedJSHeapSize - start.usedJSHeapSize),
        totalJSHeapSize: Math.max(0, end.totalJSHeapSize - start.totalJSHeapSize),
      },
      durationMs: Math.max(0, end.timestamp - start.timestamp),
    };
  }

  async measure<T>(fn: () => Promise<T> | T): Promise<MemoryProfileResult> {
    const started = this.start();
    try {
      // execute the function (result intentionally unused here)
      await fn();
      // Ensure stop even on success
      const prof = this.stop();
      if (!started || !prof) {
        // Return a synthetic zero result when unsupported
        const snap = takeMemorySnapshot();
        const zero: MemorySnapshot = snap ?? {
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
          timestamp: getNowMs(),
        };
        return {
          start: zero,
          end: zero,
          delta: { usedJSHeapSize: 0, totalJSHeapSize: 0 },
          durationMs: 0,
        };
      }
      return prof;
    } catch (err) {
      // Stop and rethrow
      this.stop();
      throw err;
    }
  }
}
