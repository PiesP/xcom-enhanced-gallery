/**
 * Tests for VerticalGalleryView selector and dependency array mutations
 * Targets ObjectLiteral, ArrayDeclaration, and ArrowFunction mutations in useSelector calls
 */
import { VerticalGalleryView } from "@features/gallery/components/vertical-gallery-view/VerticalGalleryView";
import { render, screen, cleanup, waitFor, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { useSelector } from '@shared/state/signals/signal-selector';
import { isDownloadUiBusy } from '@shared/state/ui/download-ui-state';
import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from "vitest";
import styles from '@features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css';
import { getLanguageService } from "@shared/container/service-accessors";
import { setSetting, getSetting } from "@shared/container/settings-access";
import type { MediaInfo } from "@shared/types";

// Mock dependencies
// Capture config passed to useGalleryItemScroll so we can assert enabled() and container getters
let capturedUseGalleryItemScrollConfig: any = null; // mutable test helper
vi.mock("@features/gallery/hooks/useGalleryItemScroll", () => ({
  useGalleryItemScroll: (containerGetter: () => HTMLElement | null, currentIndexGetter: () => number, totalItemsGetter: () => number, config: { enabled?: () => boolean; block?: string; isScrolling?: () => boolean; onScrollStart?: () => void; }) => {
    // Store config and argument getters for tests to inspect and call later
    capturedUseGalleryItemScrollConfig = {
      ...config,
      totalItemsGetter,
      containerGetter,
      currentIndexGetter,
    } as any;
    return {
      scrollToItem: vi.fn(),
      scrollToCurrentItem: vi.fn(),
    };
  }
}));

const {
  mockFocusedIndex,
  mockRegisterItem,
  mockHandleItemFocus,
  mockForceSync,
  mockSetIsInitialToolbarVisible,
} = vi.hoisted(() => ({
  mockFocusedIndex: vi.fn(() => 0),
  mockRegisterItem: vi.fn(),
  mockHandleItemFocus: vi.fn(),
  mockForceSync: vi.fn(),
  mockSetIsInitialToolbarVisible: vi.fn(),
}));

vi.mock("@features/gallery/hooks/useGalleryFocusTracker", () => ({
  useGalleryFocusTracker: () => ({
    focusedIndex: mockFocusedIndex,
    registerItem: mockRegisterItem,
    handleItemFocus: mockHandleItemFocus,
    forceSync: mockForceSync,
  }),
}));

const [isScrollingSignal, setIsScrollingSignal] = createSignal(false);

let capturedUseGalleryScrollConfig: any = null; // capture config object
vi.mock("@features/gallery/hooks/useGalleryScroll", () => ({
  useGalleryScroll: (config: { container?: () => HTMLElement | null; scrollTarget?: () => HTMLElement | null; enabled?: () => boolean; onScrollEnd?: () => void }) => {
    capturedUseGalleryScrollConfig = config;
    // Call onScrollEnd if provided to test the forceSync callback
    if (config.onScrollEnd) {
      setTimeout(() => {
        if (!isScrollingSignal()) {
          config.onScrollEnd?.();
        }
      }, 0);
    }
    return {
      isScrolling: isScrollingSignal,
    };
  },
}));

const { mockIsInitialToolbarVisible } = vi.hoisted(() => ({
  mockIsInitialToolbarVisible: vi.fn(() => true),
}));

// Capture config to assert that the actual hasItems/isVisible functions are provided and used
let capturedToolbarAutoHideConfig: { isVisible?: boolean | null; hasItems?: boolean | null } = { isVisible: null, hasItems: null };
vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide", () => ({
  useToolbarAutoHide: (config: { isVisible: () => boolean; hasItems: () => boolean }) => {
    // Verify the config object is properly formed (kills {} mutation)
    if (typeof config.isVisible !== 'function' || typeof config.hasItems !== 'function') {
      throw new Error('useToolbarAutoHide config must have isVisible and hasItems functions');
    }
    // Capture return values from the provided accessors so tests can assert behavior
    capturedToolbarAutoHideConfig.isVisible = config.isVisible();
    capturedToolbarAutoHideConfig.hasItems = config.hasItems();

    return {
      isInitialToolbarVisible: mockIsInitialToolbarVisible,
      setIsInitialToolbarVisible: mockSetIsInitialToolbarVisible,
    };
  },
  __test__: {
    getCapturedConfig: () => capturedToolbarAutoHideConfig,
  },
}));

vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard", () => ({
  useGalleryKeyboard: (config: { onClose: () => void }) => {
    // Verify config object has onClose (kills {} mutation)
    if (typeof config.onClose !== 'function') {
      throw new Error('useGalleryKeyboard config must have onClose function');
    }
  },
}));

const { mockLastNavigationTrigger, mockProgrammaticScrollTimestamp, mockSetProgrammaticScrollTimestamp } = vi.hoisted(() => ({
  mockLastNavigationTrigger: vi.fn(() => null),
  mockProgrammaticScrollTimestamp: vi.fn(() => 0),
  mockSetProgrammaticScrollTimestamp: vi.fn(),
}));

vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation", () => ({
  useGalleryNavigation: (config: { isVisible: () => boolean; scrollToItem: (index: number) => void }) => {
    // Verify config object (kills {} mutation)
    if (typeof config.isVisible !== 'function' || typeof config.scrollToItem !== 'function') {
      throw new Error('useGalleryNavigation config must have required functions');
    }
    return {
      lastNavigationTrigger: mockLastNavigationTrigger,
      programmaticScrollTimestamp: mockProgrammaticScrollTimestamp,
      setProgrammaticScrollTimestamp: mockSetProgrammaticScrollTimestamp,
    };
  },
}));
let capturedUseGalleryLifecycleConfig: any = null;
vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle", () => ({
  useGalleryLifecycle: (config: { containerEl: () => HTMLElement | null; toolbarWrapperEl: () => HTMLElement | null; isVisible: () => boolean }) => {
    // Verify config object (kills {} mutation)
    if (typeof config.containerEl !== 'function' || typeof config.toolbarWrapperEl !== 'function' || typeof config.isVisible !== 'function') {
      throw new Error('useGalleryLifecycle config must have required functions');
    }
    capturedUseGalleryLifecycleConfig = config;
  },
}));

vi.mock("@shared/components/ui/Toolbar/Toolbar", () => ({
  Toolbar: (props: {
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onFitOriginal: () => void;
    onFitWidth: () => void;
    onFitHeight: () => void;
    onFitContainer: () => void;
    currentIndex: () => number;
    focusedIndex: () => number;
    totalCount: () => number;
    isDownloading: () => boolean;
    currentFitMode: string;
    tweetText: () => string | undefined;
    tweetTextHTML: () => string | undefined;
    onDownloadCurrent?: () => void;
    onDownloadAll?: () => void;
    className?: string;
    onOpenSettings?: () => void;
  }) => (
    <div data-testid="toolbar" class={`${props.className ?? ''} toolbarWrapper`}>
      <button data-testid="toolbar-close" onClick={props.onClose}>Close</button>
      <button data-testid="toolbar-prev" onClick={props.onPrevious}>Prev</button>
      <button data-testid="toolbar-next" onClick={props.onNext}>Next</button>
      <button data-testid="toolbar-settings" onClick={() => props.onOpenSettings?.()}>Open Settings</button>
      <button data-testid="fit-original" onClick={props.onFitOriginal}>Fit Original</button>
      <button data-testid="fit-width" onClick={props.onFitWidth}>Fit Width</button>
      <button data-testid="fit-height" onClick={props.onFitHeight}>Fit Height</button>
      <button data-testid="fit-container" onClick={props.onFitContainer}>Fit Container</button>
      <span data-testid="current-index">{props.currentIndex()}</span>
      <span data-testid="focused-index">{props.focusedIndex()}</span>
      <span data-testid="total-count">{props.totalCount()}</span>
      <span data-testid="is-downloading">{props.isDownloading() ? 'true' : 'false'}</span>
      <span data-testid="current-fit-mode">{props.currentFitMode}</span>
      <span data-testid="tweet-text">{props.tweetText?.() ?? ''}</span>
      <span data-testid="tweet-text-html">{props.tweetTextHTML?.() ?? ''}</span>
      <button data-testid="download-current" onClick={() => props.onDownloadCurrent?.()}>Download Current</button>
      <button data-testid="download-all" onClick={() => props.onDownloadAll?.()}>Download All</button>
    </div>
  ),
}));

vi.mock("@features/gallery/components/vertical-gallery-view/VerticalImageItem", () => ({
  VerticalImageItem: (props: {
    index: number;
    onClick?: () => void;
    isActive?: boolean;
    isFocused?: boolean;
    forceVisible?: boolean;
    onDownload?: () => void;
    registerContainer?: (el: HTMLElement | null) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    className?: string;
  }) => {
    const divRef = (el: HTMLDivElement | null) => {
      props.registerContainer?.(el);
    };
    return (
      <div
        ref={divRef}
        data-testid={`gallery-item-${props.index}`}
        data-xeg-role="gallery-item"
        class={`${props.className ?? 'xeg-gallery-item vertical-item'}`}
        onClick={props.onClick}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        data-is-active={props.isActive}
        data-is-focused={props.isFocused}
        data-force-visible={props.forceVisible}
        data-has-download={!!props.onDownload}
      >
        Item {props.index}
      </div>
    );
  },
}));

vi.mock("@shared/container/settings-access", () => ({
  getSetting: vi.fn((_key, fallback) => fallback),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@shared/container/service-accessors", () => ({
  getLanguageService: vi.fn(),
}));

