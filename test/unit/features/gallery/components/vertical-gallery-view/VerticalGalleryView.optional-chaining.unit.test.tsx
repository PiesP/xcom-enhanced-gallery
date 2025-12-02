import { describe, it, expect, vi } from 'vitest';
import { createSignal } from 'solid-js';

describe('optional chaining behavior for focusSyncCallback invocation', () => {
  it('should NOT throw when focusSyncCallback returns null', () => {
    const [focusSyncCallback] = createSignal<(() => void) | null>(null);
    const onScrollEnd = () => focusSyncCallback()?.();
    expect(() => onScrollEnd()).not.toThrow();
  });

  it('should call focus sync function when present', () => {
    const fn = vi.fn();
    const [focusSyncCallback, setFocusSyncCallback] = createSignal<(() => void) | null>(null);
    setFocusSyncCallback(fn);

    const onScrollEnd = () => focusSyncCallback()?.();
    onScrollEnd();
    expect(fn).toHaveBeenCalled();
  });
});
