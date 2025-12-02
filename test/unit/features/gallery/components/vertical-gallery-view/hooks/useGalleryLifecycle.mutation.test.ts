import { useGalleryLifecycle } from '@features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle';

const effectRunners: Array<() => void> = [];

vi.mock('@shared/dom/utils', () => ({
  ensureGalleryScrollAvailable: vi.fn(),
}));

vi.mock('@shared/dom/viewport', () => ({
  observeViewportCssVars: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createEffect: (effect: () => void) => {
    effectRunners.push(effect);
    effect();
  },
  onCleanup: () => {},
  on: (
    sources: unknown,
    fn: (value: unknown) => void,
    options?: { defer?: boolean }
  ) => {
    let primed = !(options?.defer ?? false);
    const resolve = (source: unknown) => {
      if (typeof source === 'function') {
        return (source as () => unknown)();
      }
      return source;
    };
    return () => {
      const current = Array.isArray(sources)
        ? sources.map(resolve)
        : resolve(sources);

      if (!primed) {
        primed = true;
        return;
      }

      fn(current as never);
    };
  },
}));

vi.mock('@shared/utils/css/css-animations', () => ({
  animateGalleryEnter: vi.fn(),
  animateGalleryExit: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('useGalleryLifecycle (mutation)', () => {
  beforeEach(() => {
    effectRunners.length = 0;
    vi.clearAllMocks();
  });

  it('logs warning but still runs exit animation when video cleanup fails', async () => {
    const container = document.createElement('div');
    const video = document.createElement('video');
    Object.defineProperty(video, 'pause', {
      value: vi.fn(() => {
        throw new Error('pause failed');
      }),
      writable: true,
    });
    video.currentTime = 99;
    container.append(video);

    let visible = true;

    useGalleryLifecycle({
      containerEl: () => container,
      toolbarWrapperEl: () => document.createElement('div'),
      isVisible: () => visible,
    });

    const runAnimationEffect = () => {
      const runner = effectRunners[1];
      if (!runner) {
        throw new Error('Animation effect missing');
      }
      runner();
    };

    runAnimationEffect();
    visible = false;
    runAnimationEffect();

    const { animateGalleryExit } = await import('@shared/utils/css/css-animations');
    const { logger } = await import('@shared/logging');

    expect(animateGalleryExit).toHaveBeenCalledWith(container);
    expect(video.currentTime).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith('video cleanup failed', { error: expect.any(Error) });
  });
});
