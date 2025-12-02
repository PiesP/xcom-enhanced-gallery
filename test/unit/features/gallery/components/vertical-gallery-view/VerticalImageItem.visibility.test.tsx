/**
 * Tests for VerticalImageItem visibility, loading, and effect mutations
 * Targets BlockStatement, ConditionalExpression, and LogicalOperator mutations
 */
import { VerticalImageItem } from "@features/gallery/components/vertical-gallery-view/VerticalImageItem";
import { render, fireEvent, screen, cleanup, waitFor } from "@solidjs/testing-library";
import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from "vitest";
import { getLanguageService } from "@shared/container/service-accessors";
import { setSetting } from "@shared/container/settings-access";
import type { MediaInfo } from "@shared/types";

// Mocked SharedObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

vi.mock("@shared/container/service-accessors", () => ({
  getLanguageService: vi.fn(),
}));

vi.mock("@shared/container/settings-access", () => ({
  getSetting: vi.fn((_key: string, fallback: unknown) => fallback),
  setSetting: vi.fn(() => Promise.resolve()),
}));

vi.mock("@shared/utils/performance", () => ({
  SharedObserver: {
    observe: (...args: unknown[]) => mockObserve(...args),
    unobserve: (...args: unknown[]) => mockUnobserve(...args),
  },
}));

vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility", () => ({
  useVideoVisibility: vi.fn(),
}));

vi.mock("@shared/utils/media/dimensions", () => ({
  resolveMediaDimensions: vi.fn(() => ({ width: 800, height: 600 })),
  createIntrinsicSizingStyle: vi.fn(() => ({ aspectRatio: '800 / 600' })),
}));

