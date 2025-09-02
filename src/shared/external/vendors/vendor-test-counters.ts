/**
 * @fileoverview Optional vendor test counters instrumentation
 * @description Separated from barrel to satisfy barrel export purity rules.
 */

export interface VendorTestCounters {
  incrementBatch(): void;
  incrementSignal(): void;
  incrementEffect(): void;
  getBatchCallCount(): number;
  getSignalUpdateCount(): number;
  getEffectExecutionCount(): number;
  resetCounters(): void;
}

/*#__PURE__*/
export function createOptionalTestCounters(): VendorTestCounters | undefined {
  const g = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
  if (!(g as Record<string, unknown>).__XEG_ENABLE_VENDOR_COUNTERS__) return undefined;
  let batchCallCount = 0;
  let signalUpdateCount = 0;
  let effectExecutionCount = 0;
  const counters: VendorTestCounters = {
    incrementBatch() {
      batchCallCount++;
    },
    incrementSignal() {
      signalUpdateCount++;
    },
    incrementEffect() {
      effectExecutionCount++;
    },
    getBatchCallCount() {
      return batchCallCount;
    },
    getSignalUpdateCount() {
      return signalUpdateCount;
    },
    getEffectExecutionCount() {
      return effectExecutionCount;
    },
    resetCounters() {
      batchCallCount = 0;
      signalUpdateCount = 0;
      effectExecutionCount = 0;
    },
  };
  (g as Record<string, unknown>).__XEG_VENDOR_COUNTERS__ = counters;
  return counters;
}

// Lazy accessor to allow enabling flag before first retrieval
let cachedCounters: VendorTestCounters | undefined = createOptionalTestCounters();
export function getVendorTestCounters(): VendorTestCounters | undefined {
  if (!cachedCounters) {
    cachedCounters = createOptionalTestCounters();
  }
  return cachedCounters;
}
// Explicit reset helper for test convenience
export function resetVendorTestCounters(): void {
  const c = getVendorTestCounters();
  c?.resetCounters();
}
// Backward export name for direct import (may be undefined if flag disabled)
export const vendorTestCounters = cachedCounters;
