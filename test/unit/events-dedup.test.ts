import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addListener, removeEventListenerManaged } from '@shared/utils/events';

// Simple mock EventTarget-like object
function createMockTarget() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as any;
}

describe('events.ts de-duplication', () => {
  beforeEach(() => {
    // reset internal state via exposed API if any test mutated it
    // There is no explicit reset, but each test uses fresh mock targets and unique listeners
  });

  it('dedups identical registrations and refcounts removals', () => {
    const target = createMockTarget();
    const handler = (() => {}) as any;
    const opts = { capture: true, passive: false } as any;

    const id1 = addListener(target, 'scroll', handler, opts, 'test');
    const id2 = addListener(target, 'scroll', handler, opts, 'test');

    // addEventListener should be called only once
    expect((target as any).addEventListener).toHaveBeenCalledTimes(1);

    // Removing first id should NOT call removeEventListener yet
    const removed1 = removeEventListenerManaged(id1);
    expect(removed1).toBe(true);
    expect((target as any).removeEventListener).toHaveBeenCalledTimes(0);

    // Removing second id should call removeEventListener once
    const removed2 = removeEventListenerManaged(id2);
    expect(removed2).toBe(true);
    expect((target as any).removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('does not dedup when options differ', () => {
    const target = createMockTarget();
    const handler = (() => {}) as any;

    const id1 = addListener(target, 'scroll', handler, { capture: true }, 'test');
    const id2 = addListener(target, 'scroll', handler, { capture: false }, 'test');

    expect((target as any).addEventListener).toHaveBeenCalledTimes(2);

    removeEventListenerManaged(id1);
    // Options differ -> distinct registrations, so one removal should occur now
    expect((target as any).removeEventListener).toHaveBeenCalledTimes(1);

    removeEventListenerManaged(id2);
    expect((target as any).removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('does not dedup when AbortSignal differs', () => {
    const target = createMockTarget();
    const handler = (() => {}) as any;

    const controller1 = new (globalThis as any).AbortController();
    const controller2 = new (globalThis as any).AbortController();

    const id1 = addListener(target, 'scroll', handler, { signal: controller1.signal }, 'test');
    const id2 = addListener(target, 'scroll', handler, { signal: controller2.signal }, 'test');

    expect((target as any).addEventListener).toHaveBeenCalledTimes(2);

    controller1.abort();
    // After abort of first, removal should be called once
    expect((target as any).removeEventListener).toHaveBeenCalledTimes(1);

    controller2.abort();
    expect((target as any).removeEventListener).toHaveBeenCalledTimes(2);

    // removing by id should now be no-op
    expect(removeEventListenerManaged(id1)).toBe(false);
    expect(removeEventListenerManaged(id2)).toBe(false);
  });

  it('skips pre-aborted signal registration', () => {
    const target = createMockTarget();
    const handler = (() => {}) as any;

    const controller = new (globalThis as any).AbortController();
    controller.abort();

    const id = addListener(target, 'scroll', handler, { signal: controller.signal }, 'test');

    expect((target as any).addEventListener).not.toHaveBeenCalled();

    // Removing should return false since it was never registered
    expect(removeEventListenerManaged(id)).toBe(false);
  });
});
