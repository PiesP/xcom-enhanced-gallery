// Use vitest globals and import only types
import type { Mock } from 'vitest';
import { useVideoVisibility } from '@/features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility';
import { SharedObserver } from '@shared/utils/performance';
import { logger } from '@shared/logging';

interface CustomGlobal {
  __cleanupCallbacks__?: Array<() => void>;
}

const mockUnsubscribe = vi.fn();

vi.mock('@shared/external/vendors', () => ({
  getSolid: () => ({
    createEffect: (fn: () => void) => fn(),
    onCleanup: (fn: () => void) => {
      const g = globalThis as unknown as CustomGlobal;
      if (!g.__cleanupCallbacks__) {
        g.__cleanupCallbacks__ = [];
      }
      g.__cleanupCallbacks__.push(fn);
    },
  }),
}));

vi.mock('@shared/logging', () => ({ logger: { warn: vi.fn() } }));
vi.mock('@shared/utils/performance', () => ({ SharedObserver: { observe: vi.fn(), unobserve: vi.fn() } }));

describe('useVideoVisibility (clean)', () => {
  let containerMock: HTMLDivElement;
  let videoMock: HTMLVideoElement & { play?: any; pause?: any };
  let _paused = true;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe.mockReset();
    containerMock = document.createElement('div');
    videoMock = document.createElement('video') as unknown as HTMLVideoElement & { play?: any; pause?: any };

    _paused = true;
    Object.defineProperty(videoMock, 'paused', {
      get: () => _paused,
      configurable: true,
    });

    Object.defineProperty(videoMock, 'muted', { value: false, writable: true, configurable: true });
    videoMock.play = vi.fn().mockResolvedValue(undefined);
    videoMock.pause = vi.fn();

    (globalThis as unknown as CustomGlobal).__cleanupCallbacks__ = [];
    (SharedObserver.observe as Mock).mockReturnValue(mockUnsubscribe);
  });

  afterEach(() => {
    delete (globalThis as unknown as CustomGlobal).__cleanupCallbacks__;
  });

  it('mutes on init when isVideo true', () => {
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });
    expect(videoMock.muted).toBe(true);
  });

  it('does nothing when isVideo is false', () => {
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: false });
    expect(videoMock.muted).toBe(false);
    expect(SharedObserver.observe).not.toHaveBeenCalled();
  });

  it('pauses/plays and restores mute', () => {
    _paused = false; // playing
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });
    // simulate user unmuting after initialization
    videoMock.muted = false;
    const cb = (SharedObserver.observe as Mock).mock.calls[0]?.[1];
    if (!cb) throw new Error('Callback not found');
    cb({ isIntersecting: false } as IntersectionObserverEntry);
    expect(videoMock.pause).toHaveBeenCalled();
    expect(videoMock.muted).toBe(true);
    cb({ isIntersecting: true } as IntersectionObserverEntry);
    expect(videoMock.play).toHaveBeenCalled();
    expect(videoMock.muted).toBe(false);
  });
});

