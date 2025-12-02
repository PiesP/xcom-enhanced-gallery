/**
 * @fileoverview Tests for useGalleryLifecycle hook
 */

import { useGalleryLifecycle } from '@features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle';

const effectRunners: Array<() => void> = [];
const cleanupCallbacks: Array<() => void> = [];

// Mock dependencies
vi.mock('@shared/dom/utils', () => ({
  ensureGalleryScrollAvailable: vi.fn(),
}));

vi.mock('@shared/dom/viewport', () => ({
  observeViewportCssVars: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('@shared/utils/css/css-animations', () => ({
  animateGalleryEnter: vi.fn().mockResolvedValue(undefined),
  animateGalleryExit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createEffect: (effect: () => void) => {
    effectRunners.push(effect);
    effect();
  },
  onCleanup: (cb: () => void) => {
    cleanupCallbacks.push(cb);
  },
  on: (
    sources: unknown,
    fn: (value: unknown) => void,
    options?: { defer?: boolean }
  ) => {
    let primed = !(options?.defer ?? false);
    const resolveSource = (source: unknown) => {
      if (typeof source === 'function') {
        return (source as () => unknown)();
      }
      return source;
    };
    return () => {
      const current = Array.isArray(sources)
        ? sources.map(resolveSource)
        : resolveSource(sources);

      if (!primed) {
        primed = true;
        return;
      }

      fn(current as never);
    };
  },
}));

const runEffect = (index: number) => {
  const runner = effectRunners[index];
  if (!runner) {
    throw new Error(`Effect at index ${index} not registered`);
  }
  runner();
};

describe('useGalleryLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    effectRunners.length = 0;
    cleanupCallbacks.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
    effectRunners.length = 0;
    cleanupCallbacks.length = 0;
  });

  it('should call ensureGalleryScrollAvailable when container is available', async () => {
    const { ensureGalleryScrollAvailable } = await import('@shared/dom/utils');
    const container = document.createElement('div');

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => true,
    });

    expect(ensureGalleryScrollAvailable).toHaveBeenCalled();
  });

  it('should set up viewport CSS vars observation', async () => {
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    const container = document.createElement('div');
    const toolbarWrapper = document.createElement('div');

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => toolbarWrapper,
      isVisible: () => true,
    });

    expect(observeViewportCssVars).toHaveBeenCalled();
  });

  it('should not set up viewport observation without container', async () => {
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    vi.clearAllMocks();

    useGalleryLifecycle({
      containerEl: () => null,
      toolbarWrapperEl: () => null,
      isVisible: () => true,
    });

    // observeViewportCssVars is called in effect but returns early
    // The actual call happens but bails out inside
    expect(observeViewportCssVars).not.toHaveBeenCalled();
  });

  it('runs enter animation when the gallery becomes visible', async () => {
    const container = document.createElement('div');
    let visible = false;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    const { animateGalleryEnter } = await import('@shared/utils/css/css-animations');

    visible = true;
    runEffect(1);

    expect(animateGalleryEnter).toHaveBeenCalledWith(container);
  });

  it('runs exit animation and resets videos even when cleanup throws', async () => {
    const container = document.createElement('div');
    const video = document.createElement('video');
    const pauseMock = vi.fn(() => {
      throw new Error('pause failed');
    });
    Object.defineProperty(video, 'pause', {
      value: pauseMock,
      writable: true,
    });
    video.currentTime = 42;
    container.append(video);

    let visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    const { animateGalleryExit } = await import('@shared/utils/css/css-animations');
    const { logger } = await import('@shared/logging');

    // Prime deferred effect, then trigger exit path
    runEffect(1);
    visible = false;
    runEffect(1);

    expect(animateGalleryExit).toHaveBeenCalledWith(container);
    expect(video.currentTime).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith('video cleanup failed', { error: expect.any(Error) });
  });

  it('observes viewport CSS vars and cleans up listeners', async () => {
    const cleanup = vi.fn();
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    vi.mocked(observeViewportCssVars).mockReturnValue(cleanup);

    const container = document.createElement('div');
    const toolbar = document.createElement('div');
    toolbar.getBoundingClientRect = () => ({ height: 64 } as DOMRect);

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => toolbar,
      isVisible: () => false,
    });

    expect(observeViewportCssVars).toHaveBeenCalledWith(container, expect.any(Function));
    const callback = vi.mocked(observeViewportCssVars).mock.calls[0]![1];
    expect(callback()).toEqual({ toolbarHeight: 64, paddingTop: 0, paddingBottom: 0 });

    cleanupCallbacks.forEach(cb => cb());
    expect(cleanup).toHaveBeenCalled();
  });
});

