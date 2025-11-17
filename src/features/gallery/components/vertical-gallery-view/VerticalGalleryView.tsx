/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Component (Solid.js)
 * @description Main gallery view component that renders media items in vertical layout
 *
 * **Responsibilities**:
 * - Render media items collection with vertical scrolling
 * - Manage gallery state (current index, loading, etc.)
 * - Coordinate scroll behavior and focus tracking
 * - Handle keyboard navigation (Escape, Help)
 * - Manage toolbar visibility and auto-hide behavior
 * - Implement animations (enter/exit)
 * - Support image fit modes (original, fitWidth, fitHeight, fitContainer)
 * - Provide download UI and interactions
 *
 * **Dependencies**:
 * - Solid.js signals for reactive state management
 * - Gallery signals (@shared/state/signals/gallery.signals)
 * - Multiple custom hooks for scroll, focus, and keyboard handling
 * - Toolbar and KeyboardHelpOverlay components
 * - Language service for i18n
 *
 * **API**:
 * - Props: {@link VerticalGalleryViewProps}
 * - Emits gallery close, previous/next navigation, download events via callbacks
 *
 * **Architecture**:
 * - Follows PC-only event policy (click, keydown/keyup, wheel, mouse*)
 * - Uses design tokens for all colors and sizes (no hardcoding)
 * - Vendor APIs accessed via getSolid() getter pattern
 * - Component-level hooks for keyboard handling
 *
 * @module features/gallery/components/vertical-gallery-view
 * @version 6.0 - Integrated toolbar state management system
 */

import type { JSX } from 'solid-js';
import { logger } from '@shared/logging';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import type { ImageFitMode } from '@shared/types';
import {
  galleryState,
  galleryIndexEvents,
  navigateToItem,
} from '@shared/state/signals/gallery.signals';
import type { GalleryState } from '@shared/state/signals/gallery.signals';
import { downloadState } from '@shared/state/signals/download.signals';
import { getSolid } from '@shared/external/vendors';
import { createStabilityDetector } from '@shared/utils/stability';
import { languageService } from '@shared/services/language-service';
import { stringWithDefault } from '@shared/utils/type-safety-helpers';
import { animateGalleryEnter, animateGalleryExit } from '@shared/utils/animations';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { ensureGalleryScrollAvailable } from '@shared/utils/core-utils';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';
import { computePreloadIndices } from '@shared/utils/performance';
import { getSetting, setSetting } from '@shared/container/settings-access';
import { KeyboardHelpOverlay } from './KeyboardHelpOverlay/KeyboardHelpOverlay';
import { useSelector, useCombinedSelector } from '@shared/utils/signal-selector';
import type { MediaInfo } from '@shared/types';
import { observeViewportCssVars } from '@shared/utils/viewport';
import { globalTimerManager } from '@shared/utils/timer-management';
import { safeEventPrevent } from '@shared/utils/event-utils';
import { createToolbarViewModel } from '@shared/utils/toolbar-view-model';

const solidAPI = getSolid();
const { For } = solidAPI;

export interface VerticalGalleryViewProps {
  onClose?: () => void;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownloadCurrent?: () => void;
  onDownloadAll?: () => void;
}

