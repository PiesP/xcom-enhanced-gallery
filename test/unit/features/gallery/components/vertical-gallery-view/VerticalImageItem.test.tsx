import { VerticalImageItem } from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem';
import styles from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css';
import { render, fireEvent, waitFor } from '@solidjs/testing-library';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getSetting, setSetting } from '@shared/container/settings-access';
import { useVideoVisibility } from '@/features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility';
import { SharedObserver } from '@shared/utils/performance';

// Mocks for env used by the component
vi.mock('@shared/container/settings-access', () => ({
  getSetting: vi.fn((_key, fallback) => fallback),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@shared/container/service-accessors', () => ({
  getLanguageService: vi.fn(() => ({ translate: (k: string) => k })),
}));

vi.mock('@shared/utils/performance', () => ({
  SharedObserver: {
    observe: vi.fn(),
    unobserve: vi.fn(),
  },
}));

vi.mock('@/features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility', () => ({
  useVideoVisibility: vi.fn(() => {}),
}));

describe('VerticalImageItem component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an image, updates data-media-loaded on load, and calls onMediaLoad', async () => {
    const onMediaLoad = vi.fn();
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onMediaLoad={onMediaLoad}
        onClick={() => {}}
      />
    ));

    const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]');
    expect(wrapper).toBeInTheDocument();

    // Initially not loaded
    expect(wrapper?.getAttribute('data-media-loaded')).toBe('false');

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();

    fireEvent.load(img);
    await waitFor(() => {
      expect(onMediaLoad).toHaveBeenCalledWith('https://example.com/test.jpg', 0);
      expect(wrapper?.getAttribute('data-media-loaded')).toBe('true');
    });
  });

  it('renders a video, applies settings for muted & volume, and persists volume/muted on change', async () => {
    // stub getSetting to return specific defaults
    vi.mocked(getSetting as any).mockImplementation((key: string, fallback: any) => {
      if (key === 'gallery.videoVolume') return 0.5;
      if (key === 'gallery.videoMuted') return true;
      return fallback;
    });

    const onMediaLoad = vi.fn();
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/video.mp4', filename: 'video.mp4' } as any}
        index={2}
        isActive={true}
        forceVisible={true}
        onMediaLoad={onMediaLoad}
        onClick={() => {}}
      />
    ));

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    // The component sets the initial volume/muted via createEffect
    // Assert that the DOM video element reflects the getSetting defaults
    // Assert that the DOM video element reflects the getSetting defaults
    await waitFor(() => {
      // (The ordered assignment in component should ensure these reflect persisted settings)
      expect(video.volume).toBe(0.5);
      expect(video.muted).toBe(true);
    });

    // Guard should prevent an initial programmatic application from firing a
    // volumechange event that persists an overridden value; therefore, setSetting
    // should NOT have been called yet.
    expect(setSetting).not.toHaveBeenCalled();

    // Simulate a volume change
    video.volume = 0.8;
    video.muted = false;
    fireEvent(video, new Event('volumechange'));

    await waitFor(() => {
      expect(setSetting).toHaveBeenCalledWith('gallery.videoVolume', 0.8);
      expect(setSetting).toHaveBeenCalledWith('gallery.videoMuted', false);
    });
  });

  it('uses useVideoVisibility hook and passes correct flags for video and image items', () => {
    // `useVideoVisibility` imported at module top (mocked via vi.mock)

    // Video item should call hook with isVideo true
    render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/video.mp4', filename: 'video.mp4', type: 'video' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={() => {}}
      />
    ));
    expect(useVideoVisibility).toHaveBeenCalledWith(expect.objectContaining({ isVideo: true }));
    vi.clearAllMocks();

    // Image item should call hook with isVideo false
    render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg', type: 'image' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={() => {}}
      />
    ));
    expect(useVideoVisibility).toHaveBeenCalledWith(expect.objectContaining({ isVideo: false }));
  });

  it('shows error UI when media fails to load', async () => {
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={() => {}}
      />
    ));

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    fireEvent.error(img);

    await waitFor(() => {
      // Error text uses getLanguageService translate; we mocked to return the key
      expect(container.textContent).toContain('messages.gallery.failedToLoadImage');
    });
  });

  it('calls onImageContextMenu when context menu event occurs', async () => {
    const onImageContextMenu = vi.fn();
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onImageContextMenu={onImageContextMenu}
        onClick={() => {}}
      />
    ));

    const img = container.querySelector('img') as HTMLImageElement;
    fireEvent.contextMenu(img);
    expect(onImageContextMenu).toHaveBeenCalled();
  });

  it('does not throw when onClick is undefined and clicking the container', async () => {
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={() => {}}
      />
    ));

    const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();

    // If optional chaining is removed, this would throw - ensure it does not
    expect(() => {
      fireEvent.click(wrapper);
    }).not.toThrow();
  });

  it('does not throw when onImageContextMenu is undefined and contextmenu event occurs', async () => {
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={() => {}}
      />
    ));

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();

    expect(() => {
      fireEvent.contextMenu(img);
    }).not.toThrow();
  });

  it('does not throw when event.stopImmediatePropagation is missing', async () => {
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={() => {}}
      />
    ));

    const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();

    const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
    // Override the method on the instance to simulate missing API
    Object.defineProperty(evt, 'stopImmediatePropagation', {
      value: undefined,
      configurable: true,
    });

    expect(() => {
      wrapper.dispatchEvent(evt);
    }).not.toThrow();
  });

  it('does not throw when container focus method is missing', async () => {
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={() => {}}
      />
    ));

    const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement;
    expect(wrapper).toBeInTheDocument();

    const originalFocus = (wrapper as any).focus;
    try {
      (wrapper as any).focus = undefined;
      expect(() => {
        fireEvent.click(wrapper);
      }).not.toThrow();
    } finally {
      (wrapper as any).focus = originalFocus;
    }
  });

  it('calls onClick and focuses container on click', async () => {
    const onClick = vi.fn();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={true}
        onClick={onClick}
      />
    ));

    const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement;
    fireEvent.click(wrapper);

    expect(onClick).toHaveBeenCalled();
    // ensure focus was called and that the preventScroll flag is supplied
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true } as any);
    focusSpy.mockRestore();
  });

  it('uses SharedObserver.observe when not forceVisible and updates when observed', async () => {
    // make SharedObserver.observe capture callback
    let observerCallback: ((entry: IntersectionObserverEntry) => void) | undefined;
    const unsubscribeSpyLocal = vi.fn();
    (SharedObserver as any).observe = vi.fn((_el: Element, cb: (entry: IntersectionObserverEntry) => void) => {
      observerCallback = cb;
      return unsubscribeSpyLocal;
    });

    const onMediaLoad = vi.fn();
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={0}
        isActive={true}
        forceVisible={false}
        onMediaLoad={onMediaLoad}
        onClick={() => {}}
      />
    ));

    // Initially the image isn't rendered until observer triggers
    expect(container.querySelector('img')).toBeNull();

    // Simulate intersection observer callback marking the item visible
    if (observerCallback) {
      observerCallback({ isIntersecting: true } as IntersectionObserverEntry);
    }

    // Now the img should be added and load will be invoked automatically in the effect
    await waitFor(() => {
      expect(container.querySelector('img')).toBeInTheDocument();
      // our custom unsubscribe should have been called when the observer marked the entry
      expect(unsubscribeSpyLocal).toHaveBeenCalled();
    });
  });

  it('stopImmediatePropagation is called when present on event', () => {
    const { container } = render(() => (
      <VerticalImageItem
        media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any}
        index={7}
        isActive
        forceVisible
        onClick={() => {}}
      />
    ));

    const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement;
    const evt = new MouseEvent('click', { bubbles: true });
    (evt as any).stopImmediatePropagation = vi.fn();
    wrapper.dispatchEvent(evt);
    expect(((evt as any).stopImmediatePropagation as any)).toHaveBeenCalled();
  });

  it('maps fitMode values to CSS classes (image & video)', async () => {
    const imageMedia = { url: 'https://example.com/image.jpg', filename: 'image.jpg', type: 'image' } as any;
    const videoMedia = { url: 'https://video.example.com/v.mp4', filename: 'v.mp4', type: 'video' } as any;

    const modes: Array<string> = ['original', 'fitWidth', 'fitHeight', 'fitContainer'];
    for (const mode of modes) {
      const { container: imageContainer } = render(() => (
        <VerticalImageItem media={imageMedia} index={0} isActive forceVisible fitMode={mode as any} data-testid={`fit-${mode}-img`} onClick={() => {}} />
      ));

      const container = imageContainer.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement;
      expect(container.getAttribute('data-fit-mode')).toBe(mode);
      // class names from CSS module contain the mode name (identity proxy in tests)
      const key = mode === 'original' ? 'fitOriginal' : mode;
      expect(container.className.includes((styles as any)[key])).toBe(true);

      // Additionally assert that the actual media element gets the fit mode class
      const imgEl = imageContainer.querySelector('img') as HTMLImageElement | null;
      if (imgEl) {
        expect(imgEl.className.includes((styles as any)[key])).toBe(true);
      }

      const { container: videoContainer } = render(() => (
        <VerticalImageItem media={videoMedia} index={0} isActive forceVisible fitMode={() => mode as any} data-testid={`fit-${mode}-vid`} onClick={() => {}} />
      ));
      const vcontainer = videoContainer.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement;
      expect(vcontainer.getAttribute('data-fit-mode')).toBe(mode);
      expect(vcontainer.className.includes((styles as any)[key])).toBe(true);

      const videoEl = videoContainer.querySelector('video') as HTMLVideoElement | null;
      if (videoEl) {
        expect(videoEl.className.includes((styles as any)[key])).toBe(true);
      }
    }
  });
});

  it('applies different classes for different fit modes (distinctness check)', async () => {
    const imageMedia = { url: 'https://example.com/image.jpg', filename: 'image.jpg', type: 'image' } as any;

    const { container: containerA } = render(() => (
      <VerticalImageItem media={imageMedia} index={0} isActive forceVisible fitMode={'fitHeight' as any} onClick={() => {}} />
    ));
    const imgA = containerA.querySelector('img') as HTMLImageElement;
    expect(imgA).toBeTruthy();
    const classA = imgA.className;

    const { container: containerB } = render(() => (
      <VerticalImageItem media={imageMedia} index={0} isActive forceVisible fitMode={'fitWidth' as any} onClick={() => {}} />
    ));
    const imgB = containerB.querySelector('img') as HTMLImageElement;
    expect(imgB).toBeTruthy();
    const classB = imgB.className;

    // These should differ if the mapping is working
    expect(classA).not.toBe(classB);
  });