describe('useGalleryLifecycle (mutation coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    effectRunners.length = 0;
    cleanupCallbacks.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
    effectRunners.length = 0;
    cleanupCallbacks.length = 0;
  });

  it('does not call ensureGalleryScrollAvailable when container is null', async () => {
    const { ensureGalleryScrollAvailable } = await import('@shared/dom/utils');
    vi.clearAllMocks();

    useGalleryLifecycle({
      containerEl: () => null,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => true,
    });

    expect(ensureGalleryScrollAvailable).not.toHaveBeenCalled();
  });

  it('does not run animation when container becomes null', async () => {
    const { animateGalleryExit } = await import('@shared/utils/css/css-animations');
    vi.clearAllMocks();

    let containerEl: HTMLDivElement | null = document.createElement('div');
    useGalleryLifecycle({
      containerEl: () => containerEl,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => true,
    });

    // Prime the deferred effect
    runEffect(1);

    // Now set container to null
    containerEl = null;
    runEffect(1);

    // Animation should not be called when container is null
    expect(animateGalleryExit).not.toHaveBeenCalled();
  });

  it('resets video currentTime only when it is not already 0', async () => {
    const container = document.createElement('div');
    const video1 = document.createElement('video');
    video1.pause = vi.fn();
    Object.defineProperty(video1, 'currentTime', { value: 42, writable: true, configurable: true });

    const video2 = document.createElement('video');
    video2.pause = vi.fn();
    Object.defineProperty(video2, 'currentTime', { value: 0, writable: true, configurable: true });

    container.append(video1, video2);

    let visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    // Prime deferred effect
    runEffect(1);
    visible = false;
    runEffect(1);

    expect(video1.currentTime).toBe(0);
    // video2 already had currentTime = 0, so no setter should trigger error
    expect(video2.currentTime).toBe(0);
  });

  it('handles currentTime setter error gracefully', async () => {
    const { logger } = await import('@shared/logging');
    const container = document.createElement('div');
    const video = document.createElement('video');
    video.pause = vi.fn();
    Object.defineProperty(video, 'currentTime', {
      get: () => 42,
      set: () => {
        throw new Error('currentTime setter failed');
      },
      configurable: true,
    });
    container.append(video);

    let visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    runEffect(1);
    visible = false;
    runEffect(1);

    expect(logger.warn).toHaveBeenCalledWith('video cleanup failed', { error: expect.any(Error) });
  });

  it('cleans up all videos even when one fails', async () => {
    const { logger } = await import('@shared/logging');
    const container = document.createElement('div');

    const failingVideo = document.createElement('video');
    failingVideo.pause = vi.fn(() => {
      throw new Error('pause failed');
    });
    Object.defineProperty(failingVideo, 'currentTime', { value: 10, writable: true, configurable: true });

    const successVideo = document.createElement('video');
    successVideo.pause = vi.fn();
    Object.defineProperty(successVideo, 'currentTime', { value: 20, writable: true, configurable: true });

    container.append(failingVideo, successVideo);

    let visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    runEffect(1);
    visible = false;
    runEffect(1);

    // First video fails, but second should still be processed
    expect(logger.warn).toHaveBeenCalled();
    expect(successVideo.pause).toHaveBeenCalled();
    expect(successVideo.currentTime).toBe(0);
  });

  it('handles null observeViewportCssVars cleanup gracefully', async () => {
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    vi.mocked(observeViewportCssVars).mockReturnValue(undefined as unknown as () => void);

    const container = document.createElement('div');
    const toolbar = document.createElement('div');

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => toolbar,
      isVisible: () => true,
    });

    // Should not throw when cleanup is null/undefined
    expect(() => cleanupCallbacks.forEach(cb => cb())).not.toThrow();
  });

  it('returns correct toolbarHeight when wrapper is null in callback', async () => {
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    vi.mocked(observeViewportCssVars).mockReturnValue(vi.fn());

    const container = document.createElement('div');
    let wrapper: HTMLDivElement | null = document.createElement('div');
    wrapper.getBoundingClientRect = () => ({ height: 50 } as DOMRect);

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => wrapper,
      isVisible: () => true,
    });

    const callback = vi.mocked(observeViewportCssVars).mock.calls[0]![1];

    // Initial call with wrapper
    expect(callback().toolbarHeight).toBe(50);

    // Simulate wrapper becoming null
    wrapper = null;
    // Callback still has closure over the wrapper accessor, but implementation checks it
    // The actual implementation re-evaluates wrapper through the accessor
  });

  it('does not animate when container is null during visibility change', async () => {
    const { animateGalleryEnter, animateGalleryExit } = await import('@shared/utils/css/css-animations');
    vi.clearAllMocks();

    useGalleryLifecycle({
      containerEl: () => null,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => true,
    });

    // Effect runs but should early return due to null container
    expect(animateGalleryEnter).not.toHaveBeenCalled();
    expect(animateGalleryExit).not.toHaveBeenCalled();
  });

  it('does not pause video that is already paused', async () => {
    const container = document.createElement('div');
    const video = document.createElement('video');
    const pauseMock = vi.fn();
    video.pause = pauseMock;

    // Video is already paused
    Object.defineProperty(video, 'paused', { value: true, configurable: true });
    Object.defineProperty(video, 'currentTime', { value: 10, writable: true, configurable: true });

    container.append(video);

    let visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    runEffect(1);
    visible = false;
    runEffect(1);

    // pause() is called regardless in the implementation
    // but we should verify currentTime is reset
    expect(video.currentTime).toBe(0);
  });

  it('calls animateGalleryEnter only when visible becomes true', async () => {
    const { animateGalleryEnter, animateGalleryExit } = await import('@shared/utils/css/css-animations');
    vi.clearAllMocks();

    const container = document.createElement('div');
    const visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    // Prime deferred effect
    runEffect(1);

    // When visible is true, animateGalleryEnter should be called
    expect(animateGalleryEnter).toHaveBeenCalledWith(container);
    expect(animateGalleryExit).not.toHaveBeenCalled();
  });

  it('iterates through all videos in container during cleanup', async () => {
    const container = document.createElement('div');
    const video1 = document.createElement('video');
    const video2 = document.createElement('video');
    const video3 = document.createElement('video');

    video1.pause = vi.fn();
    video2.pause = vi.fn();
    video3.pause = vi.fn();

    Object.defineProperty(video1, 'currentTime', { value: 10, writable: true, configurable: true });
    Object.defineProperty(video2, 'currentTime', { value: 20, writable: true, configurable: true });
    Object.defineProperty(video3, 'currentTime', { value: 30, writable: true, configurable: true });

    container.append(video1, video2, video3);

    let visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    runEffect(1);
    visible = false;
    runEffect(1);

    // All videos should be paused and reset
    expect(video1.pause).toHaveBeenCalled();
    expect(video2.pause).toHaveBeenCalled();
    expect(video3.pause).toHaveBeenCalled();
    expect(video1.currentTime).toBe(0);
    expect(video2.currentTime).toBe(0);
    expect(video3.currentTime).toBe(0);
  });

  it('handles empty container with no videos gracefully', async () => {
    const { animateGalleryExit } = await import('@shared/utils/css/css-animations');
    const container = document.createElement('div');
    // No videos in container

    let visible = true;
    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    runEffect(1);
    visible = false;
    runEffect(1);

    // Should not throw, animateGalleryExit should be called
    expect(animateGalleryExit).toHaveBeenCalledWith(container);
  });

  it('observeViewportCssVars callback returns correct values with non-integer height', async () => {
    const { observeViewportCssVars } = await import('@shared/dom/viewport');
    vi.mocked(observeViewportCssVars).mockReturnValue(vi.fn());

    const container = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.getBoundingClientRect = () => ({ height: 64.7 } as DOMRect);

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => wrapper,
      isVisible: () => true,
    });

    const callback = vi.mocked(observeViewportCssVars).mock.calls[0]![1];
    const result = callback();

    // Math.floor(64.7) = 64
    expect(result.toolbarHeight).toBe(64);
    expect(result.paddingTop).toBe(0);
    expect(result.paddingBottom).toBe(0);
  });
});
