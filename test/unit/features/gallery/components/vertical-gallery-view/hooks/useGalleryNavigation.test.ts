/**
 * @fileoverview Tests for useGalleryNavigation hook
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGalleryNavigation } from '@features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation';

// Mock dependencies
vi.mock('@shared/state/signals/gallery.signals', () => ({
  galleryIndexEvents: {
    on: vi.fn().mockReturnValue(() => {}),
  },
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

describe('useGalleryNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null navigation trigger', () => {
    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
      applyFocusAfterNavigation: vi.fn(),
    });

    expect(result.lastNavigationTrigger()).toBeNull();
  });

  it('should initialize with zero programmatic scroll timestamp', () => {
    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
      applyFocusAfterNavigation: vi.fn(),
    });

    expect(result.programmaticScrollTimestamp()).toBe(0);
  });

  it('should allow setting navigation trigger', () => {
    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
      applyFocusAfterNavigation: vi.fn(),
    });

    result.setLastNavigationTrigger('keyboard');
    expect(result.lastNavigationTrigger()).toBe('keyboard');

    result.setLastNavigationTrigger('click');
    expect(result.lastNavigationTrigger()).toBe('click');

    result.setLastNavigationTrigger(null);
    expect(result.lastNavigationTrigger()).toBeNull();
  });

  it('should allow setting programmatic scroll timestamp', () => {
    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
      applyFocusAfterNavigation: vi.fn(),
    });

    const now = Date.now();
    result.setProgrammaticScrollTimestamp(now);
    expect(result.programmaticScrollTimestamp()).toBe(now);
  });

  it('should subscribe to gallery index events when visible', async () => {
    const { galleryIndexEvents } = await import('@shared/state/signals/gallery.signals');

    useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
      applyFocusAfterNavigation: vi.fn(),
    });

    expect(galleryIndexEvents.on).toHaveBeenCalledWith('navigate:complete', expect.any(Function));
  });

  it('should not subscribe when gallery is not visible', async () => {
    const { galleryIndexEvents } = await import('@shared/state/signals/gallery.signals');
    vi.clearAllMocks();

    useGalleryNavigation({
      isVisible: () => false,
      scrollToItem: vi.fn(),
      applyFocusAfterNavigation: vi.fn(),
    });

    expect(galleryIndexEvents.on).not.toHaveBeenCalled();
  });
});