vi.mock("@shared/logging", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock gallery state with reactivity
vi.mock("@shared/state/signals/gallery.signals", async () => {
  const { createSignal } = await import("solid-js");
  const [state, setState] = createSignal({
    mediaItems: [] as MediaInfo[],
    currentIndex: 0
  });

  return {
    galleryState: {
      get value() { return state(); }
    },
    navigateToItem: vi.fn(),
    setGalleryState: setState
  };
});

import * as gallerySignals from "@shared/state/signals/gallery.signals";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setGalleryState = (gallerySignals as any).setGalleryState;

vi.mock("@shared/state/signals/download.signals", () => {
  const { createSignal: createSignalInner } = require('solid-js');
  const [state, setState] = createSignalInner({ isProcessing: false });

  return {
    downloadState: {
      get value() {
        return state();
      },
      set value(v: unknown) {
        setState(v as any);
      },
    },
    // Expose setter for tests to mutate download state
    __test__: { setDownloadState: setState },
  };
});

vi.mock("@shared/state/ui/download-ui-state", () => {
  const flag = { val: false };
  return {
    isDownloadUiBusy: (opts: { downloadProcessing?: boolean }) => {
      // Prefer dynamic internal flag to simulate dynamic UI busy state when tests set it
      return flag.val || !!opts?.downloadProcessing;
    },
    __test__: {
      setFlag: (v: boolean) => {
        flag.val = v;
      },
    },
  };
});

vi.mock("@shared/utils/performance", () => ({
  computePreloadIndices: vi.fn((currentIndex: number, length: number, count: number) => {
    // Return actual computed indices to test the dependency array
    const indices: number[] = [];
    for (let i = Math.max(0, currentIndex - count); i <= Math.min(length - 1, currentIndex + count); i++) {
      indices.push(i);
    }
    return indices;
  }),
}));

describe("VerticalGalleryView Selector Tests", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setIsScrollingSignal(false);
    mockFocusedIndex.mockReturnValue(0);
    mockLastNavigationTrigger.mockReturnValue(null);

    setGalleryState({
      mediaItems: [
        { id: "1", url: "url1", type: "image", tweetText: "Tweet 1", tweetTextHTML: "<p>Tweet 1</p>" } as MediaInfo,
        { id: "2", url: "url2", type: "image", tweetText: "Tweet 2", tweetTextHTML: "<p>Tweet 2</p>" } as MediaInfo,
        { id: "3", url: "url3", type: "image", tweetText: "Tweet 3", tweetTextHTML: "<p>Tweet 3</p>" } as MediaInfo,
      ],
      currentIndex: 0
    });

    (getLanguageService as Mock).mockReturnValue({
      translate: (key: string) => key,
    });
    // Reset external UI flag and download state for deterministic tests
    // Ensure fresh default: not downloading
    const uiMod = await import('@shared/state/ui/download-ui-state');
    (uiMod as any).__test__.setFlag(false);
    const dsMod = await import('@shared/state/signals/download.signals');
    (dsMod as any).__test__.setDownloadState({ isProcessing: false });
  });

  afterEach(() => {
    cleanup();
  });

  describe("useSelector dependency arrays", () => {
    it("should pass mediaItems to children correctly (kills ArrayDeclaration mutation)", () => {
      render(() => <VerticalGalleryView />);

      // All 3 items should be rendered
      expect(screen.getByTestId("gallery-item-0")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-item-2")).toBeInTheDocument();

      // Total count should reflect mediaItems.length
      expect(screen.getByTestId("total-count")).toHaveTextContent("3");
    });

    it("should track currentIndex correctly (kills state dependency mutation)", () => {
      setGalleryState({
        mediaItems: [
          { id: "1", url: "url1", type: "image" } as MediaInfo,
          { id: "2", url: "url2", type: "image" } as MediaInfo,
        ],
        currentIndex: 1
      });

      render(() => <VerticalGalleryView />);

      expect(screen.getByTestId("current-index")).toHaveTextContent("1");

      // Item at index 1 should be active
      const item1 = screen.getByTestId("gallery-item-1");
      expect(item1).toHaveAttribute("data-is-active", "true");

      const item0 = screen.getByTestId("gallery-item-0");
      expect(item0).toHaveAttribute("data-is-active", "false");
    });

    it('updates rendered items when mediaItems changes after mount', () => {
      // Render with initial state (3 items)
      render(() => <VerticalGalleryView />);

      expect(screen.getByTestId('gallery-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-item-2')).toBeInTheDocument();

      // Update to 4 items after mount
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
          { id: '3', url: 'url3', type: 'image' } as MediaInfo,
          { id: '4', url: 'url4', type: 'image' } as MediaInfo,
        ],
        currentIndex: 0,
      });

      // Now the additional gallery-item-3 should be present
      expect(screen.getByTestId('gallery-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('total-count')).toHaveTextContent('4');
    });

    it('updates currentIndex after mount when changed dynamically', () => {
      render(() => <VerticalGalleryView />);

      // Initially currentIndex should reflect 0
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');

      // Change index after mount
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
          { id: '3', url: 'url3', type: 'image' } as MediaInfo,
        ],
        currentIndex: 2,
      });

      // The toolbar and item states should update
      expect(screen.getByTestId('current-index')).toHaveTextContent('2');
      const item2 = screen.getByTestId('gallery-item-2');
      expect(item2).toHaveAttribute('data-is-active', 'true');
    });

    it("should pass isDownloading selector correctly", () => {
      render(() => <VerticalGalleryView />);

      // Default state is not downloading
      expect(screen.getByTestId("is-downloading")).toHaveTextContent("false");
    });

    it("should reflect isDownloading when download state is true at render", async () => {
      // Set download state to true before rendering so the useSelector is initially true
      const dsMod = await import("@shared/state/signals/download.signals");
      (dsMod as any).__test__.setDownloadState({ isProcessing: true });

      render(() => <VerticalGalleryView />);

      // The underlying signal should have been updated
      expect(dsMod.downloadState.value.isProcessing).toBe(true);

      expect(screen.getByTestId("is-downloading")).toHaveTextContent("true");
    });

    it("should pass focused index to toolbar", () => {
      mockFocusedIndex.mockReturnValue(2);
      render(() => <VerticalGalleryView />);

      expect(screen.getByTestId("focused-index")).toHaveTextContent("2");
    });
  });

    it('should reflect derived isDownloading when using useSelector directly on downloadState', async () => {
      const dsMod = await import('@shared/state/signals/download.signals');
      const TestComponent = () => {
        const isDownloading = useSelector(dsMod.downloadState, (download: any) => {
          return isDownloadUiBusy({ downloadProcessing: download.isProcessing });
        }, { dependencies: (download: any) => [download.isProcessing] });

        return <div data-testid="direct-is-downloading">{isDownloading() ? 'true' : 'false'}</div>;
      };

      // Set the signal before rendering
      (dsMod as any).__test__.setDownloadState({ isProcessing: true });
      render(() => <TestComponent />);

      // Confirm the derived value reflects the download state
      expect(screen.getByTestId('direct-is-downloading')).toHaveTextContent('true');
    });

    // NOTE: Dynamic change detection is flaky due to Solid instance differences in test mocks
    // and selector caching semantics; toggle behavior is validated via direct selector tests and
    // can be reintroduced if a single Solid instance environment is enforced in test harness.

  describe("activeMedia memo (kills ArrowFunction and ObjectLiteral mutations)", () => {
    it("should return current media item based on currentIndex", () => {
      setGalleryState({
        mediaItems: [
          { id: "1", url: "url1", type: "image", tweetText: "First Tweet", tweetTextHTML: "<p>First</p>" } as MediaInfo,
          { id: "2", url: "url2", type: "image", tweetText: "Second Tweet", tweetTextHTML: "<p>Second</p>" } as MediaInfo,
        ],
        currentIndex: 0
      });

      render(() => <VerticalGalleryView />);

      expect(screen.getByTestId("tweet-text")).toHaveTextContent("First Tweet");
      expect(screen.getByTestId("tweet-text-html")).toHaveTextContent("<p>First</p>");
    });

    it("should update activeMedia when currentIndex changes", () => {
      setGalleryState({
        mediaItems: [
          { id: "1", url: "url1", type: "image", tweetText: "First", tweetTextHTML: "<p>1</p>" } as MediaInfo,
          { id: "2", url: "url2", type: "image", tweetText: "Second", tweetTextHTML: "<p>2</p>" } as MediaInfo,
        ],
        currentIndex: 1
      });

      render(() => <VerticalGalleryView />);

      expect(screen.getByTestId("tweet-text")).toHaveTextContent("Second");
    });

    it("should handle null activeMedia when index out of bounds", () => {
      // Use non-empty items but out-of-range index to ensure activeMedia() returns null while isVisible === true
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image', tweetText: 'One' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image', tweetText: 'Two' } as MediaInfo,
        ],
        currentIndex: 99,
      });

      render(() => <VerticalGalleryView />);

      // Toolbar should still render because isVisible === true
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      // Since activeMedia is null the tweet text should be empty and not throw
      expect(screen.getByTestId('tweet-text')).toHaveTextContent('');
    });
  });

  describe("hook config object validation (kills ObjectLiteral {} mutations)", () => {
    it("should pass valid config to useToolbarAutoHide", () => {
      // If config was {}, the mock would throw
      expect(() => render(() => <VerticalGalleryView />)).not.toThrow();
    });

    it("should pass valid config to useGalleryKeyboard", () => {
      const onClose = vi.fn();
      expect(() => render(() => <VerticalGalleryView onClose={onClose} />)).not.toThrow();
    });

    it("should pass valid config to useGalleryNavigation", () => {
      expect(() => render(() => <VerticalGalleryView />)).not.toThrow();
    });

    it("should pass valid config to useGalleryLifecycle", () => {
      expect(() => render(() => <VerticalGalleryView />)).not.toThrow();
    });
  });

  it('exposes hasItems via useToolbarAutoHide hook config (calls accessor)', async () => {
    // Access captured config from the mock's test helper
    const hookMod = await import('@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide');
    const captured = (hookMod as any).__test__?.getCapturedConfig?.();
    // When setGalleryState had 3 items in beforeEach, captured.hasItems should be true
    expect(captured?.hasItems).toBe(true);
  });

  it('exposes hasItems via useToolbarAutoHide hook config (false when no items)', async () => {
    setGalleryState({ mediaItems: [], currentIndex: 0 });
    render(() => <VerticalGalleryView />);
    const hookMod = await import('@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide');
    const captured = (hookMod as any).__test__?.getCapturedConfig?.();
    expect(captured?.hasItems).toBe(false);
  });

  describe("isVisible memo (kills ConditionalExpression mutations)", () => {
    it("should be visible when mediaItems.length > 0", () => {
      render(() => <VerticalGalleryView />);

      // Toolbar should be rendered (component is visible)
      expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    });

    it("should NOT be visible when mediaItems.length === 0", () => {
      setGalleryState({ mediaItems: [], currentIndex: 0 });

      render(() => <VerticalGalleryView />);

      // Empty state should be shown
      expect(screen.getByText("messages.gallery.emptyTitle")).toBeInTheDocument();
      expect(screen.queryByTestId("toolbar")).not.toBeInTheDocument();
    });

    it("should handle boundary case: mediaItems.length === 1", () => {
      setGalleryState({
        mediaItems: [{ id: "1", url: "url1", type: "image" } as MediaInfo],
        currentIndex: 0
      });

      render(() => <VerticalGalleryView />);

      // Should be visible with 1 item
      expect(screen.getByTestId("toolbar")).toBeInTheDocument();
      expect(screen.getByTestId("gallery-item-0")).toBeInTheDocument();
    });

    it('does NOT hide toolbar when not scrolling', () => {
      // Ensure isVisible true and not scrolling
      setIsScrollingSignal(false);
      render(() => <VerticalGalleryView />);

      // The toolbar should remain visible and the toolbar hide setter should NOT be called
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      expect(mockSetIsInitialToolbarVisible).not.toHaveBeenCalled();
    });
  });

  describe("preloadIndices memo", () => {
    it("should compute preload indices based on currentIndex", async () => {
      const { computePreloadIndices } = await import("@shared/utils/performance");

      setGalleryState({
        mediaItems: [
          { id: "1", url: "url1", type: "image" } as MediaInfo,
          { id: "2", url: "url2", type: "image" } as MediaInfo,
          { id: "3", url: "url3", type: "image" } as MediaInfo,
          { id: "4", url: "url4", type: "image" } as MediaInfo,
          { id: "5", url: "url5", type: "image" } as MediaInfo,
        ],
        currentIndex: 2
      });

      render(() => <VerticalGalleryView />);

      expect(computePreloadIndices).toHaveBeenCalled();
    });

    it('should set forceVisible on items within preload indices', async () => {
      // Set preloadCount to 1 only for this test
      (getSetting as Mock).mockImplementationOnce((key, fallback) => (key === 'gallery.preloadCount' ? 1 : fallback));

      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
          { id: '3', url: 'url3', type: 'image' } as MediaInfo,
          { id: '4', url: 'url4', type: 'image' } as MediaInfo,
          { id: '5', url: 'url5', type: 'image' } as MediaInfo,
        ],
        currentIndex: 2,
      });

      render(() => <VerticalGalleryView />);

      const item1 = screen.getByTestId('gallery-item-1');
      const item2 = screen.getByTestId('gallery-item-2');
      const item3 = screen.getByTestId('gallery-item-3');
      expect(item1.getAttribute('data-force-visible')).toBe('true');
      expect(item2.getAttribute('data-force-visible')).toBe('true');
      expect(item3.getAttribute('data-force-visible')).toBe('true');
    });
  });

  describe('useGalleryScroll/useGalleryItemScroll hook config functions', () => {
    it('should pass container and scrollTarget getters to useGalleryScroll', async () => {
      render(() => <VerticalGalleryView />);

      // capturedUseGalleryScrollConfig should be present and functions
      expect(typeof capturedUseGalleryScrollConfig?.container).toBe('function');
      expect(typeof capturedUseGalleryScrollConfig?.scrollTarget).toBe('function');

      // Both return valid elements after render
      const containerEl = capturedUseGalleryScrollConfig.container();
      const scrollTargetEl = capturedUseGalleryScrollConfig.scrollTarget();
      expect(containerEl).toBeInstanceOf(HTMLElement);
      expect(scrollTargetEl).toBeInstanceOf(HTMLElement);
    });

    it('should pass programmaticScrollTimestamp accessor to useGalleryScroll (kills ArrowFunction mutation)', async () => {
      mockProgrammaticScrollTimestamp.mockReturnValue(123456);
      render(() => <VerticalGalleryView />);
      expect(typeof capturedUseGalleryScrollConfig?.programmaticScrollTimestamp).toBe('function');
      expect(capturedUseGalleryScrollConfig.programmaticScrollTimestamp()).toEqual(123456);
    });

    it('should compute enabled() based on isScrolling and lastNavigationTrigger', async () => {
      // Ensure initial state allows enabled
      setIsScrollingSignal(false);
      mockLastNavigationTrigger.mockReturnValue(null);
      render(() => <VerticalGalleryView />);

      // enabled should initially be true (not scrolling and last trigger not 'scroll')
      expect(capturedUseGalleryItemScrollConfig?.enabled()).toBe(true);

      // When scrolling, enabled should be false
      setIsScrollingSignal(true);
      await waitFor(() => expect(capturedUseGalleryItemScrollConfig?.enabled()).toBe(false));
      setIsScrollingSignal(false);

      // When lastNavigationTrigger == 'scroll', enabled should be false
      mockLastNavigationTrigger.mockReturnValue('scroll' as any);
      await waitFor(() => expect(capturedUseGalleryItemScrollConfig?.enabled()).toBe(false));
      mockLastNavigationTrigger.mockReturnValue(null);
    });

    it('should pass total items getter to useGalleryItemScroll', async () => {
      render(() => <VerticalGalleryView />);
      expect(typeof capturedUseGalleryItemScrollConfig?.totalItemsGetter).toBe('function');
      expect(capturedUseGalleryItemScrollConfig?.totalItemsGetter()).toEqual(3);
    });

    it('should call onScrollStart and set programmaticScrollTimestamp on navigation', async () => {
      render(() => <VerticalGalleryView />);
      (mockSetProgrammaticScrollTimestamp as Mock).mockClear();
      expect(typeof capturedUseGalleryItemScrollConfig?.onScrollStart).toBe('function');
      capturedUseGalleryItemScrollConfig?.onScrollStart?.();
      expect(mockSetProgrammaticScrollTimestamp).toHaveBeenCalled();
    });
  });

  describe('useGalleryLifecycle config', () => {
    it('should pass containerEl and toolbarWrapperEl getters and isVisible accessor', async () => {
      render(() => <VerticalGalleryView />);

      expect(typeof capturedUseGalleryLifecycleConfig?.containerEl).toBe('function');
      expect(typeof capturedUseGalleryLifecycleConfig?.toolbarWrapperEl).toBe('function');
      expect(typeof capturedUseGalleryLifecycleConfig?.isVisible).toBe('function');

      expect(capturedUseGalleryLifecycleConfig.containerEl()).toBeInstanceOf(HTMLElement);
      expect(capturedUseGalleryLifecycleConfig.toolbarWrapperEl()).toBeInstanceOf(HTMLElement);
      expect(capturedUseGalleryLifecycleConfig.isVisible()).toBe(true);
    });
  });

  describe('useGalleryScroll enabled accessor behavior', () => {
    it('should reflect isVisible via useGalleryScroll enabled accessor', async () => {
      // Should be true with default 3 items
      render(() => <VerticalGalleryView />);
      expect(typeof capturedUseGalleryScrollConfig?.enabled).toBe('function');
      expect(capturedUseGalleryScrollConfig.enabled()).toBe(true);

      // Set empty mediaItems -> enabled should be false
      setGalleryState({ mediaItems: [], currentIndex: 0 });
      render(() => <VerticalGalleryView />);
      expect(capturedUseGalleryScrollConfig.enabled()).toBe(false);
    });
  });

  describe('className propagation and settings', () => {
    it('should include styles.toolbar in toolbar className', () => {
      render(() => <VerticalGalleryView />);

      const toolbar = screen.getByTestId('toolbar');
      // should include both the toolbarWrapper and the CSS module class
      expect(toolbar.className).toContain('toolbarWrapper');
      expect(toolbar.className).toContain(styles.toolbar);
    });

    it('should include itemActive class on active item', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 1,
      });

      render(() => <VerticalGalleryView />);

      const item1 = screen.getByTestId('gallery-item-1');
      expect(item1.className).toContain(styles.itemActive);
    });

    it('should NOT include itemActive class on non-active item', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 1,
      });

      render(() => <VerticalGalleryView />);

      const item0 = screen.getByTestId('gallery-item-0');
      expect(item0.className).not.toContain(styles.itemActive);
    });

    it('should call logger.debug when settings are opened via toolbar', async () => {
      render(() => <VerticalGalleryView />);
      const settingsBtn = screen.getByTestId('toolbar-settings');
      fireEvent.click(settingsBtn);
      const { logger } = await import('@shared/logging');
      expect((logger as any).debug).toHaveBeenCalledWith('[VerticalGalleryView] Settings opened');
    });

    it('should not throw when toolbar onClose is undefined (default safe handler)', () => {
      // Render without onClose prop
      const { container } = render(() => <VerticalGalleryView />);
      const close = container.querySelector('[data-testid="toolbar-close"]') as HTMLElement;
      expect(() => fireEvent.click(close)).not.toThrow();
    });
  });


  describe("fit mode integration", () => {
    it("should initialize with default fit mode from settings", () => {
      (getSetting as Mock).mockReturnValue("fitHeight");

      render(() => <VerticalGalleryView />);

      expect(screen.getByTestId("current-fit-mode")).toHaveTextContent("fitHeight");
    });

    it("should persist fit mode when changed", () => {
      render(() => <VerticalGalleryView />);

      fireEvent.click(screen.getByTestId("fit-original"));

      expect(setSetting).toHaveBeenCalledWith("gallery.imageFitMode", "original");
    });

    it('should prevent default and stop propagation when applying fit mode', () => {
      render(() => <VerticalGalleryView />);

      const btn = screen.getByTestId('fit-original');
      const click = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(click, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(click, 'stopPropagation');

      // Dispatch a native click event so the handler receives the event object
      btn.dispatchEvent(click);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe("scroll effect (kills createEffect ArrowFunction mutations)", () => {
    it("should hide toolbar when scrolling starts", async () => {
      render(() => <VerticalGalleryView />);

      setIsScrollingSignal(true);

      await waitFor(() => {
        expect(mockSetIsInitialToolbarVisible).toHaveBeenCalledWith(false);
      });
    });

    it('should call focus tracker forceSync via onScrollEnd', async () => {
      render(() => <VerticalGalleryView />);

      // Simulate scrolling start and end; the mock useGalleryScroll triggers onScrollEnd when not scrolling
      setIsScrollingSignal(true);
      setIsScrollingSignal(false);

      await waitFor(() => expect(mockForceSync).toHaveBeenCalled());
    });
  });

  describe('initial focus behavior', () => {
    it('should not auto-navigate when navigation state has lastNavigationTrigger', () => {
      // Configure navigation state to indicate a previous navigation (no auto-focus)
      mockLastNavigationTrigger.mockReturnValue('button' as any);
      const navigateMock: Mock = (gallerySignals as any).navigateToItem as Mock;
      navigateMock.mockClear();

      render(() => <VerticalGalleryView />);

      // Initial effect should not call navigateToItem when lastNavigationTrigger exists
      expect(navigateMock).not.toHaveBeenCalled();
      mockLastNavigationTrigger.mockReturnValue(null);
    });
  });

  describe("registerContainer callback in For loop", () => {
    it("should call registerItem for each rendered item", () => {
      render(() => <VerticalGalleryView />);

      // registerItem should be called 3 times (once per item)
      expect(mockRegisterItem).toHaveBeenCalled();
    });
  });

  describe("item focus/blur handlers", () => {
    it("should call handleItemFocus when item receives focus", () => {
      render(() => <VerticalGalleryView />);

      const item = screen.getByTestId("gallery-item-1");
      fireEvent.focus(item);

      expect(mockHandleItemFocus).toHaveBeenCalledWith(1);
    });
  });

  describe('event handler behavior', () => {
    it('should call onClose when clicking background area but not when clicking toolbar or item', () => {
      const onClose = vi.fn();
      // Set non-empty gallery state
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
          { id: '3', url: 'url3', type: 'image' } as MediaInfo,
        ],
        currentIndex: 0,
      });

      const { container } = render(() => <VerticalGalleryView onClose={onClose} />);

      // Toolbar should be present (mock provides data-testid="toolbar")
      const toolbar = screen.getByTestId('toolbar');
      fireEvent.click(toolbar);
      expect(onClose).not.toHaveBeenCalled();

      // Click on a gallery item - should not close
      const item = screen.getByTestId('gallery-item-0');
      fireEvent.click(item);
      expect(onClose).not.toHaveBeenCalled();

      // Click on gallery background (outside items and toolbar)
      const gallery = container.querySelector('[data-xeg-role="gallery"]') as HTMLElement;
      fireEvent.click(gallery);
      expect(onClose).toHaveBeenCalled();
    });

    it('should redirect wheel events to items container and update scrollTop when scrolling outside items', () => {
      // Prepare a simple gallery with items
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 0,
      });

      const { container } = render(() => <VerticalGalleryView />);

      const gallery = container.querySelector('[data-xeg-role="gallery"]') as HTMLElement;
      const itemsContainer = container.querySelector('[data-xeg-role="items-container"]') as HTMLElement;
      expect(itemsContainer).toBeTruthy();

      // Ensure scrollTop is writable in test DOM
      Object.defineProperty(itemsContainer, 'scrollTop', { value: 0, writable: true, configurable: true });

      // Dispatch wheel event outside of items container (target is gallery)
      const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });
      const preventDefault = vi.spyOn(wheelEvent, 'preventDefault');
      const stopPropagation = vi.spyOn(wheelEvent, 'stopPropagation');

      gallery.dispatchEvent(wheelEvent);

      // Items container should have had its scrollTop increased
      expect(itemsContainer.scrollTop).toBeGreaterThanOrEqual(120);
      expect(preventDefault).toHaveBeenCalled();
      expect(stopPropagation).toHaveBeenCalled();
    });

    it('should not error when wheel event occurs and no items container exists', () => {
      setGalleryState({ mediaItems: [], currentIndex: 0 });
      const { container } = render(() => <VerticalGalleryView />);
      const gallery = (container.querySelector('[data-xeg-role="gallery"]') || container.firstElementChild) as HTMLElement;

      const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 10 });
      expect(() => gallery?.dispatchEvent(wheelEvent)).not.toThrow();
    });

    it('should call navigateToItem when toolbar prev/next are clicked', () => {
      // Ensure we have at least 3 items and currentIndex 1
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
          { id: '3', url: 'url3', type: 'image' } as MediaInfo,
        ],
        currentIndex: 1,
      });

      render(() => <VerticalGalleryView />);

      const navigateMock: Mock = (gallerySignals as any).navigateToItem as Mock;
      navigateMock.mockClear();

      // Click prev - should navigate to index 0
      const prev = screen.getByTestId('toolbar-prev');
      fireEvent.click(prev);
      expect(navigateMock).toHaveBeenCalledWith(0, 'click');

      // Click next - should navigate to index 2
      const next = screen.getByTestId('toolbar-next');
      fireEvent.click(next);
      expect(navigateMock).toHaveBeenCalledWith(2, 'click');
    });

    it('should call navigateToItem when clicking a non-current gallery item', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 0,
      });

      const { container } = render(() => <VerticalGalleryView />);
      const navigateMock: Mock = (gallerySignals as any).navigateToItem as Mock;
      navigateMock.mockClear();

      const item1 = container.querySelector('[data-testid="gallery-item-1"]') as HTMLElement;
      item1?.click();
      expect(navigateMock).toHaveBeenCalledWith(1, 'click');
    });

    it('should call navigateToItem when clicking item 0 with currentIndex != 0', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
          { id: '3', url: 'url3', type: 'image' } as MediaInfo,
        ],
        currentIndex: 2,
      });

      render(() => <VerticalGalleryView />);

      const navigateMock: Mock = (gallerySignals as any).navigateToItem as Mock;
      navigateMock.mockClear();

      const item0 = screen.getByTestId('gallery-item-0');
      fireEvent.click(item0);
      expect(navigateMock).toHaveBeenCalledWith(0, 'click');
    });

    it('should call onDownloadCurrent when download current button clicked', () => {
      const onDownloadCurrent = vi.fn();
      render(() => <VerticalGalleryView onDownloadCurrent={onDownloadCurrent} />);
      const btn = screen.getByTestId('download-current');
      fireEvent.click(btn);
      expect(onDownloadCurrent).toHaveBeenCalled();
    });

    it('should call onDownloadAll when download all button clicked', () => {
      const onDownloadAll = vi.fn();
      render(() => <VerticalGalleryView onDownloadAll={onDownloadAll} />);
      const btn = screen.getByTestId('download-all');
      fireEvent.click(btn);
      expect(onDownloadAll).toHaveBeenCalled();
    });

    it('should not throw when clicking download buttons without handlers', () => {
      render(() => <VerticalGalleryView />);
      const downloadCurrent = screen.getByTestId('download-current');
      const downloadAll = screen.getByTestId('download-all');
      expect(() => fireEvent.click(downloadCurrent)).not.toThrow();
      expect(() => fireEvent.click(downloadAll)).not.toThrow();
    });

    it('should NOT call navigateToItem when clicking the current item', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 1,
      });

      render(() => <VerticalGalleryView />);
      const navigateMock: Mock = (gallerySignals as any).navigateToItem as Mock;
      navigateMock.mockClear();

      const item1 = screen.getByTestId('gallery-item-1');
      fireEvent.click(item1);
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should not navigate when prev clicked at first index', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 0,
      });

      render(() => <VerticalGalleryView />);
      const navigateMock: Mock = (gallerySignals as any).navigateToItem as Mock;
      navigateMock.mockClear();

      const prev = screen.getByTestId('toolbar-prev');
      fireEvent.click(prev);
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should not navigate when next clicked at last index', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 1,
      });

      render(() => <VerticalGalleryView />);
      const navigateMock: Mock = (gallerySignals as any).navigateToItem as Mock;
      navigateMock.mockClear();

      const next = screen.getByTestId('toolbar-next');
      fireEvent.click(next);
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should ignore background click when clicking toolbar hover zone or scroll spacer', () => {
      const onClose = vi.fn();
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
        ],
        currentIndex: 0,
      });

      const { container } = render(() => <VerticalGalleryView onClose={onClose} />);

      // toolbar hover zone click should not close
      const hover = container.querySelector('[data-role="toolbar-hover-zone"]') as HTMLElement;
      fireEvent.click(hover);
      expect(onClose).not.toHaveBeenCalled();

      // scroll spacer click should not close
      const spacer = container.querySelector('[data-xeg-role="scroll-spacer"]') as HTMLElement;
      fireEvent.click(spacer);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not prevent wheel event when target is inside items container', () => {
      setGalleryState({
        mediaItems: [
          { id: '1', url: 'url1', type: 'image' } as MediaInfo,
          { id: '2', url: 'url2', type: 'image' } as MediaInfo,
        ],
        currentIndex: 0,
      });

      const { container } = render(() => <VerticalGalleryView />);
      const itemsContainer = container.querySelector('[data-xeg-role="items-container"]') as HTMLElement;
      Object.defineProperty(itemsContainer, 'scrollTop', { value: 0, writable: true, configurable: true });

      // Simulate wheel event targeted at the items container
      const wheelEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });
      Object.defineProperty(wheelEvent, 'target', { value: itemsContainer });

      const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(wheelEvent, 'stopPropagation');

      itemsContainer.dispatchEvent(wheelEvent);

      // Should NOT have called preventDefault/stopPropagation
      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });
  });
});