function VerticalGalleryViewCore({
  onClose,
  className = '',
  onPrevious,
  onNext,
  onDownloadCurrent,
  onDownloadAll,
}: VerticalGalleryViewProps): JSX.Element {
  const { createSignal, createMemo, createEffect, onCleanup, on } = solidAPI;

  const mediaItems = useSelector<GalleryState, readonly MediaInfo[]>(
    galleryState,
    state => state.mediaItems,
    { dependencies: state => [state.mediaItems] }
  );

  const currentIndex = useSelector<GalleryState, number>(
    galleryState,
    state => state.currentIndex,
    { dependencies: state => [state.currentIndex] }
  );

  const isDownloading = useCombinedSelector(
    [galleryState, downloadState] as const,
    (g, d) => Boolean(g.isLoading || d.isProcessing),
    (g, d) => [g.isLoading, d.isProcessing]
  );

  const [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
  const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal<HTMLDivElement | null>(null);
  const [itemsContainerEl, setItemsContainerEl] = createSignal<HTMLDivElement | null>(null);

  // StabilityDetector: Activity 기반 안정 상태 감지 (Phase 83.1)
  const stabilityDetector = createStabilityDetector();

  // Phase 21.4 → Phase 376: memoized visibility accessor for toolbar sync
  const isVisible = createMemo(() => mediaItems().length > 0);

  // Phase 146: 툴바 초기 표시 및 자동 숨김
  const [isInitialToolbarVisible, setIsInitialToolbarVisible] = createSignal(false);

  // 툴바 자동 숨김 타이머 effect
  createEffect(() => {
    if (!isVisible() || mediaItems().length === 0) {
      // 갤러리가 보이지 않으면 초기 표시 상태도 false
      setIsInitialToolbarVisible(false);
      return;
    }

    // 갤러리가 열리면 툴바를 초기에 표시
    setIsInitialToolbarVisible(true);

    // 자동 숨김 시간 가져오기 (기본 3초)
    const autoHideDelay = getSetting<number>('toolbar.autoHideDelay', 3000);

    // autoHideDelay가 0이면 즉시 숨김
    if (autoHideDelay === 0) {
      setIsInitialToolbarVisible(false);
      return;
    }

    // Timer setup
    const timer = globalTimerManager.setTimeout(() => {
      setIsInitialToolbarVisible(false);
    }, autoHideDelay);

    // cleanup for timer
    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
    });
  });

  const [isHelpOpen, setIsHelpOpen] = createSignal(false);

  const getInitialFitMode = (): ImageFitMode => {
    const saved = getSetting<ImageFitMode>('gallery.imageFitMode', 'fitWidth');
    return saved ?? 'fitWidth';
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

  const activeMedia = createMemo(() => {
    const items = mediaItems();
    const index = currentIndex();
    return items[index] ?? null;
  });

  const preloadIndices = createMemo(() => {
    const count = getSetting<number>('gallery.preloadCount', 0);
    return computePreloadIndices(currentIndex(), mediaItems().length, count);
  });

  createEffect(
    on(containerEl, element => {
      if (element) {
        ensureGalleryScrollAvailable(element);
      }
    })
  );

  // Phase 20.2: 애니메이션 effect에 명시적 의존성 추가
  createEffect(
    on(
      [containerEl, isVisible],
      ([container, visible]) => {
        if (!container) return;

        if (visible) {
          animateGalleryEnter(container);
        } else {
          animateGalleryExit(container);
        }
      },
      { defer: true }
    )
  );

  createEffect(
    on([isVisible, containerEl], ([visible, container]) => {
      if (visible || !container) {
        return;
      }

      const videos = container.querySelectorAll('video');
      videos.forEach(video => {
        try {
          video.pause();
          video.currentTime = 0;
        } catch (error) {
          logger.warn('video cleanup failed', { error });
        }
      });
    })
  );

  // Phase 430: 미디어 프리로드 자동화 (currentIndex 변경 시 자동 프리페치)
  createEffect(() => {
    if (!isVisible() || mediaItems().length === 0) return;

    const currentIdx = currentIndex();
    const items = mediaItems();

    // 프리로드할 URL 추출 (현재±2 범위)
    const range = 2;
    const startIdx = Math.max(0, currentIdx - range);
    const endIdx = Math.min(items.length - 1, currentIdx + range);

    const urlsToPreload: string[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      if (i !== currentIdx && items[i]) {
        urlsToPreload.push(items[i]!.url);
      }
    }

    // Link prefetch 힌트 추가 (브라우저 HTTP/2 활용)
    urlsToPreload.forEach(url => {
      try {
        // 중복 방지: 이미 존재하는 경우 추가 안 함
        const existingLink = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
        if (existingLink) return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'image';

        // 우선순위 설정 (Chrome 95+)
        if ('fetchPriority' in link) {
          (link as HTMLLinkElement & { fetchPriority: string }).fetchPriority = 'low';
        }

        document.head.appendChild(link);
      } catch (error) {
        logger.warn('Media prefetch failed', { error, url });
      }
    });
  });

  createEffect(() => {
    const container = containerEl();
    const wrapper = toolbarWrapperEl();
    if (!container || !wrapper) return;

    const cleanup = observeViewportCssVars(container, () => {
      const toolbarHeight = wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0;
      return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
    });

    onCleanup(() => {
      cleanup?.();
    });
  });

  const { isScrolling } = useGalleryScroll({
    container: () => containerEl(),
    scrollTarget: () => itemsContainerEl(),
    enabled: isVisible,
    stabilityDetector,
  });

  const {
    focusedIndex,
    registerItem: registerFocusItem,
    handleItemFocus,
    handleItemBlur,
    applyFocusAfterNavigation,
  } = useGalleryFocusTracker({
    container: () => containerEl(),
    isEnabled: isVisible,
    getCurrentIndex: currentIndex,
    // 사용자/자동 스크롤 중에는 자동 포커스를 억제
    shouldAutoFocus: () => !isScrolling(),
    // Phase 293: autoFocusDebounce 50ms → 0ms (즉시 실행)
    // isScrolling() 조건만으로 충분한 보호 제공
    // 키보드 내비게이션 반응성 개선
    autoFocusDebounce: 0,
    isScrolling, // ✅ Phase 83.3: settling 기반 포커스 갱신 최적화
  });

  const toolbarViewModel = createToolbarViewModel({
    totalCount: () => mediaItems().length,
    currentIndex,
    focusedIndex,
    tweetText: () => activeMedia()?.tweetText ?? null,
    tweetTextHTML: () => activeMedia()?.tweetTextHTML ?? null,
  });

  const { scrollToItem } = useGalleryItemScroll(
    () => containerEl(),
    currentIndex,
    () => mediaItems().length,
    {
      enabled: true,
      // Phase 264: behavior 옵션 제거 (기본값 'auto' 사용 - 모션 없음)
      // Phase 266: debounceDelay 제거 (항상 0ms 즉시 실행)
      block: 'start',
    }
  );

  // Phase 279/280/293: 갤러리 최초 열기 시 초기 스크롤 보장
  let hasPerformedInitialScroll = false;

  // Phase 293: 초기 렌더링 완료 후 자동 스크롤 실행 (rAF 체인으로 DOM 준비 보장)
  createEffect(() => {
    const visible = isVisible();

    // 갤러리가 닫히면 플래그 리셋
    if (!visible) {
      hasPerformedInitialScroll = false;
      return;
    }

    // 이미 스크롤 완료했으면 종료
    if (hasPerformedInitialScroll) return;

    // 기본 조건 체크
    const container = containerEl();
    const items = mediaItems();
    if (!container || items.length === 0) return;

    // 아이템 컨테이너 렌더링 확인
    const itemsContainer = container.querySelector(
      '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
    );
    // Phase 328: Check only gallery items (exclude spacer)
    const galleryItems = itemsContainer?.querySelectorAll('[data-xeg-role="gallery-item"]');
    if (!itemsContainer || !galleryItems || galleryItems.length === 0) return;

    // First render only, run once
    hasPerformedInitialScroll = true;

    // Phase 293+: rAF 체인 + 이미지 로드 대기로 초기 스크롤 안정성 개선
    // - 1st rAF: 현재 프레임 paint 완료
    // - 2nd rAF: 다음 프레임 시작 (레이아웃 계산 완료 보장)
    // - waitForMediaLoad: 현재 아이템 이미지 로드 완료 대기 (높이 확정)
    // - scrollToCurrentItem: 정확한 위치로 스크롤
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(async () => {
          // Phase 319: 현재 아이템의 이미지 로드 대기 추가
          // 이미지가 로드되어야 정확한 높이로 스크롤 가능
          const currentIdx = currentIndex();
          if (currentIdx >= 0 && currentIdx < items.length) {
            const itemElement =
              container.querySelector(`[data-item-index="${currentIdx}"]`) ||
              container.querySelector(`[data-index="${currentIdx}"]`);

            if (itemElement) {
              await waitForMediaLoad(itemElement, 1000);
            }

            await scrollToItem(currentIdx);
            applyFocusAfterNavigation(currentIdx, 'init', { force: true });
          }
        });
      });
    } else {
      // requestAnimationFrame이 없는 환경에서는 이미지 로드만 대기
      const currentIdx = currentIndex();
      if (currentIdx >= 0 && currentIdx < items.length) {
        const itemElement =
          container.querySelector(`[data-item-index="${currentIdx}"]`) ||
          container.querySelector(`[data-index="${currentIdx}"]`);

        if (itemElement) {
          void waitForMediaLoad(itemElement, 1000).then(async () => {
            await scrollToItem(currentIdx);
            applyFocusAfterNavigation(currentIdx, 'init', { force: true });
          });
          return;
        }

        void scrollToItem(currentIdx).then(() => {
          applyFocusAfterNavigation(currentIdx, 'init', { force: true });
        });
        return;
      }
    }
  });

  // Phase 270: 이미지 로드 완료 후 자동 스크롤 (타이밍 최적화)
  const waitForMediaLoad = (element: Element, timeoutMs: number = 1000): Promise<void> => {
    return new Promise(resolve => {
      // 이미 로드된 경우 즉시 반환
      if (element.getAttribute('data-media-loaded') === 'true') {
        resolve();
        return;
      }

      const checkInterval = globalTimerManager.setInterval(() => {
        if (element.getAttribute('data-media-loaded') === 'true') {
          globalTimerManager.clearInterval(checkInterval);
          globalTimerManager.clearTimeout(timeoutId);
          resolve();
        }
      }, 50);

      // 타임아웃 처리 (네트워크 지연 시에도 스크롤 진행)
      const timeoutId = globalTimerManager.setTimeout(() => {
        globalTimerManager.clearInterval(checkInterval);
        resolve();
      }, timeoutMs);
    });
  };

  const autoScrollToCurrentItem = async () => {
    const currentIdx = currentIndex();
    const container = containerEl();

    if (!container || currentIdx < 0 || currentIdx >= mediaItems().length) {
      return;
    }

    // Phase 270: 현재 아이템의 이미지 로드 완료 대기
    // Support both new data-item-index and legacy data-index for robustness
    const itemElement =
      container.querySelector(`[data-item-index="${currentIdx}"]`) ||
      container.querySelector(`[data-index="${currentIdx}"]`);

    if (itemElement) {
      await waitForMediaLoad(itemElement);
    }

    // 로드 완료 후 스크롤 실행 및 포커스 연계
    await scrollToItem(currentIdx);
    applyFocusAfterNavigation(currentIdx, 'init', { force: true });
  };

  createEffect(() => {
    if (!isVisible()) {
      return;
    }

    const unsubscribe = galleryIndexEvents.on('navigate:complete', ({ index, trigger }) => {
      void scrollToItem(index).then(() => {
        applyFocusAfterNavigation(index, trigger);
      });
    });

    onCleanup(() => {
      unsubscribe();
    });
  });

  useGalleryKeyboard({
    onClose: onClose || (() => {}),
    onOpenHelp: () => setIsHelpOpen(true),
  });

  const handleDownloadCurrent = () => {
    onDownloadCurrent?.();
  };

  const handleDownloadAll = () => {
    onDownloadAll?.();
  };

  const persistFitMode = (mode: ImageFitMode) =>
    setSetting('gallery.imageFitMode', mode).catch(error => {
      logger.warn('Failed to save fit mode', { error, mode });
    });

  const applyFitMode = (mode: ImageFitMode, event?: Event) => {
    safeEventPrevent(event);
    setImageFitMode(mode);
    void persistFitMode(mode);
    void autoScrollToCurrentItem();
  };

  const handleFitOriginal = (event?: Event) => {
    applyFitMode('original', event);
  };

  const handleFitWidth = (event?: Event) => {
    applyFitMode('fitWidth', event);
  };

  const handleFitHeight = (event?: Event) => {
    applyFitMode('fitHeight', event);
  };

  const handleFitContainer = (event?: Event) => {
    applyFitMode('fitContainer', event);
  };

  const handleBackgroundClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (
      target.closest('.toolbarWrapper') ||
      target.closest('.toolbarHoverZone') ||
      target.closest('[data-role="toolbar"]') ||
      target.closest('[class*="toolbar"]')
    ) {
      return;
    }

    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();
    const current = currentIndex();

    if (index >= 0 && index < items.length && index !== current) {
      navigateToItem(index, 'click');
    }
  };

  if (!isVisible() || mediaItems().length === 0) {
    const emptyTitle = languageService.translate('messages.gallery.emptyTitle');
    const emptyDesc = languageService.translate('messages.gallery.emptyDescription');

    return (
      <div class={`${styles.container} ${styles.empty} ${stringWithDefault(className, '')}`}>
        <div class={styles.emptyMessage}>
          <h3>{emptyTitle}</h3>
          <p>{emptyDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={el => setContainerEl(el ?? null)}
      class={`${styles.container} ${isInitialToolbarVisible() ? styles.initialToolbarVisible : ''} ${stringWithDefault(className, '')}`}
      onClick={handleBackgroundClick}
      data-xeg-gallery='true'
      data-xeg-role='gallery'
    >
      <KeyboardHelpOverlay open={isHelpOpen()} onClose={() => setIsHelpOpen(false)} />

      <div class={styles.toolbarHoverZone} data-role='toolbar-hover-zone' />

      <div class={styles.toolbarWrapper} ref={el => setToolbarWrapperEl(el ?? null)}>
        <Toolbar
          onClose={onClose || (() => {})}
          onPrevious={onPrevious || (() => {})}
          onNext={onNext || (() => {})}
          currentIndex={toolbarViewModel().currentIndex}
          focusedIndex={toolbarViewModel().focusedIndex}
          totalCount={toolbarViewModel().totalCount}
          isDownloading={isDownloading()}
          onDownloadCurrent={handleDownloadCurrent}
          onDownloadAll={handleDownloadAll}
          onFitOriginal={handleFitOriginal}
          onFitWidth={handleFitWidth}
          onFitHeight={handleFitHeight}
          onFitContainer={handleFitContainer}
          currentFitMode={imageFitMode()}
          onOpenSettings={() => {}}
          tweetText={toolbarViewModel().tweetText ?? undefined}
          tweetTextHTML={toolbarViewModel().tweetTextHTML ?? undefined}
          className={styles.toolbar || ''}
        />
      </div>

      <div
        class={styles.itemsContainer}
        data-xeg-role='items-container'
        data-xeg-role-compat='items-list'
        ref={el => setItemsContainerEl(el ?? null)}
      >
        {/* Phase 328: Fixed - Simplified For loop without transformation */}
        <For each={mediaItems()}>
          {(item, index) => {
            const actualIndex = index();
            const forcePreload = preloadIndices().includes(actualIndex);

            return (
              <VerticalImageItem
                media={item}
                index={actualIndex}
                isActive={actualIndex === currentIndex()}
                isFocused={actualIndex === focusedIndex()}
                forceVisible={forcePreload}
                fitMode={imageFitMode}
                onClick={() => handleMediaItemClick(actualIndex)}
                className={`${styles.galleryItem} ${
                  actualIndex === currentIndex() ? styles.itemActive : ''
                }`}
                data-index={actualIndex}
                data-xeg-role='gallery-item'
                registerContainer={element => registerFocusItem(actualIndex, element)}
                {...(onDownloadCurrent
                  ? {
                      onDownload: handleDownloadCurrent,
                    }
                  : {})}
                onFocus={() => handleItemFocus(actualIndex)}
                onBlur={() => handleItemBlur(actualIndex)}
              />
            );
          }}
        </For>
        {/* Phase 328: Transparent spacer for last item top-align scrolling */}
        <div class={styles.scrollSpacer} aria-hidden='true' data-xeg-role='scroll-spacer' />
      </div>
    </div>
  );
}

export const VerticalGalleryView = VerticalGalleryViewCore;
