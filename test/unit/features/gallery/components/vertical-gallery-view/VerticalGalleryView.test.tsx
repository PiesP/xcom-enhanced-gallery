import { VerticalGalleryView } from "@features/gallery/components/vertical-gallery-view/VerticalGalleryView";
import { useGalleryItemScroll } from "@features/gallery/hooks/useGalleryItemScroll";
import { galleryState, navigateToItem } from "@shared/state/signals/gallery.signals";
import { render, fireEvent, screen, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { getLanguageService } from "@shared/container/service-accessors";
import { setSetting } from "@shared/container/settings-access";

// Mock dependencies
vi.mock("@features/gallery/hooks/useGalleryItemScroll");

const { mockSetIsInitialToolbarVisible } = vi.hoisted(() => ({
  mockSetIsInitialToolbarVisible: vi.fn(),
}));

vi.mock("@features/gallery/hooks/useGalleryFocusTracker", () => ({
  useGalleryFocusTracker: () => ({
    focusedIndex: () => 0,
    registerItem: vi.fn(),
    handleItemFocus: vi.fn(),
    forceSync: vi.fn(),
  }),
}));

// Create signals for hooks to control them in tests
const [isScrollingSignal, setIsScrollingSignal] = createSignal(false);

vi.mock("@features/gallery/hooks/useGalleryScroll", () => ({
  useGalleryScroll: () => ({
    isScrolling: isScrollingSignal,
  }),
}));

// Mock local hooks using full paths to ensure they match the component's resolution
vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide", () => ({
  useToolbarAutoHide: () => ({
    isInitialToolbarVisible: () => true,
    setIsInitialToolbarVisible: mockSetIsInitialToolbarVisible,
  }),
}));

vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard", () => ({
  useGalleryKeyboard: () => {},
}));

vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useGalleryNavigation", () => ({
  useGalleryNavigation: () => ({
    lastNavigationTrigger: () => null,
    programmaticScrollTimestamp: () => 0,
    setProgrammaticScrollTimestamp: vi.fn(),
  }),
}));

vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle", () => ({
  useGalleryLifecycle: () => {},
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
    onDownloadCurrent: () => void;
    onDownloadAll: () => void;
  }) => (
    <div data-testid="toolbar">
      <button data-testid="toolbar-close" onClick={props.onClose}>Close</button>
      <button data-testid="toolbar-prev" onClick={props.onPrevious}>Prev</button>
      <button data-testid="toolbar-next" onClick={props.onNext}>Next</button>
      <button data-testid="fit-original" onClick={props.onFitOriginal}>Fit Original</button>
      <button data-testid="fit-width" onClick={props.onFitWidth}>Fit Width</button>
      <button data-testid="fit-height" onClick={props.onFitHeight}>Fit Height</button>
      <button data-testid="fit-container" onClick={props.onFitContainer}>Fit Container</button>
      <button data-testid="download-current" onClick={props.onDownloadCurrent}>Download</button>
      <button data-testid="download-all" onClick={props.onDownloadAll}>Download All</button>
    </div>
  ),
}));

