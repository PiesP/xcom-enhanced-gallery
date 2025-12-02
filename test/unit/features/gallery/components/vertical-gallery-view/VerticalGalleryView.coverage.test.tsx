import { VerticalGalleryView } from "@features/gallery/components/vertical-gallery-view/VerticalGalleryView";
import styles from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css';
import { galleryState, navigateToItem } from "@shared/state/signals/gallery.signals";
import { render, fireEvent, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { getLanguageService } from "@shared/container/service-accessors";
import type { MediaInfo } from "@shared/types";

// Mock dependencies
vi.mock("@features/gallery/hooks/useGalleryItemScroll", () => ({
  useGalleryItemScroll: () => ({
    scrollToItem: vi.fn(),
    scrollToCurrentItem: vi.fn()
  })
}));

vi.mock("@features/gallery/hooks/useGalleryFocusTracker", () => ({
  useGalleryFocusTracker: () => ({
    focusedIndex: () => 0,
    registerItem: vi.fn(),
    handleItemFocus: vi.fn(),
    forceSync: vi.fn(),
  }),
}));

vi.mock("@features/gallery/hooks/useGalleryScroll", () => ({
  useGalleryScroll: () => ({
    isScrolling: () => false,
  }),
}));

vi.mock("@features/gallery/components/vertical-gallery-view/hooks/useToolbarAutoHide", () => ({
  useToolbarAutoHide: () => ({
    isInitialToolbarVisible: () => true,
    setIsInitialToolbarVisible: vi.fn(),
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
  Toolbar: (props: { onPrevious: () => void; onNext: () => void }) => (
    <div data-testid="toolbar">
      <button data-testid="toolbar-prev" onClick={props.onPrevious}>Prev</button>
      <button data-testid="toolbar-next" onClick={props.onNext}>Next</button>
    </div>
  ),
}));

vi.mock("@features/gallery/components/vertical-gallery-view/VerticalImageItem", () => ({
  VerticalImageItem: (props: {
    index: number;
    onClick?: () => void;
  }) => (
    <div
      data-testid={`gallery-item-${props.index}`}
      onClick={props.onClick}
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
}));

describe("VerticalGalleryView Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      mediaItems: [{ url: "test.jpg" }, { url: "test2.jpg" }] as unknown as MediaInfo[],
      currentIndex: 0,
    };

    (getLanguageService as unknown as Mock).mockReturnValue({
      translate: (key: string) => key,
    });
  });

  it("should apply initial focus when visible and no navigation trigger", () => {
    render(() => <VerticalGalleryView />);
    expect(navigateToItem).toHaveBeenCalledWith(0, "click");
  });

  it("should NOT navigate previous if at index 0", () => {
    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      currentIndex: 0,
    };
    render(() => <VerticalGalleryView />);
    vi.mocked(navigateToItem).mockClear();

    const prevBtn = screen.getByTestId("toolbar-prev");
    fireEvent.click(prevBtn);

    expect(navigateToItem).not.toHaveBeenCalled();
  });

  it("should NOT navigate next if at last index", () => {
    vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      mediaItems: [{ url: "1" }, { url: "2" }] as unknown as MediaInfo[],
      currentIndex: 1,
    };
    render(() => <VerticalGalleryView />);
    vi.mocked(navigateToItem).mockClear();

    const nextBtn = screen.getByTestId("toolbar-next");
    fireEvent.click(nextBtn);

    expect(navigateToItem).not.toHaveBeenCalled();
  });

  // To test handleMediaItemClick with invalid index, we need to somehow trigger it with an invalid index.
  // Since the component renders items based on mediaItems, we can't easily click an item that doesn't exist.
  // However, we can verify that clicking the current item doesn't navigate (already covered).
  // The condition `index >= 0 && index < items.length` is defensive coding.
  // We can try to mock VerticalImageItem to call onClick with an invalid index if we could pass it,
  // but the parent controls the index passed.
  // Actually, we can just rely on the fact that the loop only produces valid indices.
  // But if we want to be sure, we can try to simulate a click on an item that somehow got a wrong index?
  // No, that's hard.
  // Let's focus on what we can control.

  it("should not navigate when clicking current item (boundary check)", async () => {
     vi.mocked(galleryState).value = {
      ...vi.mocked(galleryState).value,
      currentIndex: 0,
    };
    render(() => <VerticalGalleryView />);
    vi.mocked(navigateToItem).mockClear();
    const item0 = screen.getByTestId("gallery-item-0");
    fireEvent.click(item0);
    expect(navigateToItem).not.toHaveBeenCalled();
    // Also exercise the concrete VerticalImageItem implementation to ensure fit mode
    // mapping (object literal) is asserted in this test to kill object-literal mutants
    // when perTest selects this as the covering test.
    const mod = await vi.importActual<typeof import('@features/gallery/components/vertical-gallery-view/VerticalImageItem')>('@features/gallery/components/vertical-gallery-view/VerticalImageItem');
    const VerticalImageItem = mod.VerticalImageItem;
    const { container: vContainer } = render(() => (
      <VerticalImageItem media={{ url: 'https://example.com/test.jpg', filename: 'test.jpg' } as any} index={0} isActive forceVisible fitMode={'fitWidth' as any} onClick={() => {}} />
    ));
    const wrapper = vContainer.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement | null;
    expect(wrapper).toBeTruthy();
    // ensure the default fitMode class is applied (fitWidth)
    expect(wrapper?.className.includes((styles as any).fitWidth)).toBe(true);
  });
});