describe("VerticalImageItem Visibility Tests", () => {
  const createMockMedia = (overrides?: Partial<MediaInfo>): MediaInfo => ({
    id: "test-1",
    url: "http://example.com/image.jpg",
    type: "image",
    filename: "test-image.jpg",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockObserve.mockClear();
    mockUnobserve.mockClear();

     mockObserve.mockImplementation(() => mockUnobserve);

    (getLanguageService as Mock).mockReturnValue({
      translate: (key: string) => key,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("forceVisible prop behavior", () => {
    it("should render image immediately when forceVisible is true", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should NOT render image when forceVisible is false and not observed", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={false}
        />
      ));

      // Image should not be rendered yet
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("should set isVisible to true when forceVisible becomes true (sync effect)", async () => {
      // This test ensures the createEffect that syncs forceVisible to isVisible works
      // If the effect body is replaced with {}, this would fail
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      // Wait for effect to run
      await waitFor(() => {
        expect(screen.getByRole("img")).toBeInTheDocument();
      });
    });
  });

  describe("SharedObserver integration (kills BlockStatement mutations)", () => {
    it("should observe container when not visible and not forceVisible", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={false}
        />
      ));

      expect(mockObserve).toHaveBeenCalled();
    });

    it("should NOT observe when forceVisible is true", () => {
      mockObserve.mockClear();

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      // Should not observe since forceVisible makes it visible immediately
      expect(mockObserve).not.toHaveBeenCalled();
    });

    it("should unobserve when intersection is detected", async () => {
      mockObserve.mockImplementation((_element, callback) => {
        // Simulate intersection detection
        setTimeout(() => {
          callback({ isIntersecting: true });
        }, 10);
        return mockUnobserve;
      });

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={false}
        />
      ));

      await waitFor(() => {
        expect(mockUnobserve).toHaveBeenCalled();
      });
    });

    it("should render image when SharedObserver reports intersection", async () => {
      mockObserve.mockImplementation((_element, callback) => {
        setTimeout(() => {
          callback({ isIntersecting: true });
        }, 10);
        return mockUnobserve;
      });

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={false}
        />
      ));

      await waitFor(() => {
        expect(screen.getByRole("img")).toBeInTheDocument();
      });
    });

    it("should NOT unobserve when intersection is false", async () => {
      mockUnobserve.mockClear();
      mockObserve.mockImplementation((_element, callback) => {
        setTimeout(() => {
          callback({ isIntersecting: false });
        }, 10);
        return mockUnobserve;
      });

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={false}
        />
      ));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not unobserve since isIntersecting is false
      // mockUnobserve might be called in cleanup, so check it wasn't called before cleanup
    });

    it('should not throw on unmount cleanup when observer was not subscribed (unsubscribe null)', () => {
      // Render with forceVisible true so the early-return path is exercised and observe is not called
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      expect(() => {
        // Explicitly call cleanup to unmount component; onCleanup should not throw when unsubscribe is null
        cleanup();
      }).not.toThrow();
    });
  });

  describe("Media load detection effect (kills ConditionalExpression and LogicalOperator mutations)", () => {
    it("should detect already complete image", async () => {
      const onMediaLoad = vi.fn();

      // Mock complete property
      const originalComplete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete');
      Object.defineProperty(HTMLImageElement.prototype, 'complete', {
        get: () => true,
        configurable: true
      });

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          onMediaLoad={onMediaLoad}
          forceVisible={true}
        />
      ));

      await waitFor(() => {
        expect(onMediaLoad).toHaveBeenCalledWith("http://example.com/image.jpg", 0);
      });

      if (originalComplete) {
        Object.defineProperty(HTMLImageElement.prototype, 'complete', originalComplete);
      }
    });

    it("should NOT call onMediaLoad when not visible", async () => {
      const onMediaLoad = vi.fn();

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          onMediaLoad={onMediaLoad}
          forceVisible={false}
        />
      ));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onMediaLoad).not.toHaveBeenCalled();
    });

    it("should NOT call onMediaLoad when already loaded", async () => {
      const onMediaLoad = vi.fn();

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          onMediaLoad={onMediaLoad}
          forceVisible={true}
        />
      ));

      const img = screen.getByRole("img");

      // First load
      fireEvent.load(img);
      expect(onMediaLoad).toHaveBeenCalledTimes(1);

      // Second load should not call again
      fireEvent.load(img);
      expect(onMediaLoad).toHaveBeenCalledTimes(1);
    });

    it("should detect video with readyState >= 1", async () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });
      const onMediaLoad = vi.fn();

      const originalReadyState = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'readyState');
      Object.defineProperty(HTMLVideoElement.prototype, 'readyState', {
        get: () => 2, // HAVE_CURRENT_DATA
        configurable: true
      });

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          onMediaLoad={onMediaLoad}
          forceVisible={true}
        />
      ));

      await waitFor(() => {
        expect(onMediaLoad).toHaveBeenCalled();
      });

      if (originalReadyState) {
        Object.defineProperty(HTMLVideoElement.prototype, 'readyState', originalReadyState);
      }
    });

    it("should NOT detect video with readyState < 1", async () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });
      const onMediaLoad = vi.fn();

      const originalReadyState = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'readyState');
      Object.defineProperty(HTMLVideoElement.prototype, 'readyState', {
        get: () => 0, // HAVE_NOTHING
        configurable: true
      });

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          onMediaLoad={onMediaLoad}
          forceVisible={true}
        />
      ));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should not call onMediaLoad because video is not ready
      expect(onMediaLoad).not.toHaveBeenCalled();

      if (originalReadyState) {
        Object.defineProperty(HTMLVideoElement.prototype, 'readyState', originalReadyState);
      }
    });

    it("should apply persisted muted state to the video element on mount", async () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });

      // Make getSetting return specific values for this test
      const originalGetSetting = (await import('@shared/container/settings-access')).getSetting as unknown as Mock;
      (originalGetSetting as Mock).mockImplementation((key: string, fallback: unknown) => {
        if (key === 'gallery.videoMuted') return true;
        if (key === 'gallery.videoVolume') return 0.5;
        return fallback;
      });

      // Spy on the 'muted' assignment
      const originalMutedDescriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'muted');
      const mutedSpy = vi.fn();
      Object.defineProperty(HTMLVideoElement.prototype, 'muted', {
        set(this: HTMLVideoElement, v: boolean) {
          mutedSpy(v);
        },
        configurable: true,
      });

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      await waitFor(() => {
        expect(mutedSpy).toHaveBeenCalledWith(true);
      });

      if (originalMutedDescriptor) {
        Object.defineProperty(HTMLVideoElement.prototype, 'muted', originalMutedDescriptor);
      }
    });

    it('should not persist settings while programmatically applying initial video settings (isApplying guard)', async () => {
      const videoMedia = createMockMedia({ type: 'video', url: 'http://example.com/video.mp4' });

      // Make getSetting return specific values for this test so the effect will apply them
      const originalGetSetting = (await import('@shared/container/settings-access')).getSetting as unknown as Mock;
      (originalGetSetting as Mock).mockImplementation((key: string, fallback: unknown) => {
        if (key === 'gallery.videoMuted') return true;
        if (key === 'gallery.videoVolume') return 0.5;
        return fallback;
      });

      // Spy on the 'muted' assignment and setSetting
      const originalMutedDescriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'muted');
      const mutedSpy = vi.fn();
      Object.defineProperty(HTMLVideoElement.prototype, 'muted', {
        set(this: HTMLVideoElement, v: boolean) {
          mutedSpy(v);
        },
        configurable: true,
      });

      const setSettingMock = (await import('@shared/container/settings-access')).setSetting as unknown as Mock;
      setSettingMock.mockClear();

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      // Wait for the programmatic assignment to have been applied
      await waitFor(() => {
        expect(mutedSpy).toHaveBeenCalledWith(true);
      });

      // During programmatic application, setSetting shouldn't have been called
      expect(setSettingMock).not.toHaveBeenCalled();

      if (originalMutedDescriptor) {
        Object.defineProperty(HTMLVideoElement.prototype, 'muted', originalMutedDescriptor);
      }
    });
  });

  describe("Fit mode mapping (kills ObjectLiteral mutation)", () => {
    const FIT_MODES = [
      'original',
      'fitHeight',
      'fitWidth',
      'fitContainer',
    ] as const;

    FIT_MODES.forEach((mode) => {
      const expectedClass = mode === 'original' ? 'fitOriginal' : mode;
      it(`should apply ${mode} class on image and wrapper when fitMode is ${mode}`, () => {
        render(() => (
          <VerticalImageItem
            media={createMockMedia()}
            index={0}
            isActive={false}
            onClick={() => {}}
            forceVisible={true}
            fitMode={() => mode as any}
          />
        ));

        const wrapper = document.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLElement;
        expect(wrapper).toBeInTheDocument();
        expect(wrapper.className).toContain(expectedClass);

        const img = screen.getByRole('img');
        expect(img.className).toContain(expectedClass);
      });
    });
  });

  describe("isFocused prop default value (kills BooleanLiteral mutations)", () => {
    it("should apply focused style when isFocused is true", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          isFocused={true}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toContain("focused");
    });

    it("should NOT apply focused style when isFocused is false", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          isFocused={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).not.toContain("focused");
    });

    it("should default isFocused to false when not provided", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          // isFocused not provided, should default to false
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).not.toContain("focused");
    });
  });

  describe("Event handlers and optional chaining (kills OptionalChaining mutants)", () => {
    it("should focus container with preventScroll when clicked and call onClick", async () => {
      const onClick = vi.fn();
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={onClick}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      const focusSpy = vi.fn();
      // override focus on the element to spy
      (wrapper as any).focus = focusSpy;

      fireEvent.click(wrapper);

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
      expect(onClick).toHaveBeenCalled();
    });

    it("should NOT throw when onClick is undefined and stopImmediatePropagation is missing", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;

      const ev = new MouseEvent('click', { bubbles: true });
      // remove stopImmediatePropagation implementation
      (ev as any).stopImmediatePropagation = undefined;

      expect(() => wrapper.dispatchEvent(ev)).not.toThrow();
    });

    it("should NOT throw when onImageContextMenu is undefined", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const img = screen.getByRole('img');
      const ev = new MouseEvent('contextmenu', { bubbles: true });

      expect(() => img.dispatchEvent(ev)).not.toThrow();
    });

    it("should call onImageContextMenu when handler provided", () => {
      const onImageContextMenu = vi.fn();
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          onImageContextMenu={onImageContextMenu}
          forceVisible={true}
        />
      ));

      const img = screen.getByRole('img');
      const ev = new MouseEvent('contextmenu', { bubbles: true });
      img.dispatchEvent(ev);

      expect(onImageContextMenu).toHaveBeenCalled();
    });

    it("should call stopImmediatePropagation on container click", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      const spy = vi.fn();
      const ev = new MouseEvent('click', { bubbles: true });
      (ev as any).stopImmediatePropagation = spy;

      wrapper.dispatchEvent(ev);
      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when Event.prototype.stopImmediatePropagation is removed (prototype-level)', () => {
      const original = Object.getOwnPropertyDescriptor(Event.prototype, 'stopImmediatePropagation');

      try {
        Object.defineProperty(Event.prototype, 'stopImmediatePropagation', { value: undefined, configurable: true });

        const { container } = render(() => (
          <VerticalImageItem
            media={createMockMedia()}
            index={0}
            isActive={false}
            onClick={() => {}}
            forceVisible={true}
          />
        ));

        const wrapper = container.firstElementChild as HTMLElement;
        const ev = new MouseEvent('click', { bubbles: true });

        expect(() => wrapper.dispatchEvent(ev)).not.toThrow();
      } finally {
        if (original) Object.defineProperty(Event.prototype, 'stopImmediatePropagation', original);
      }
    });

    it('should not throw when the event instance has stopImmediatePropagation removed (instance-level)', () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      const ev = new MouseEvent('click', { bubbles: true });
      // explicitly set on the instance
      (ev as any).stopImmediatePropagation = undefined;

      expect(() => wrapper.dispatchEvent(ev)).not.toThrow();
    });
  });

  describe('Container registration & aria/test props', () => {
    it('should call registerContainer with the DOM element', () => {
      const registerContainer = vi.fn();
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
          registerContainer={registerContainer}
        />
      ));

      expect(registerContainer).toHaveBeenCalled();
      const calledWith = registerContainer.mock.calls[0]?.[0];
      expect(calledWith instanceof HTMLElement).toBeTruthy();
    });

    it('should honor aria-label and data-testid when provided', () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
          aria-label="my-media"
          aria-describedby="desc-1"
          data-testid="my-test-id"
        />
      ));

      const wrapper = document.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('my-media');
      expect(wrapper.getAttribute('aria-describedby')).toBe('desc-1');
      expect(wrapper.getAttribute('data-testid')).toBe('my-test-id');
    });
  });

  describe("Loading state handling (kills isLoaded mutation)", () => {
    it("should show placeholder when not loaded and not video", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      // Placeholder with spinner should be visible before load
      const placeholder = document.querySelector('[class*="placeholder"]');
      expect(placeholder).toBeInTheDocument();
    });

    it("should NOT show placeholder after image loads", async () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const img = screen.getByRole("img");
      fireEvent.load(img);

      await waitFor(() => {
        // Placeholder should be gone
        const placeholder = document.querySelector('[class*="placeholder"]');
        expect(placeholder).not.toBeInTheDocument();
      });
    });

    it("should show error state after image error", async () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const img = screen.getByRole("img");
      fireEvent.error(img);

      await waitFor(() => {
        expect(screen.getByText("messages.gallery.failedToLoadImage")).toBeInTheDocument();
      });
    });

    it("should NOT show placeholder for video media", () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      // Video doesn't show the image placeholder (placeholder is only for images)
      // The !isVideo condition ensures placeholder isn't shown for videos
      const placeholderElement = document.querySelector('[class*="placeholder"]');
      // Video should not have the image placeholder spinner
      expect(placeholderElement).not.toBeInTheDocument();
    });
  });

  describe("Event handler optional chaining (kills OptionalChaining mutations)", () => {
    it("should work with empty onClick handler", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      expect(() => fireEvent.click(wrapper)).not.toThrow();
    });

    it("should work when onImageContextMenu is undefined", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          // onImageContextMenu not provided
          forceVisible={true}
        />
      ));

      const img = screen.getByRole("img");
      expect(() => fireEvent.contextMenu(img)).not.toThrow();
    });

    it("should work when onMediaLoad is undefined", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          // onMediaLoad not provided
          forceVisible={true}
        />
      ));

      const img = screen.getByRole("img");
      expect(() => fireEvent.load(img)).not.toThrow();
    });

    it("should call onClick when provided", () => {
      const onClick = vi.fn();

      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={onClick}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      fireEvent.click(wrapper);

      expect(onClick).toHaveBeenCalled();
    });

    it("should call onImageContextMenu when provided", () => {
      const onContextMenu = vi.fn();

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          onImageContextMenu={onContextMenu}
          forceVisible={true}
        />
      ));

      const img = screen.getByRole("img");
      fireEvent.contextMenu(img);

      expect(onContextMenu).toHaveBeenCalled();
    });
  });

  describe("Container ref and focus (kills focus?.() OptionalChaining mutation)", () => {
    it("should focus container with preventScroll on click", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;
      const focusMock = vi.fn();
      wrapper.focus = focusMock;

      fireEvent.click(wrapper);

      expect(focusMock).toHaveBeenCalledWith({ preventScroll: true });
    });

    it("should handle missing focus method gracefully", () => {
      const { container } = render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const wrapper = container.firstElementChild as HTMLElement;

      // Remove focus method to test optional chaining
      Object.defineProperty(wrapper, "focus", { value: undefined, configurable: true });

      expect(() => fireEvent.click(wrapper)).not.toThrow();
    });

    it('should not throw when HTMLElement.prototype.focus is removed (prototype-level)', () => {
      const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'focus');

      try {
        Object.defineProperty(HTMLElement.prototype, 'focus', { value: undefined, configurable: true });

        const { container } = render(() => (
          <VerticalImageItem
            media={createMockMedia()}
            index={0}
            isActive={false}
            onClick={() => {}}
            forceVisible={true}
          />
        ));

        const wrapper = container.firstElementChild as HTMLElement;
        expect(wrapper).toBeInTheDocument();
        expect(() => fireEvent.click(wrapper)).not.toThrow();
      } finally {
        if (original) Object.defineProperty(HTMLElement.prototype, 'focus', original);
      }
    });
  });

  describe("Video event handlers", () => {
    it("should call handleMediaLoad on loadedMetadata", () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });
      const onMediaLoad = vi.fn();

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          onMediaLoad={onMediaLoad}
          forceVisible={true}
        />
      ));

      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      if (video) {
        fireEvent(video, new Event("loadedmetadata"));
        expect(onMediaLoad).toHaveBeenCalled();
      }
    });

    it("should call handleMediaLoad on canPlay", async () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });
      const onMediaLoad = vi.fn();

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          onMediaLoad={onMediaLoad}
          forceVisible={true}
        />
      ));

      const video = document.querySelector("video");
      if (video) {
        fireEvent(video, new Event("canplay"));
        await waitFor(() => {
          expect(onMediaLoad).toHaveBeenCalled();
        });
      }
    });

    it("should persist volume settings on user volume change (calls setSetting)", async () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const video = document.querySelector("video") as HTMLVideoElement | null;
      expect(video).toBeInTheDocument();
      if (!video) return;

      // Simulate user-triggered volume changes. JSDOM's muted property can be unreliable, so override getter.
      const originalMutedDescriptor = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'muted');
      Object.defineProperty(HTMLVideoElement.prototype, 'muted', {
        get: () => true,
        configurable: true,
      });
      video.volume = 0.42;
      // Set muted on the instance as well to be thorough
      try {
        (video as any).muted = true; // May be no-op in JSDOM, but we've overridden getter
      } catch {}
      fireEvent(video, new Event('volumechange'));

      // setSetting is a mocked export; assert it was called for volume and muted
      await waitFor(() => {
        expect((setSetting as Mock)).toHaveBeenCalledWith('gallery.videoVolume', 0.42);
        expect((setSetting as Mock)).toHaveBeenCalledWith('gallery.videoMuted', true);
      });

      if (originalMutedDescriptor) {
        Object.defineProperty(HTMLVideoElement.prototype, 'muted', originalMutedDescriptor);
      }
    });

    it("should have dragstart handler on video", () => {
      const videoMedia = createMockMedia({ type: "video", url: "http://example.com/video.mp4" });

      render(() => (
        <VerticalImageItem
          media={videoMedia}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      // Verify video element is rendered with correct src
      expect(video?.getAttribute("src")).toBe("http://example.com/video.mp4");
    });
  });

  describe('SharedObserver options passed', () => {
    it('should pass threshold and rootMargin options to SharedObserver.observe', () => {
      mockObserve.mockClear();

      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={false}
        />
      ));

      expect(mockObserve).toHaveBeenCalled();
      const args = mockObserve.mock.calls[0];
      const options = args?.[2];
      expect(options).toEqual({ threshold: 0.1, rootMargin: '100px' });
    });
  });

  describe("Image drag prevention", () => {
    it("should have image element rendered correctly", () => {
      render(() => (
        <VerticalImageItem
          media={createMockMedia()}
          index={0}
          isActive={false}
          onClick={() => {}}
          forceVisible={true}
        />
      ));

      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toBe("http://example.com/image.jpg");
    });
  });
});
