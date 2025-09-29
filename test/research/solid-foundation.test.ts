import { describe, expect, it, vi } from 'vitest';

import { createGlobalSignal } from '@shared/state/createGlobalSignal';

describe('research/solid-foundation — createGlobalSignal', () => {
  it('provides a Solid accessor that reflects the latest value', () => {
    const signal = createGlobalSignal(1);

    expect(signal.accessor()).toBe(1);

    signal.value = 42;
    expect(signal.accessor()).toBe(42);

    signal.update(previous => previous - 10);
    expect(signal.accessor()).toBe(32);
  });

  it('notifies subscribers when the value changes', () => {
    const signal = createGlobalSignal(0);
    const listener = vi.fn();

    const unsubscribe = signal.subscribe(listener);

    signal.value = 1;
    signal.update(value => value + 4);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, 1);
    expect(listener).toHaveBeenNthCalledWith(2, 5);

    unsubscribe();
    signal.value = 10;
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stops notifying subscribers after dispose is called', () => {
    const signal = createGlobalSignal(5);
    const listener = vi.fn();

    const unsubscribe = signal.subscribe(listener);
    signal.value = 7;
    expect(listener).toHaveBeenCalledTimes(1);

    signal.dispose();
    unsubscribe();

    signal.value = 9;
    expect(signal.accessor()).toBe(9);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