vi.mock("@features/gallery/components/vertical-gallery-view/VerticalImageItem", () => ({
  VerticalImageItem: (props: {
    index: number;
    onClick?: () => void;
    onFocus?: () => void;
    isActive?: boolean;
    isFocused?: boolean;
    forceVisible?: boolean;
    onDownload?: () => void;
    tabIndex?: number;
  }) => (
    <div
      data-testid={`gallery-item-${props.index}`}
      onClick={props.onClick}
      onFocus={props.onFocus}
      data-is-active={props.isActive}
      data-is-focused={props.isFocused}
      tabIndex={props.tabIndex}
      data-force-visible={props.forceVisible}
      data-has-download={!!props.onDownload}
    >
      Item {props.index}
    </div>
  ),
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

// Mock gallery state
vi.mock("@shared/state/signals/gallery.signals", () => ({
  galleryState: {
    value: {
      mediaItems: [],
      currentIndex: 0,
      isOpen: true,
      isLoading: false,
      error: null,
      viewMode: "vertical",
    },
  },
  navigateToItem: vi.fn(),
  galleryIndexEvents: {
    on: vi.fn(() => vi.fn()),
    emit: vi.fn(),
  },
}));

vi.mock("@shared/state/signals/download.signals", () => ({
  downloadState: {
    value: {
      isProcessing: false,
    }
  }
}));

vi.mock("@shared/state/ui/download-ui-state", () => ({
  isDownloadUiBusy: () => false,
}));

vi.mock("@shared/utils/performance", () => ({
  computePreloadIndices: () => [0],
  SharedObserver: {
    observe: vi.fn(),
    unobserve: vi.fn(),
  },
}));

describe("VerticalGalleryView", () => {
  beforeAll(() => {
    global.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = "";
      thresholds = [];
    } as unknown as typeof IntersectionObserver;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setIsScrollingSignal(false);

    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      mediaItems: [{ url: "test.jpg" }, { url: "test2.jpg" }] as any,
      currentIndex: 0,
    };

    (useGalleryItemScroll as unknown as Mock).mockReturnValue({
      scrollToItem: vi.fn(),
      scrollToCurrentItem: vi.fn()
    });

    (getLanguageService as unknown as Mock).mockReturnValue({
      translate: (key: string) => key,
    });
  });

  it("renders empty state when no media items", () => {
    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      mediaItems: [],
    };
    render(() => <VerticalGalleryView />);
    expect(screen.getByText("messages.gallery.emptyTitle")).toBeInTheDocument();
  });

  it("renders gallery content when items exist", () => {
    render(() => <VerticalGalleryView />);
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-item-0")).toBeInTheDocument();
  });

  it("calls onClose when clicking background", () => {
    const onClose = vi.fn();
    const { container } = render(() => <VerticalGalleryView onClose={onClose} />);

    // The container itself has the click handler
    const galleryContainer = container.querySelector('[data-xeg-role="gallery"]');
    expect(galleryContainer).toBeInTheDocument();

    if (galleryContainer) {
      fireEvent.click(galleryContainer);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("does not call onClose when clicking toolbar", () => {
    const onClose = vi.fn();
    render(() => <VerticalGalleryView onClose={onClose} />);

    const toolbar = screen.getByTestId("toolbar");
    fireEvent.click(toolbar);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not call onClose when clicking toolbar wrapper", () => {
    const onClose = vi.fn();
    render(() => <VerticalGalleryView onClose={onClose} />);

    // Mock a click on an element inside toolbar wrapper
    const toolbar = screen.getByTestId("toolbar");
    // We need to simulate the structure where toolbar is inside toolbarWrapper
    // The mock Toolbar is inside a div that is inside toolbarWrapper in the real component
    // But in our test, we can just fire click on the toolbar element which is inside the wrapper
    fireEvent.click(toolbar);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("navigates to item when clicking non-current item", () => {
    render(() => <VerticalGalleryView />);

    const item1 = screen.getByTestId("gallery-item-1");
    fireEvent.click(item1);

    expect(navigateToItem).toHaveBeenCalledWith(1, "click");
  });

  it("hides toolbar when scrolling starts", async () => {
    render(() => <VerticalGalleryView />);

    // Simulate scrolling
    setIsScrollingSignal(true);

    await waitFor(() => {
      expect(mockSetIsInitialToolbarVisible).toHaveBeenCalledWith(false);
    });
  });

  it("applies fit mode when requested from toolbar", () => {
    const scrollToCurrentItem = vi.fn();
    (useGalleryItemScroll as unknown as Mock).mockReturnValue({
      scrollToItem: vi.fn(),
      scrollToCurrentItem
    });

    render(() => <VerticalGalleryView />);

    const fitWidthBtn = screen.getByTestId("fit-width");
    fireEvent.click(fitWidthBtn);

    expect(setSetting).toHaveBeenCalledWith("gallery.imageFitMode", "fitWidth");
    expect(scrollToCurrentItem).toHaveBeenCalled();
  });

  it("applies fit original mode when requested", () => {
    render(() => <VerticalGalleryView />);
    const btn = screen.getByTestId("fit-original");
    fireEvent.click(btn);
    expect(setSetting).toHaveBeenCalledWith("gallery.imageFitMode", "original");
  });

  it("applies fit height mode when requested", () => {
    render(() => <VerticalGalleryView />);
    const btn = screen.getByTestId("fit-height");
    fireEvent.click(btn);
    expect(setSetting).toHaveBeenCalledWith("gallery.imageFitMode", "fitHeight");
  });

  it("applies fit container mode when requested", () => {
    render(() => <VerticalGalleryView />);
    const btn = screen.getByTestId("fit-container");
    fireEvent.click(btn);
    expect(setSetting).toHaveBeenCalledWith("gallery.imageFitMode", "fitContainer");
  });

  it("calls onDownloadCurrent when download button is clicked", () => {
    const onDownloadCurrent = vi.fn();
    render(() => <VerticalGalleryView onDownloadCurrent={onDownloadCurrent} />);

    const downloadBtn = screen.getByTestId("download-current");
    fireEvent.click(downloadBtn);

    expect(onDownloadCurrent).toHaveBeenCalled();
  });

  it("calls onDownloadAll when download all button is clicked", () => {
    const onDownloadAll = vi.fn();
    render(() => <VerticalGalleryView onDownloadAll={onDownloadAll} />);

    const downloadAllBtn = screen.getByTestId("download-all");
    fireEvent.click(downloadAllBtn);

    expect(onDownloadAll).toHaveBeenCalled();
  });

  it("passes correct props to VerticalImageItem", () => {
    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      currentIndex: 1,
    };
    render(() => <VerticalGalleryView />);

    const item0 = screen.getByTestId("gallery-item-0");
    const item1 = screen.getByTestId("gallery-item-1");

    expect(item0).toHaveAttribute("data-is-active", "false");
    expect(item1).toHaveAttribute("data-is-active", "true");

    // focusedIndex is mocked to return 0
    expect(item0).toHaveAttribute("data-is-focused", "true");
    expect(item1).toHaveAttribute("data-is-focused", "false");
  });

  it("passes download handler to VerticalImageItem when onDownloadCurrent is provided", () => {
    const onDownloadCurrent = vi.fn();
    render(() => <VerticalGalleryView onDownloadCurrent={onDownloadCurrent} />);

    const item0 = screen.getByTestId("gallery-item-0");
    expect(item0).toHaveAttribute("data-has-download", "true");
  });

  it("does not pass download handler when onDownloadCurrent is missing", () => {
    render(() => <VerticalGalleryView />);

    const item0 = screen.getByTestId("gallery-item-0");
    expect(item0).toHaveAttribute("data-has-download", "false");
  });

  it("calls navigateToItem with previous index when Toolbar onPrevious is called", () => {
    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      currentIndex: 1,
    };
    render(() => <VerticalGalleryView onClose={() => {}} />);

    const prevBtn = screen.getByTestId("toolbar-prev");
    fireEvent.click(prevBtn);

    expect(navigateToItem).toHaveBeenCalledWith(0, "click"); // Current is 1, prev is 0
  });

  it("calls navigateToItem with next index when Toolbar onNext is called", () => {
    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      mediaItems: [{ url: "1" }, { url: "2" }, { url: "3" }] as any,
      currentIndex: 1,
    };
    render(() => <VerticalGalleryView onClose={() => {}} />);

    const nextBtn = screen.getByTestId("toolbar-next");
    fireEvent.click(nextBtn);

    expect(navigateToItem).toHaveBeenCalledWith(2, "click"); // Current is 1, next is 2
  });

  it("does not call onClose when clicking toolbar hover zone", () => {
    const onClose = vi.fn();
    const { container } = render(() => <VerticalGalleryView onClose={onClose} />);

    const hoverZone = container.querySelector('[data-role="toolbar-hover-zone"]');
    expect(hoverZone).toBeInTheDocument();

    if (hoverZone) {
      fireEvent.click(hoverZone);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('does not call onClose when clicking scroll spacer', () => {
    const onClose = vi.fn();
    const { container } = render(() => <VerticalGalleryView onClose={onClose} />);

    const scrollSpacer = container.querySelector('[data-xeg-role="scroll-spacer"]');
    expect(scrollSpacer).toBeInTheDocument();

    if (scrollSpacer) {
      fireEvent.click(scrollSpacer);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('redirects wheel events to items container when wheel target is outside items container', () => {
    const { container } = render(() => <VerticalGalleryView />);

    const galleryContainer = container.querySelector('[data-xeg-role="gallery"]');
    const itemsContainer = container.querySelector('[data-xeg-role="items-container"]');
    expect(galleryContainer).toBeInTheDocument();
    expect(itemsContainer).toBeInTheDocument();

    if (galleryContainer && itemsContainer) {
      // Ensure initial scrollTop is 0
      (itemsContainer as HTMLElement).scrollTop = 0;
      fireEvent.wheel(galleryContainer, { deltaY: 10 });
      // The handler should have added the delta to the items container scrollTop
      expect((itemsContainer as HTMLElement).scrollTop).toBe(10);
    }
  });

  it('does not redirect wheel when target is inside items container', () => {
    const { container } = render(() => <VerticalGalleryView />);

    const itemsContainer = container.querySelector('[data-xeg-role="items-container"]');
    expect(itemsContainer).toBeInTheDocument();

    if (itemsContainer) {
      (itemsContainer as HTMLElement).scrollTop = 0;
      // Dispatch wheel directly on the items container
      fireEvent.wheel(itemsContainer, { deltaY: 10 });
      // Handler should return early and not change scrollTop
      expect((itemsContainer as HTMLElement).scrollTop).toBe(0);
    }
  });

  it('logs a warning when saving fit mode fails', async () => {
    // Make setSetting reject to trigger logger.warn
    const error = new Error('boom');
    const settings = await import('@shared/container/settings-access');
    const logging = await import('@shared/logging');
    vi.mocked(settings.setSetting).mockRejectedValueOnce(error);

    render(() => <VerticalGalleryView />);
    const fitWidthBtn = screen.getByTestId('fit-width');
    fireEvent.click(fitWidthBtn);

    // Wait for promise rejection path to be processed
    await waitFor(() => {
      expect(logging.logger.warn).toHaveBeenCalledWith('Failed to save fit mode', expect.objectContaining({ error, mode: 'fitWidth' }));
    });
  });

  it("logs warning when persisting fit mode fails", async () => {
    const error = new Error("Save failed");
    vi.mocked(setSetting).mockRejectedValueOnce(error);
    const { logger } = await import("@shared/logging");

    render(() => <VerticalGalleryView />);

    const fitWidthBtn = screen.getByTestId("fit-width");
    fireEvent.click(fitWidthBtn);

    await waitFor(() => {
      expect(logger.warn).toHaveBeenCalledWith("Failed to save fit mode", { error, mode: "fitWidth" });
    });
  });

  it("calls onClose when clicking background", () => {
    const onClose = vi.fn();
    const { container } = render(() => <VerticalGalleryView onClose={onClose} />);

    // The container itself has the click handler
    const galleryContainer = container.querySelector('[data-xeg-role="gallery"]');
    expect(galleryContainer).toBeInTheDocument();

    if (galleryContainer) {
      fireEvent.click(galleryContainer);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("does not call onClose when clicking toolbar wrapper", () => {
    const onClose = vi.fn();
    render(() => <VerticalGalleryView onClose={onClose} />);

    const toolbar = screen.getByTestId("toolbar");
    fireEvent.click(toolbar);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("navigates to item when clicking a non-active media item", () => {
    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      mediaItems: [{ url: "1" }, { url: "2" }] as any,
      currentIndex: 0,
    };
    render(() => <VerticalGalleryView />);

    const item1 = screen.getByTestId("gallery-item-1");
    fireEvent.click(item1);

    expect(navigateToItem).toHaveBeenCalledWith(1, "click");
  });
});
