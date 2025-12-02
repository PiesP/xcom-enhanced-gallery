import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useVideoVisibility } from '@/features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility';
import { SharedObserver } from '@/shared/utils/performance';
import { logger } from '@/shared/logging';
import { createSignal } from 'solid-js';

// Small harness component that exposes container/video refs
const UseVideoVisibilityHarness = (props: { isVideo?: boolean }) => {
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);

  // Hook under test
  useVideoVisibility({ container: containerRef, video: videoRef, isVideo: props.isVideo ?? false });

  return (
    <div>
      <div data-testid="container" ref={setContainerRef}></div>
      <video data-testid="video" ref={setVideoRef} />
    </div>
  );
};

describe('useVideoVisibility hook', () => {
  let observeMock: any = null;
  const callbacks: Array<(entry: IntersectionObserverEntry) => void> = [];

  beforeEach(() => {
    callbacks.length = 0;
    // Mock SharedObserver.observe to capture callbacks
    observeMock = vi.spyOn(SharedObserver, 'observe') as any;
    observeMock.mockImplementation((el, cb) => {
      callbacks.push(cb);
      return () => {};
    });
    vi.spyOn(logger, 'warn');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should do nothing when not a video', () => {
    render(() => <UseVideoVisibilityHarness isVideo={false} />);
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('should mute video on initialization when isVideo', () => {
    const { container } = render(() => <UseVideoVisibilityHarness isVideo={true} />);
    const video = screen.getByTestId('video') as HTMLVideoElement;
    // Ensure the element is present
    expect(video).toBeInstanceOf(HTMLVideoElement);

    // Muted flag should be set by the hook's createEffect
    // Some environments may not allow direct setting; ensure property exists and is boolean
    // The hook should have set muted to true during initialization
    expect(video.muted).toBe(true);
  });

  it('should pause when scrolled out and resume when scrolled in', async () => {
    const { container } = render(() => <UseVideoVisibilityHarness isVideo={true} />);
    const video = screen.getByTestId('video') as HTMLVideoElement;
    const containerEl = screen.getByTestId('container');

    // Make properties writable for the test environment
    Object.defineProperty(video, 'paused', { value: false, writable: true });
    Object.defineProperty(video, 'muted', { value: false, writable: true });
    video.play = vi.fn().mockResolvedValue(undefined) as unknown as typeof video.play;
    video.pause = vi.fn();

    // Confirm observer callback registered
    expect(callbacks.length).toBeGreaterThan(0);
    const cb = callbacks[0];

    // Simulate scrolled out of view
    cb({ isIntersecting: false, target: containerEl } as unknown as IntersectionObserverEntry);
    expect(video.pause).toHaveBeenCalled();
    expect(video.muted).toBe(true);

    // Reset spies
    (video.pause as unknown as vi.Mock).mockClear?.();

    // Set wasPlayingBeforeHidden to true by simulating previous playing
    Object.defineProperty(video, 'paused', { value: false, writable: true });
    // Simulate scrolled into view
    cb({ isIntersecting: true, target: containerEl } as unknown as IntersectionObserverEntry);
    expect(video.play).toHaveBeenCalled();
  });

  it('should not call pause if video already paused', () => {
    const { container } = render(() => <UseVideoVisibilityHarness isVideo={true} />);
    const video = screen.getByTestId('video') as HTMLVideoElement;
    const containerEl = screen.getByTestId('container');

    Object.defineProperty(video, 'paused', { value: true, writable: true });
    Object.defineProperty(video, 'muted', { value: false, writable: true });
    video.play = vi.fn().mockResolvedValue(undefined) as unknown as typeof video.play;
    video.pause = vi.fn();

    const cb = callbacks[0];
    cb({ isIntersecting: false, target: containerEl } as unknown as IntersectionObserverEntry);
    expect(video.pause).not.toHaveBeenCalled();
    expect(video.muted).toBe(true);
  });

  it('should handle errors when pause or mute throws', () => {
    const { container } = render(() => <UseVideoVisibilityHarness isVideo={true} />);
    const video = screen.getByTestId('video') as HTMLVideoElement;
    const containerEl = screen.getByTestId('container');

    // Muted setter will throw
    Object.defineProperty(video, 'muted', {
      get: () => true,
      set: () => {
        throw new Error('muted setter failed');
      },
    });
    Object.defineProperty(video, 'paused', { value: false, writable: true });
    video.pause = () => {
      throw new Error('pause failed');
    };

    const cb = callbacks[0];
    cb({ isIntersecting: false, target: containerEl } as unknown as IntersectionObserverEntry);
    expect(logger.warn).toHaveBeenCalled();
  });
});
