import {
  applyViewportCssVars,
  computeViewportConstraints,
  observeViewportCssVars,
} from '@shared/dom/viewport';

const { mockAddListener, mockRemoveEventListenerManaged, mockSetTimeout, mockCreateEventListener } =
  vi.hoisted(() => ({
    mockAddListener: vi.fn<
      (
        element: EventTarget,
        type: string,
        listener: EventListener,
        options?: AddEventListenerOptions,
        context?: string
      ) => string
    >(() => 'listener-id'),
    mockRemoveEventListenerManaged: vi.fn<(id: string) => void>(),
    mockSetTimeout: vi.fn<(callback: () => void, delay: number) => number>(),
    mockCreateEventListener: vi.fn<(handler: (event: Event) => void) => EventListener>(
      handler => ((event: Event) => handler(event)) as EventListener
    ),
  }));

vi.mock('@shared/utils/events/core/listener-manager', () => ({
  addListener: mockAddListener,
  removeEventListenerManaged: mockRemoveEventListenerManaged,
}));

vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: {
    setTimeout: mockSetTimeout,
  },
}));

vi.mock('@shared/utils/types/guards', () => ({
  createEventListener: mockCreateEventListener,
}));

describe('viewport helpers', () => {
  type Raf = (callback: FrameRequestCallback) => number;
  const globalMutable = globalThis as Record<string, unknown>;
  const originalRaf = globalThis.requestAnimationFrame;
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddListener.mockReturnValue('listener-id');
    mockSetTimeout.mockImplementation((callback: () => void) => {
      callback();
      return 1;
    });
    globalMutable.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    }) as unknown as Raf;
    globalMutable.ResizeObserver = undefined;
  });

  afterEach(() => {
    globalMutable.requestAnimationFrame = originalRaf as typeof globalThis.requestAnimationFrame;
    globalMutable.ResizeObserver = originalResizeObserver as typeof globalThis.ResizeObserver;
  });

  describe('computeViewportConstraints', () => {
    it('clamps negative inputs and floors decimals', () => {
      const result = computeViewportConstraints(
        { width: 1024.9, height: 768.4 },
        { paddingTop: -5.6, paddingBottom: 12.9, toolbarHeight: 20.3 }
      );

      expect(result).toEqual({ viewportW: 1024, viewportH: 768, constrainedH: 736 });
    });
  });

  describe('applyViewportCssVars', () => {
    it('applies CSS custom properties with px suffix', () => {
      const el = document.createElement('div');
      applyViewportCssVars(el, { viewportW: 800, viewportH: 600, constrainedH: 512 });

      expect(el.style.getPropertyValue('--xeg-viewport-w')).toBe('800px');
      expect(el.style.getPropertyValue('--xeg-viewport-h')).toBe('600px');
      expect(el.style.getPropertyValue('--xeg-viewport-height-constrained')).toBe('512px');
    });
  });

  describe('observeViewportCssVars', () => {
    it('updates CSS vars, uses ResizeObserver, and cleans up listeners', () => {
      const rafMock = vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
      globalMutable.requestAnimationFrame = rafMock as unknown as Raf;

      const observeSpy = vi.fn();
      const disconnectSpy = vi.fn();
      const observerInstances: MockResizeObserver[] = [];
      class MockResizeObserver {
        private readonly cb: ResizeObserverCallback;
        constructor(cb: ResizeObserverCallback) {
          this.cb = cb;
          observerInstances.push(this);
        }
        observe = observeSpy;
        disconnect = disconnectSpy;
        trigger() {
          this.cb([], this as unknown as ResizeObserver);
        }
      }
      globalMutable.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

      const el = document.createElement('div');
      el.getBoundingClientRect = vi.fn(() => ({ width: 640, height: 480 } as DOMRect));

      const cleanup = observeViewportCssVars(el, () => ({
        paddingTop: 10,
        paddingBottom: 5,
        toolbarHeight: 15,
      }));

      expect(el.style.getPropertyValue('--xeg-viewport-w')).toBe('640px');
      expect(el.style.getPropertyValue('--xeg-viewport-h')).toBe('480px');
      expect(el.style.getPropertyValue('--xeg-viewport-height-constrained')).toBe('450px');
      expect(observeSpy).toHaveBeenCalledWith(el);
      expect(mockAddListener).toHaveBeenCalledWith(
        window,
        'resize',
        expect.any(Function),
        { passive: true },
        'viewport:resize'
      );

      observerInstances[0]?.trigger();
      expect(rafMock).toHaveBeenCalledTimes(1);

      cleanup();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(mockRemoveEventListenerManaged).toHaveBeenCalledWith('listener-id');
    });

    it('falls back to timer scheduling when requestAnimationFrame is unavailable', () => {
      globalMutable.requestAnimationFrame = undefined;
      globalMutable.ResizeObserver = undefined;

      const timerCallbacks: Array<() => void> = [];
      mockSetTimeout.mockImplementation((callback: () => void) => {
        timerCallbacks.push(callback);
        return timerCallbacks.length;
      });

      const el = document.createElement('div');
      el.getBoundingClientRect = vi.fn(() => ({ width: 320, height: 240 } as DOMRect));

      const cleanup = observeViewportCssVars(el, () => ({
        paddingTop: 0,
        paddingBottom: 0,
        toolbarHeight: 0,
      }));

      const resizeListener = mockAddListener.mock.calls[0]?.[2] as EventListener | undefined;
      expect(typeof resizeListener).toBe('function');
      resizeListener?.(new Event('resize'));

      expect(mockSetTimeout).toHaveBeenCalledTimes(1);
      timerCallbacks[0]?.();
      expect(el.style.getPropertyValue('--xeg-viewport-h')).toBe('240px');

      cleanup();
      expect(mockRemoveEventListenerManaged).toHaveBeenCalledWith('listener-id');
    });
  });
});
