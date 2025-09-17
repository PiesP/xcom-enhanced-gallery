import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollEventHub, ScrollEventHub } from '@/shared/utils/scroll/ScrollEventHub';

describe('ScrollEventHub — contract', () => {
  let hub: ScrollEventHub;

  beforeEach(() => {
    hub = new ScrollEventHub();
  });

  afterEach(() => {
    // No global cleanup necessary; each test cancels its own subscriptions
  });

  it('idempotent subscriptions: duplicate subscribe does not add duplicate DOM listener', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const addSpy = vi.spyOn(el, 'addEventListener');
    const removeSpy = vi.spyOn(el, 'removeEventListener');

    function onScroll(_e: unknown) {}

    const h1 = hub.subscribe({ target: el, type: 'scroll' }, onScroll, {
      passive: true,
      capture: false,
      context: 'test.scroll',
    });
    const h2 = hub.subscribe({ target: el, type: 'scroll' }, onScroll, {
      passive: true,
      capture: false,
      context: 'test.scroll',
    });

    // Same handle object should be returned (idempotent)
    expect(h2).toBe(h1);
    // Underlying DOM addEventListener should be called only once
    expect(addSpy).toHaveBeenCalledTimes(1);

    // Cancel once should remove exactly once
    h1.cancel();
    expect(removeSpy).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('wheel lock: handler returning true prevents default; false does not', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const addSpy = vi.spyOn(el, 'addEventListener');

    // Always consume
    const hLock = hub.subscribeWheelLock(el, () => true, { context: 'test.wheel' });

    // Should be registered with passive:false and capture:true
    expect(addSpy).toHaveBeenCalled();
    const call = addSpy.mock.calls.find(c => c[0] === 'wheel');
    expect(call).toBeTruthy();
    const opts = call?.[2] as any;
    expect(opts?.passive).toBe(false);
    expect(opts?.capture).toBe(true);

    const evt1 = new window.WheelEvent('wheel', { deltaY: 100, cancelable: true });
    el.dispatchEvent(evt1);
    expect(evt1.defaultPrevented).toBe(true);

    // Now a non-consuming lock
    hLock.cancel();
    const hNoLock = hub.subscribeWheelLock(el, () => false, { context: 'test.wheel' });
    const evt2 = new window.WheelEvent('wheel', { deltaY: -100, cancelable: true });
    el.dispatchEvent(evt2);
    expect(evt2.defaultPrevented).toBe(false);

    hNoLock.cancel();
    addSpy.mockRestore();
  });
});
