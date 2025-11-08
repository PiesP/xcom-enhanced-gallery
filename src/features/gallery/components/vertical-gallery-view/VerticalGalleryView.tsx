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
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import type { GalleryState } from '@shared/state/signals/gallery.signals';
import { downloadState } from '@shared/state/signals/download.signals';
import { getSolid } from '@shared/external/vendors';
import { createStabilityDetector } from '@shared/utils/stability';
import { languageService } from '@shared/services/language-service';
import { stringWithDefault } from '@shared/utils/type-safety-helpers';
import {
  animateGalleryEnter,
  animateGalleryExit,
  setupScrollAnimation,
} from '@shared/utils/animations';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryScroll } from '@features/gallery/hooks/useGalleryScroll';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';
import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { ensureGalleryScrollAvailable } from '@shared/utils';
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

  // Phase 21.4: isVisible을 단순 accessor로 변경 (불필요한 createMemo 제거)
  // Solid.js의 fine-grained reactivity가 자동으로 최적화하므로 memo 불필요
  const isVisible = () => mediaItems().length > 0;

  // Visibility change debugging log separated into its own effect
  createEffect(() => {
    const visible = isVisible();
    logger.debug('VerticalGalleryView: visibility calculation', {
      visible,
      mediaCount: mediaItems().length,
    });
  });

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
      logger.debug('VerticalGalleryView: toolbar auto-hide executed', {
        delay: autoHideDelay,
      });
    }, autoHideDelay);

    // cleanup for timer
    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
      logger.debug('VerticalGalleryView: toolbar auto-hide timer cleanup');
    });
  });

  const [isHelpOpen, setIsHelpOpen] = createSignal(false);

  const getInitialFitMode = (): ImageFitMode => {
    const saved = getSetting<ImageFitMode>('gallery.imageFitMode', 'fitWidth');
    return saved ?? 'fitWidth';
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

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
          logger.debug('gallery enter animation executed');
        } else {
          animateGalleryExit(container);
          logger.debug('gallery exit animation executed');
        }
      },
      { defer: true }
    )
  );

  createEffect(
    on(
      () => isVisible(),
      visible => {
        if (!visible) {
          const videos = document.querySelectorAll('video');
          videos.forEach(video => {
            try {
              video.pause();
              video.currentTime = 0;
            } catch (error) {
              logger.warn('video cleanup failed:', error);
            }
          });
        }
      }
    )
  );

  createEffect(() => {
    const container = containerEl();
    if (!container || !isVisible()) return;

    const cleanup = setupScrollAnimation(({ scrollY, progress }) => {
      logger.debug('scroll animation', { scrollY, progress });
    }, container);

    onCleanup(() => {
      cleanup?.();
    });
  });

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
        logger.debug('[MediaPreloader] Auto-prefetch:', url);
      } catch (error) {
        logger.warn('[MediaPreloader] Failed to prefetch:', error);
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

  createEffect(
    on(
      () => imageFitMode(),
      mode => {
        logger.debug('VerticalGalleryView: image fit mode changed', {
          mode,
          mediaItemsCount: mediaItems().length,
        });
      }
    )
  );

  const { isScrolling } = useGalleryScroll({
    container: () => containerEl(),
    scrollTarget: () => itemsContainerEl(),
    onScroll: (delta, scrollTargetElement) => {
      // Phase 76: 브라우저 네이티브 스크롤로 전환
      // scrollBy 수동 호출 제거 - CSS overflow:auto로 자동 처리
      const container = containerEl();
      const target = scrollTargetElement ?? container;

      if (!container || !target) {
        logger.debug('VerticalGalleryView: scroll detected - target element missing', {
          delta,
          hasContainer: !!container,
          hasTarget: !!target,
        });
        return;
      }

      logger.debug('VerticalGalleryView: scroll detected (native)', {
        delta,
        currentTop: target.scrollTop,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight,
        timestamp: Date.now(),
        targetType: target === container ? 'container' : 'itemsContainer',
      });
    },
    enabled: isVisible,
    stabilityDetector,
  });

  const {
    focusedIndex,
    registerItem: registerFocusItem,
    handleItemFocus,
    handleItemBlur,
    forceSync: forceFocusSync,
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

  createEffect(
    on(currentIndex, () => {
      forceFocusSync();
    })
  );

  const { scrollToCurrentItem } = useGalleryItemScroll(
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

    logger.debug('VerticalGalleryView: initial scroll started (Phase 293)', {
      currentIndex: currentIndex(),
      itemsRendered: galleryItems.length,
      mediaCount: items.length,
      timestamp: Date.now(),
    });

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
              logger.debug('VerticalGalleryView: initial item image loaded (Phase 319)', {
                currentIndex: currentIdx,
                timestamp: Date.now(),
              });
            }
          }

          void scrollToCurrentItem();
          logger.debug(
            'VerticalGalleryView: initial scroll completed (Phase 319 - rAF + image load)',
            {
              currentIndex: currentIndex(),
              timestamp: Date.now(),
            }
          );
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
          void waitForMediaLoad(itemElement, 1000).then(() => {
            void scrollToCurrentItem();
          });
          return;
        }
      }
      void scrollToCurrentItem();
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
        logger.debug(
          'VerticalGalleryView: image load timeout (1000ms) - proceeding with partial load state'
        );
        resolve();
      }, timeoutMs);
    });
  };

  const autoScrollToCurrentItem = async () => {
    const currentIdx = currentIndex();
    const container = containerEl();

    if (!container || currentIdx < 0 || currentIdx >= mediaItems().length) {
      logger.debug('VerticalGalleryView: autoScrollToCurrentItem skipped (no valid items)');
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

    // 로드 완료 후 스크롤 실행
    void scrollToCurrentItem();
  };

  useGalleryKeyboard({
    onClose: onClose || (() => {}),
    onOpenHelp: () => setIsHelpOpen(true),
  });

  const handleDownloadCurrent = () => {
    if (onDownloadCurrent) {
      onDownloadCurrent();
      logger.debug('VerticalGalleryView: starting current item download');
    }
  };

  const handleDownloadAll = () => {
    if (onDownloadAll) {
      onDownloadAll();
      logger.debug('VerticalGalleryView: starting full download');
    }
  };

  const handleFitOriginal = (event?: Event) => {
    safeEventPrevent(event);

    setImageFitMode('original');
    setSetting('gallery.imageFitMode', 'original').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
    logger.debug('VerticalGalleryView: set image size to original');
    autoScrollToCurrentItem();
  };

  const handleFitWidth = (event?: Event) => {
    safeEventPrevent(event);

    setImageFitMode('fitWidth');
    setSetting('gallery.imageFitMode', 'fitWidth').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
    logger.debug('VerticalGalleryView: set image size to fit width');
    autoScrollToCurrentItem();
  };

  const handleFitHeight = (event?: Event) => {
    safeEventPrevent(event);

    setImageFitMode('fitHeight');
    setSetting('gallery.imageFitMode', 'fitHeight').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
    logger.debug('VerticalGalleryView: set image size to fit height');
    autoScrollToCurrentItem();
  };

  const handleFitContainer = (event?: Event) => {
    safeEventPrevent(event);

    setImageFitMode('fitContainer');
    setSetting('gallery.imageFitMode', 'fitContainer').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
    logger.debug('VerticalGalleryView: set image size to fit container');
    autoScrollToCurrentItem();
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

  const handleMediaLoad = (mediaId: string, index: number) => {
    logger.debug('VerticalGalleryView: media load complete', { mediaId, index });
    // Phase 18: Auto-scroll removed
    // - Do not interfere with manual scrolling when media loads
    // - prev/next navigation is handled by useGalleryItemScroll hook
  };

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();
    const current = currentIndex();

    if (index >= 0 && index < items.length && index !== current) {
      navigateToItem(index, 'click');
      logger.debug('VerticalGalleryView: media item navigation by click', { index });
    }
  };

  // DEV-only: Detect and log duplicate rendered items for diagnostics (no side effects)
  if (__DEV__) {
    const { createEffect: devCreateEffect, on: devOn } = solidAPI;
    // Log once per media length change to avoid noise
    let lastLoggedLength = -1;
    devCreateEffect(
      devOn([mediaItems, itemsContainerEl], ([items, container]) => {
        const length = items.length;
        if (!container || length === 0) return;
        if (length === lastLoggedLength) return;
        lastLoggedLength = length;

        // Count actual DOM items and detect duplicate indices
        const nodes = container.querySelectorAll('[data-xeg-role="gallery-item"]');
        const indices = Array.from(nodes).map(el => {
          const h = el as HTMLElement;
          return h.getAttribute('data-item-index') || h.getAttribute('data-index') || '';
        });
        const unique = new Set(indices.filter(Boolean));
        if (nodes.length !== length || unique.size !== length) {
          logger.warn('[DEV] Duplicate or mismatched gallery items detected', {
            expected: length,
            domCount: nodes.length,
            uniqueIndices: unique.size,
            indicesSample: indices.slice(0, 20),
          });
        } else {
          logger.debug('[DEV] Gallery items render check OK', {
            expected: length,
            domCount: nodes.length,
          });
        }
      })
    );
  }

  if (!isVisible() || mediaItems().length === 0) {
    const emptyTitle = languageService.getString('messages.gallery.emptyTitle');
    const emptyDesc = languageService.getString('messages.gallery.emptyDescription');

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
          currentIndex={currentIndex()}
          focusedIndex={focusedIndex() ?? currentIndex()}
          totalCount={mediaItems().length}
          isDownloading={isDownloading()}
          onDownloadCurrent={handleDownloadCurrent}
          onDownloadAll={handleDownloadAll}
          onFitOriginal={handleFitOriginal}
          onFitWidth={handleFitWidth}
          onFitHeight={handleFitHeight}
          onFitContainer={handleFitContainer}
          onOpenSettings={() => {}}
          tweetText={mediaItems()[currentIndex()]?.tweetText}
          tweetTextHTML={mediaItems()[currentIndex()]?.tweetTextHTML}
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
                onMediaLoad={handleMediaLoad}
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
