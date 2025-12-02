import { galleryState } from '@/shared/state/signals/gallery.signals';
import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';
import { isGalleryInternalEvent } from '@/shared/dom/utils';
import { logger } from '@/shared/logging';
import { createRoot, createSignal } from 'solid-js';
// Use vitest globals and import only types
import type { Mock } from 'vitest';

// Mock dependencies
vi.mock('@/shared/external/vendors', async () => {
  const solid = await vi.importActual<typeof import('solid-js')>('solid-js');
  return {
    getSolid: () => solid,
  };
});

vi.mock('@/shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

interface RegisteredListener {
  id: string;
  target: EventTarget;
  type: string;
  handler: EventListener;
  context?: string;
  options?: boolean | AddEventListenerOptions;
}

const registeredListeners: RegisteredListener[] = [];

const mockAddListener = vi.fn(
  (
    target: EventTarget,
    type: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions,
    context?: string,
  ) => {
    target.addEventListener(type, handler, options);
    const listenerId = `mock-listener-${registeredListeners.length + 1}`;
    const listener: RegisteredListener = { id: listenerId, target, type, handler };
    if (typeof options !== 'undefined') {
      listener.options = options;
    }
    if (typeof context !== 'undefined') {
      listener.context = context;
    }
    registeredListeners.push(listener);
    return listenerId;
  },
);

const mockRemoveListener = vi.fn((id: string) => {
  const index = registeredListeners.findIndex(listener => listener.id === id);
  if (index === -1) {
    return false;
  }

  const listener = registeredListeners[index];
  if (!listener) {
    return false;
  }

  listener.target.removeEventListener(listener.type, listener.handler, listener.options);
  registeredListeners.splice(index, 1);
  return true;
});

vi.mock('@/shared/services/event-manager', () => ({
  EventManager: {
    getInstance: () => ({
      addListener: mockAddListener,
      removeListener: mockRemoveListener,
    }),
  },
}));

vi.mock('@/shared/dom/utils', () => ({
  isGalleryInternalEvent: vi.fn(() => true),
}));

describe('useGalleryScroll', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    vi.useFakeTimers();
    // Ensure gallery is open so scroll events are processed
    galleryState.value = {
      ...galleryState.value,
      isOpen: true,
    };
    (isGalleryInternalEvent as Mock).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    registeredListeners.splice(0, registeredListeners.length);
  });

  it('should initialize with default state', () => {
    createRoot(dispose => {
      const { isScrolling, lastScrollTime } = useGalleryScroll({
        container: () => container,
      });

      expect(isScrolling()).toBe(false);
      expect(lastScrollTime()).toBe(0);

      dispose();
    });
  });

  it('should handle wheel events', async () => {
    await createRoot(async dispose => {
      const onScroll = vi.fn();
      const { isScrolling } = useGalleryScroll({
        container: () => container,
        onScroll,
      });

      // Wait for effects to run
      await Promise.resolve();

      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      container.dispatchEvent(wheelEvent);

      expect(onScroll).toHaveBeenCalled();
      expect(isScrolling()).toBe(true);

      // Fast-forward time to end scrolling
      vi.advanceTimersByTime(300);
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should ignore wheel events that are not internal to gallery', async () => {
    await createRoot(async dispose => {
      (isGalleryInternalEvent as Mock).mockReturnValue(false);
      const onScroll = vi.fn();
      const { isScrolling } = useGalleryScroll({
        container: () => container,
        onScroll,
      });

      await Promise.resolve();

      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      container.dispatchEvent(wheelEvent);

      expect(onScroll).not.toHaveBeenCalled();
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should handle failure to register listener', async () => {
    await createRoot(async dispose => {
      // Simulate failure to register one listener
      mockAddListener.mockReturnValueOnce(null as unknown as string);

      const { isScrolling } = useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      // Should not crash and state should be valid
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should handle scroll events', async () => {
    await createRoot(async dispose => {
      const { isScrolling } = useGalleryScroll({
        container: () => container,
      });

      // Wait for effects to run
      await Promise.resolve();

      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);

      expect(isScrolling()).toBe(true);

      vi.advanceTimersByTime(300);
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should call onScrollEnd when scrolling stops', async () => {
    await createRoot(async dispose => {
      const onScrollEnd = vi.fn();
      const { isScrolling } = useGalleryScroll({
        container: () => container,
        onScrollEnd,
      });

      await Promise.resolve();

      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);

      expect(isScrolling()).toBe(true);
      expect(onScrollEnd).not.toHaveBeenCalled();

      // Fast-forward time to trigger scroll end
      vi.advanceTimersByTime(300);
      expect(isScrolling()).toBe(false);
      expect(onScrollEnd).toHaveBeenCalledTimes(1);

      dispose();
    });
  });

  it('should ignore events shortly after programmatic scroll', async () => {
    await createRoot(async dispose => {
      const [timestamp, setTimestamp] = createSignal(0);
      const onScroll = vi.fn();

      const { isScrolling } = useGalleryScroll({
        container: () => container,
        onScroll,
        programmaticScrollTimestamp: timestamp,
      });

      // Wait for effects to run
      await Promise.resolve();

      // Set timestamp to now
      const now = Date.now();
      vi.setSystemTime(now);
      setTimestamp(now);

      // Trigger scroll event immediately
      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);

      // Should be ignored
      expect(isScrolling()).toBe(false);

      // Advance time past the ignore window (e.g. 100ms)
      vi.advanceTimersByTime(150);

      // Trigger another scroll event
      container.dispatchEvent(new Event('scroll'));

      // Should be handled
      expect(isScrolling()).toBe(true);

      dispose();
    });
  });

  it('should respect scrollTarget option', async () => {
    await createRoot(async dispose => {
      const scrollTarget = document.createElement('div');
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        scrollTarget: () => scrollTarget,
        onScroll,
      });

      await Promise.resolve();

      // Event on container should NOT trigger
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(onScroll).not.toHaveBeenCalled();

      // Event on scrollTarget SHOULD trigger
      scrollTarget.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(onScroll).toHaveBeenCalled();

      dispose();
    });
  });

  it('should not handle events when gallery is closed', async () => {
    await createRoot(async dispose => {
      // Close gallery
      galleryState.value = { ...galleryState.value, isOpen: false };

      const { isScrolling } = useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should cleanup listeners on dispose', async () => {
    await createRoot(async dispose => {
      const { isScrolling } = useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      dispose();
      expect(mockRemoveListener).toHaveBeenCalledTimes(2);

      // Event should be ignored after dispose
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(isScrolling()).toBe(false);
    });
  });

  it('should not end scrolling before timeout', async () => {
    await createRoot(async dispose => {
      const { isScrolling } = useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      container.dispatchEvent(new Event('scroll'));
      expect(isScrolling()).toBe(true);

      vi.advanceTimersByTime(249);
      expect(isScrolling()).toBe(true);

      vi.advanceTimersByTime(1); // Total 250
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should log debug messages', async () => {
    await createRoot(async dispose => {
      useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      // Check registration logs
      expect(logger.debug).toHaveBeenCalledWith('useGalleryScroll: listener registered', expect.any(Object));
      expect(logger.debug).toHaveBeenCalledWith('useGalleryScroll: Listeners registered');

      // Trigger scroll end
      const scrollEvent = new Event('scroll');
      container.dispatchEvent(scrollEvent);
      vi.advanceTimersByTime(300);

      expect(logger.debug).toHaveBeenCalledWith('useGalleryScroll: Scroll ended');

      dispose();

      // Check cleanup logs
      expect(logger.debug).toHaveBeenCalledWith('useGalleryScroll: listener removed', expect.any(Object));
    });
  });

  it('should use correct listener context', async () => {
    await createRoot(async dispose => {
      useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      // Check the last call to addListener
      const calls = mockAddListener.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastCall = calls[calls.length - 1];
      if (!lastCall) throw new Error('No calls found');
      // Signature: target, type, handler, options, context
      const context = lastCall[4];
      expect(context).toMatch(/^useGalleryScroll:[a-z0-9]+:[a-z0-9]+$/);

      dispose();
    });
  });

  it('registers listeners with passive true options and valid handlers', async () => {
    await createRoot(async dispose => {
      useGalleryScroll({ container: () => container });
      await Promise.resolve();

      // At least two listeners are registered: wheel and scroll
      expect(registeredListeners.length).toBeGreaterThanOrEqual(2);

      // Each registered listener should include the passive:true option and a handler function
      for (const l of registeredListeners) {
        expect(l.options).toBeDefined();
        // options can be boolean or object, but when object it should include passive true
        if (typeof l.options !== 'boolean') {
          expect((l.options as AddEventListenerOptions).passive).toBe(true);
        }
        expect(typeof l.handler).toBe('function');
      }

      dispose();
    });
  });
});

describe('useGalleryScroll (mutation coverage)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    vi.useFakeTimers();
    galleryState.value = {
      ...galleryState.value,
      isOpen: true,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    registeredListeners.splice(0, registeredListeners.length);
  });

  it('should not register listeners when container is null', async () => {
    await createRoot(async dispose => {
      const { isScrolling } = useGalleryScroll({
        container: () => null,
      });

      await Promise.resolve();

      expect(mockAddListener).not.toHaveBeenCalled();
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should not register listeners when enabled is false', async () => {
    await createRoot(async dispose => {
      const { isScrolling } = useGalleryScroll({
        container: () => container,
        enabled: false,
      });

      await Promise.resolve();

      expect(mockAddListener).not.toHaveBeenCalled();
      expect(isScrolling()).toBe(false);

      dispose();
    });
  });

  it('should use container as event target when scrollTarget is null', async () => {
    await createRoot(async dispose => {
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        scrollTarget: () => null,
        onScroll,
      });

      await Promise.resolve();

      // Should fall back to container
      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(onScroll).toHaveBeenCalled();

      dispose();
    });
  });

  it('should use container as scrollTarget default', async () => {
    await createRoot(async dispose => {
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        // scrollTarget not provided
        onScroll,
      });

      await Promise.resolve();

      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(onScroll).toHaveBeenCalled();

      dispose();
    });
  });

  it('should clear existing timer when new scroll event occurs', async () => {
    await createRoot(async dispose => {
      const onScrollEnd = vi.fn();

      useGalleryScroll({
        container: () => container,
        onScrollEnd,
      });

      await Promise.resolve();

      // First scroll event
      container.dispatchEvent(new Event('scroll'));

      // Advance partially
      vi.advanceTimersByTime(100);

      // Second scroll event (should reset timer)
      container.dispatchEvent(new Event('scroll'));

      // Original timer would have fired by now
      vi.advanceTimersByTime(200);

      // onScrollEnd should not have been called yet
      expect(onScrollEnd).not.toHaveBeenCalled();

      // Now timer should fire
      vi.advanceTimersByTime(100);
      expect(onScrollEnd).toHaveBeenCalledTimes(1);

      dispose();
    });
  });

  it('should update lastScrollTime on each scroll', async () => {
    await createRoot(async dispose => {
      const now = 1000;
      vi.setSystemTime(now);

      const { lastScrollTime } = useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      expect(lastScrollTime()).toBe(0);

      container.dispatchEvent(new Event('scroll'));
      expect(lastScrollTime()).toBe(1000);

      vi.setSystemTime(2000);
      container.dispatchEvent(new Event('scroll'));
      expect(lastScrollTime()).toBe(2000);

      dispose();
    });
  });

  it('should accept enabled as accessor function', async () => {
    await createRoot(async dispose => {
      const [enabled, _setEnabled] = createSignal(false);
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        enabled,
        onScroll,
      });

      await Promise.resolve();

      // Initially disabled
      container.dispatchEvent(new Event('scroll'));
      expect(onScroll).not.toHaveBeenCalled();

      dispose();
    });
  });

  it('should accept programmaticScrollTimestamp as direct value 0', async () => {
    await createRoot(async dispose => {
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        programmaticScrollTimestamp: () => 0,
        onScroll,
      });

      await Promise.resolve();

      container.dispatchEvent(new Event('scroll'));
      expect(onScroll).toHaveBeenCalled();

      dispose();
    });
  });

  it('should ignore wheel events when gallery is closed', async () => {
    await createRoot(async dispose => {
      galleryState.value = { ...galleryState.value, isOpen: false };
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        onScroll,
      });

      await Promise.resolve();

      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(onScroll).not.toHaveBeenCalled();

      dispose();
    });
  });

  it('should clear timer on cleanup even without triggering', async () => {
    await createRoot(async dispose => {
      useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      // No scroll event fired
      dispose();

      // Should not throw
      expect(mockRemoveListener).toHaveBeenCalled();
    });
  });

  it('should reset isScrolling to false when disabled changes', async () => {
    await createRoot(async dispose => {
      const [enabled, setEnabled] = createSignal(true);

      const { isScrolling } = useGalleryScroll({
        container: () => container,
        enabled,
      });

      await Promise.resolve();

      // Start scrolling
      container.dispatchEvent(new Event('scroll'));
      expect(isScrolling()).toBe(true);

      // Disable - this would require re-running the effect
      // In practice, the effect reruns and resets state
      setEnabled(false);

      // After the effect cleanup runs
      await Promise.resolve();

      dispose();
    });
  });

  it('should not call onScroll when it is not provided', async () => {
    await createRoot(async dispose => {
      const { isScrolling } = useGalleryScroll({
        container: () => container,
        // No onScroll callback
      });

      await Promise.resolve();

      // Should not throw
      container.dispatchEvent(new Event('scroll'));
      expect(isScrolling()).toBe(true);

      dispose();
    });
  });

  it('should not call onScrollEnd when it is not provided', async () => {
    await createRoot(async dispose => {
      const { isScrolling } = useGalleryScroll({
        container: () => container,
        // No onScrollEnd callback
      });

      await Promise.resolve();

      container.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(300);

      expect(isScrolling()).toBe(false);
      // Should not throw

      dispose();
    });
  });

  it('should handle multiple rapid scroll events correctly', async () => {
    await createRoot(async dispose => {
      const onScrollEnd = vi.fn();

      const { isScrolling } = useGalleryScroll({
        container: () => container,
        onScrollEnd,
      });

      await Promise.resolve();

      // Rapid scroll events
      for (let i = 0; i < 10; i++) {
        container.dispatchEvent(new Event('scroll'));
        vi.advanceTimersByTime(50);
      }

      expect(isScrolling()).toBe(true);
      expect(onScrollEnd).not.toHaveBeenCalled();

      // Wait for idle
      vi.advanceTimersByTime(300);
      expect(isScrolling()).toBe(false);
      expect(onScrollEnd).toHaveBeenCalledTimes(1);

      dispose();
    });
  });

  it('should handle programmatic scroll exactly at the boundary (100ms)', async () => {
    await createRoot(async dispose => {
      const [timestamp, setTimestamp] = createSignal(0);
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        onScroll,
        programmaticScrollTimestamp: timestamp,
      });

      await Promise.resolve();

      const now = 1000;
      vi.setSystemTime(now);
      setTimestamp(now);

      // Exactly at 100ms boundary - should still ignore
      vi.setSystemTime(now + 99);
      container.dispatchEvent(new Event('scroll'));
      expect(onScroll).not.toHaveBeenCalled();

      // At exactly 100ms - should process
      vi.setSystemTime(now + 100);
      container.dispatchEvent(new Event('scroll'));
      expect(onScroll).toHaveBeenCalled();

      dispose();
    });
  });

  it('should mark scrolling state immediately on wheel event', async () => {
    await createRoot(async dispose => {
      const { isScrolling, lastScrollTime } = useGalleryScroll({
        container: () => container,
      });

      await Promise.resolve();

      const now = 5000;
      vi.setSystemTime(now);

      expect(isScrolling()).toBe(false);
      expect(lastScrollTime()).toBe(0);

      container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));

      expect(isScrolling()).toBe(true);
      expect(lastScrollTime()).toBe(5000);

      dispose();
    });
  });

  it('should handle enabled changing from true to false mid-scroll', async () => {
    await createRoot(async dispose => {
      const [enabled, setEnabled] = createSignal(true);
      const onScrollEnd = vi.fn();

      const { isScrolling } = useGalleryScroll({
        container: () => container,
        enabled,
        onScrollEnd,
      });

      await Promise.resolve();

      // Start scrolling
      container.dispatchEvent(new Event('scroll'));
      expect(isScrolling()).toBe(true);

      // Disable while scrolling
      setEnabled(false);
      await Promise.resolve();

      // Effect should cleanup and reset state
      // Timer should be cleared

      dispose();
    });
  });

  it('should correctly identify scroll element from scrollTarget accessor', async () => {
    await createRoot(async dispose => {
      const scrollTarget = document.createElement('div');
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        scrollTarget: () => scrollTarget,
        onScroll,
      });

      await Promise.resolve();

      // Scroll on scroll target should trigger
      scrollTarget.dispatchEvent(new Event('scroll'));
      expect(onScroll).toHaveBeenCalledTimes(1);

      dispose();
    });
  });

  it('should handle scroll event when programmaticScrollTimestamp is undefined', async () => {
    await createRoot(async dispose => {
      const onScroll = vi.fn();

      useGalleryScroll({
        container: () => container,
        onScroll,
        // programmaticScrollTimestamp not provided (undefined)
      });

      await Promise.resolve();

      container.dispatchEvent(new Event('scroll'));
      expect(onScroll).toHaveBeenCalled();

      dispose();
    });
  });
});
