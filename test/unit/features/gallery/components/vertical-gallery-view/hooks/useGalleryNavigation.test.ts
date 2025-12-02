/**
 * @fileoverview Tests for useGalleryNavigation hook
 */

import { useGalleryNavigation } from '@features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation';

// Mock dependencies
const solidMocks = vi.hoisted(() => ({
  onCleanup: vi.fn(),
  createEffect: vi.fn((fn: () => void) => fn()),
  on: vi.fn(
    (
      source: () => boolean,
      callback: (value: boolean, prev?: boolean) => void,
      _options?: { defer?: boolean }
    ) => {
      return () => {
        callback(source(), undefined);
      };
    }
  ),
}));

vi.mock('@shared/state/signals/gallery.signals', () => ({
  galleryIndexEvents: {
    on: vi.fn().mockReturnValue(() => {}),
  },
}));

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createSignal: <T>(initial: T) => {
    let value = initial;
    const getter = () => value;
    const setter = (v: T | ((prev: T) => T)) => {
      value = typeof v === 'function' ? (v as (prev: T) => T)(value) : v;
    };
    return [getter, setter] as const;
  },
  createEffect: solidMocks.createEffect,
  onCleanup: solidMocks.onCleanup,
  on: solidMocks.on,
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
    });

    expect(result.lastNavigationTrigger()).toBeNull();
  });

  it('should initialize with zero programmatic scroll timestamp', () => {
    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
    });

    expect(result.programmaticScrollTimestamp()).toBe(0);
  });

  it('should allow setting navigation trigger', () => {
    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
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
    });

    expect(galleryIndexEvents.on).toHaveBeenCalledWith('navigate:start', expect.any(Function));
    expect(galleryIndexEvents.on).toHaveBeenCalledWith('navigate:complete', expect.any(Function));
  });

  it('should update trigger on navigate:start before completion', async () => {
    const { galleryIndexEvents } = await import('@shared/state/signals/gallery.signals');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let startCallback: ((payload: any) => void) | undefined;

    const mockedOn = vi.mocked(galleryIndexEvents.on);
    mockedOn.mockImplementation((event, cb) => {
      if (event === 'navigate:start') {
        startCallback = cb;
      }
      return () => {};
    });

    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
    });

    expect(startCallback).toBeDefined();
    startCallback?.({ from: 0, to: 1, trigger: 'scroll' });

    expect(result.lastNavigationTrigger()).toBe('scroll');

    mockedOn.mockImplementation(() => () => {});
  });

  it('should handle navigate:complete event', async () => {
    const { galleryIndexEvents } = await import('@shared/state/signals/gallery.signals');
    const scrollToItem = vi.fn();

    // Capture the callback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let callback: ((payload: any) => void) | undefined;
    const mockedOn = vi.mocked(galleryIndexEvents.on);
    mockedOn.mockImplementation((event, cb) => {
      if (event === 'navigate:complete') {
        callback = cb;
      }
      return () => {};
    });

    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem,
    });

    // Trigger the callback
    expect(callback).toBeDefined();
    if (callback) {
      callback({ index: 5, trigger: 'keyboard' });
    }

    expect(result.lastNavigationTrigger()).toBe('keyboard');
    expect(scrollToItem).toHaveBeenCalledWith(5);

    mockedOn.mockImplementation(() => () => {});
  });

  it('should NOT call scrollToItem when trigger is scroll', async () => {
    const { galleryIndexEvents } = await import('@shared/state/signals/gallery.signals');
    const scrollToItem = vi.fn();

    // Capture the callback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let callback: ((payload: any) => void) | undefined;
    const mockedOn = vi.mocked(galleryIndexEvents.on);
    mockedOn.mockImplementation((event, cb) => {
      if (event === 'navigate:complete') {
        callback = cb;
      }
      return () => {};
    });

    const result = useGalleryNavigation({
      isVisible: () => true,
      scrollToItem,
    });

    // Trigger the callback with scroll trigger
    expect(callback).toBeDefined();
    if (callback) {
      callback({ index: 3, trigger: 'scroll' });
    }

    // Trigger state should still be updated
    expect(result.lastNavigationTrigger()).toBe('scroll');
    // But scrollToItem should NOT be called for scroll-based navigation
    expect(scrollToItem).not.toHaveBeenCalled();

    mockedOn.mockImplementation(() => () => {});
  });

  it('should not subscribe when gallery is not visible', async () => {
    const { galleryIndexEvents } = await import('@shared/state/signals/gallery.signals');
    vi.clearAllMocks();

    useGalleryNavigation({
      isVisible: () => false,
      scrollToItem: vi.fn(),
    });

    expect(galleryIndexEvents.on).not.toHaveBeenCalled();
  });

  it('should unsubscribe on cleanup', async () => {
    const { galleryIndexEvents } = await import('@shared/state/signals/gallery.signals');

    const unsubscribeStart = vi.fn();
    const unsubscribeComplete = vi.fn();
    const mockedOn = vi.mocked(galleryIndexEvents.on);
    mockedOn.mockImplementation(event => {
      if (event === 'navigate:start') {
        return unsubscribeStart;
      }
      return unsubscribeComplete;
    });

    useGalleryNavigation({
      isVisible: () => true,
      scrollToItem: vi.fn(),
    });

    expect(solidMocks.onCleanup).toHaveBeenCalledWith(expect.any(Function));

    // Execute the cleanup function
    const calls = vi.mocked(solidMocks.onCleanup).mock.calls;
    if (calls.length > 0 && calls[0]) {
      const cleanupFn = calls[0][0];
      cleanupFn();
    }

    expect(unsubscribeStart).toHaveBeenCalled();
    expect(unsubscribeComplete).toHaveBeenCalled();

    mockedOn.mockImplementation(() => () => {});
  });
});
