/**
 * @fileoverview Tests for useToolbarAutoHide hook
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToolbarAutoHide } from '@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide';

// Mock dependencies
vi.mock('@shared/container/settings-access', () => ({
  getSetting: vi.fn().mockReturnValue(3000),
}));

vi.mock('@shared/external/vendors', () => ({
  getSolid: () => ({
    createSignal: <T>(initial: T) => {
      let value = initial;
      const getter = () => value;
      const setter = (v: T | ((prev: T) => T)) => {
        value = typeof v === 'function' ? (v as (prev: T) => T)(value) : v;
      };
      return [getter, setter] as const;
    },
    createEffect: (fn: () => void) => {
      fn();
    },
    onCleanup: vi.fn(),
  }),
}));

describe('useToolbarAutoHide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with toolbar visible when gallery is visible', () => {
    const result = useToolbarAutoHide({
      isVisible: () => true,
      hasItems: () => true,
    });

    expect(result.isInitialToolbarVisible()).toBe(true);
  });

  it('should hide toolbar when gallery is not visible', () => {
    const result = useToolbarAutoHide({
      isVisible: () => false,
      hasItems: () => true,
    });

    expect(result.isInitialToolbarVisible()).toBe(false);
  });

  it('should hide toolbar when there are no items', () => {
    const result = useToolbarAutoHide({
      isVisible: () => true,
      hasItems: () => false,
    });

    expect(result.isInitialToolbarVisible()).toBe(false);
  });

  it('should provide setter for manual visibility control', () => {
    const result = useToolbarAutoHide({
      isVisible: () => true,
      hasItems: () => true,
    });

    result.setIsInitialToolbarVisible(false);
    expect(result.isInitialToolbarVisible()).toBe(false);

    result.setIsInitialToolbarVisible(true);
    expect(result.isInitialToolbarVisible()).toBe(true);
  });
});