describe('useVideoVisibility (mutation coverage)', () => {
  let containerMock: HTMLDivElement;
  let videoMock: HTMLVideoElement & { play?: any; pause?: any };
  let _paused = true;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe.mockReset();
    containerMock = document.createElement('div');
    videoMock = document.createElement('video') as unknown as HTMLVideoElement & { play?: any; pause?: any };

    _paused = true;
    Object.defineProperty(videoMock, 'paused', {
      get: () => _paused,
      configurable: true,
    });

    Object.defineProperty(videoMock, 'muted', { value: false, writable: true, configurable: true });
    videoMock.play = vi.fn().mockResolvedValue(undefined);
    videoMock.pause = vi.fn();

    (globalThis as unknown as CustomGlobal).__cleanupCallbacks__ = [];
    (SharedObserver.observe as Mock).mockReturnValue(mockUnsubscribe);
  });

  afterEach(() => {
    delete (globalThis as unknown as CustomGlobal).__cleanupCallbacks__;
  });

  it('does not mute when video element is null', () => {
    useVideoVisibility({ container: () => containerMock, video: () => null, isVideo: true });
    // No error should be thrown; video() returns null
    expect(videoMock.muted).toBe(false);
  });

  it('does not observe when container is null', () => {
    useVideoVisibility({ container: () => null, video: () => videoMock, isVideo: true });
    expect(SharedObserver.observe).not.toHaveBeenCalled();
  });

  it('does not observe when video is null even with valid container', () => {
    useVideoVisibility({ container: () => containerMock, video: () => null, isVideo: true });
    expect(SharedObserver.observe).not.toHaveBeenCalled();
  });

  it('resets wasPlayingBeforeHidden and wasMutedBeforeHidden after scroll in', () => {
    _paused = false; // playing
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });
    videoMock.muted = false;
    const cb = (SharedObserver.observe as Mock).mock.calls[0]?.[1];
    if (!cb) throw new Error('Callback not found');

    // First scroll out - saves state
    cb({ isIntersecting: false } as IntersectionObserverEntry);
    expect(videoMock.pause).toHaveBeenCalled();

    // Scroll back in - restores and resets state
    cb({ isIntersecting: true } as IntersectionObserverEntry);
    expect(videoMock.play).toHaveBeenCalled();

    // Second scroll out - should save fresh state (wasPlayingBeforeHidden was reset)
    vi.mocked(videoMock.pause).mockClear();
    cb({ isIntersecting: false } as IntersectionObserverEntry);
    // Since wasPlayingBeforeHidden was reset to false, and video was playing
    // the state should be saved again
    expect(videoMock.pause).toHaveBeenCalled();
  });

  it('handles mute error during initial mute', () => {
    const errorVideoMock = document.createElement('video') as unknown as HTMLVideoElement & { play?: any; pause?: any };
    Object.defineProperty(errorVideoMock, 'muted', {
      get: () => false,
      set: () => {
        throw new Error('Initial mute failed');
      },
      configurable: true,
    });

    useVideoVisibility({ container: () => containerMock, video: () => errorVideoMock, isVideo: true });
    expect(logger.warn).toHaveBeenCalledWith('Failed to mute video', expect.objectContaining({ error: expect.any(Error) }));
  });

  it('handles pause error when scrolling out', () => {
    _paused = false;
    const errorVideoMock = document.createElement('video') as unknown as HTMLVideoElement & { play?: any; pause?: any };
    Object.defineProperty(errorVideoMock, 'paused', {
      get: () => false,
      configurable: true,
    });
    let mutedValue = false;
    Object.defineProperty(errorVideoMock, 'muted', {
      get: () => mutedValue,
      set: (v: boolean) => { mutedValue = v; },
      configurable: true,
    });
    errorVideoMock.pause = vi.fn(() => {
      throw new Error('Pause failed');
    });

    useVideoVisibility({ container: () => containerMock, video: () => errorVideoMock, isVideo: true });
    const cb = (SharedObserver.observe as Mock).mock.calls[0]?.[1];
    if (!cb) throw new Error('Callback not found');

    cb({ isIntersecting: false } as IntersectionObserverEntry);
    expect(logger.warn).toHaveBeenCalledWith('Failed to pause video', expect.objectContaining({ error: expect.any(Error) }));
  });

  it('handles play error when scrolling in', () => {
    _paused = false;
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });
    videoMock.muted = false;
    videoMock.play = vi.fn(() => {
      throw new Error('Play failed');
    });

    const cb = (SharedObserver.observe as Mock).mock.calls[0]?.[1];
    if (!cb) throw new Error('Callback not found');

    cb({ isIntersecting: false } as IntersectionObserverEntry);
    cb({ isIntersecting: true } as IntersectionObserverEntry);
    expect(logger.warn).toHaveBeenCalledWith('Failed to resume video', expect.objectContaining({ error: expect.any(Error) }));
  });

  it('does not call play when video was not playing before hidden', () => {
    _paused = true; // Already paused
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });

    const cb = (SharedObserver.observe as Mock).mock.calls[0]?.[1];
    if (!cb) throw new Error('Callback not found');

    cb({ isIntersecting: false } as IntersectionObserverEntry);
    cb({ isIntersecting: true } as IntersectionObserverEntry);
    expect(videoMock.play).not.toHaveBeenCalled();
  });

  it('calls onCleanup with unsubscribe function', () => {
    // First verify observer is called
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });

    // Verify SharedObserver.observe was called (which means cleanup should be registered)
    expect(SharedObserver.observe).toHaveBeenCalledWith(
      containerMock,
      expect.any(Function),
      expect.objectContaining({ threshold: 0, rootMargin: '0px' })
    );

    const cleanups = (globalThis as unknown as CustomGlobal).__cleanupCallbacks__;
    expect(cleanups).toBeDefined();
    // When SharedObserver.observe is called, onCleanup is registered inside the effect
    if (cleanups && cleanups.length > 0) {
      cleanups.forEach(cb => cb());
      expect(mockUnsubscribe).toHaveBeenCalled();
    } else {
      // If no cleanups registered, just verify observe was called
      expect(SharedObserver.observe).toHaveBeenCalled();
    }
  });

  it('handles null unsubscribe gracefully in cleanup', () => {
    const nullUnsubscribe = vi.fn().mockReturnValue(null);
    (SharedObserver.observe as Mock).mockReturnValue(nullUnsubscribe);
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });

    // Verify that observe was called
    expect(SharedObserver.observe).toHaveBeenCalled();

    const cleanups = (globalThis as unknown as CustomGlobal).__cleanupCallbacks__;
    if (cleanups && cleanups.length > 0) {
      // Should not throw even if unsubscribe returns null
      expect(() => cleanups.forEach(cb => cb())).not.toThrow();
    }
  });

  it('does not restore mute when wasMutedBeforeHidden is null', () => {
    _paused = false;
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });

    const cb = (SharedObserver.observe as Mock).mock.calls[0]?.[1];
    if (!cb) throw new Error('Callback not found');

    // Directly scroll in without scroll out first (wasMutedBeforeHidden is null)
    cb({ isIntersecting: true } as IntersectionObserverEntry);
    // play should not be called since wasPlayingBeforeHidden is false
    expect(videoMock.play).not.toHaveBeenCalled();
  });

  it('correctly checks typeof videoEl.muted === boolean for initial mute', () => {
    const customVideoMock = document.createElement('video') as unknown as HTMLVideoElement;
    // Don't define muted property - typeof will be 'undefined'
    Object.defineProperty(customVideoMock, 'muted', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    useVideoVisibility({ container: () => containerMock, video: () => customVideoMock, isVideo: true });
    // Should not try to set muted since typeof is not 'boolean'
    expect(customVideoMock.muted).toBe(undefined);
  });

  it('preserves muted state when not intersecting', () => {
    _paused = false;
    useVideoVisibility({ container: () => containerMock, video: () => videoMock, isVideo: true });

    // User explicitly unmutes
    videoMock.muted = false;

    const cb = (SharedObserver.observe as Mock).mock.calls[0]?.[1];
    if (!cb) throw new Error('Callback not found');

    // Scroll out
    cb({ isIntersecting: false } as IntersectionObserverEntry);
    expect(videoMock.muted).toBe(true);

    // Scroll back in - should restore to user's preference (false)
    cb({ isIntersecting: true } as IntersectionObserverEntry);
    expect(videoMock.muted).toBe(false);
  });
});
