/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Component
 * @version 6.0 - 통합 툴바 상태 관리 시스템 (Solid.js)
 */

import type { JSX } from 'solid-js';
import { logger } from '../../../../shared/logging/logger';
import { ToolbarWithSettings } from '../../../../shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';
import type { ImageFitMode } from '../../../../shared/types';
import { galleryState, navigateToItem } from '../../../../shared/state/signals/gallery.signals';
import type { GalleryState } from '../../../../shared/state/signals/gallery.signals';
import { downloadState } from '../../../../shared/state/signals/download.signals';
import { getSolid } from '../../../../shared/external/vendors';
import { languageService } from '../../../../shared/services/LanguageService';
import { stringWithDefault } from '../../../../shared/utils/type-safety-helpers';
import {
  animateGalleryEnter,
  animateGalleryExit,
  setupScrollAnimation,
} from '../../../../shared/utils/animations';
import { useGalleryCleanup } from './hooks/useGalleryCleanup';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryScroll, SCROLL_IDLE_TIMEOUT } from '../../hooks/useGalleryScroll';
import { useGalleryItemScroll } from '../../hooks/useGalleryItemScroll';
import { useGalleryFocusTracker } from '../../hooks/useGalleryFocusTracker';
import { ensureGalleryScrollAvailable } from '../../../../shared/utils/core-utils';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';
import { computePreloadIndices } from '../../../../shared/utils/performance';
import { getSetting, setSetting } from '../../../../shared/container/settings-access';
import { KeyboardHelpOverlay } from '../KeyboardHelpOverlay/KeyboardHelpOverlay';
import { useSelector, useCombinedSelector } from '../../../../shared/utils/signalSelector';
import type { MediaInfo } from '../../../../shared/types';
import { observeViewportCssVars } from '../../../../shared/utils/viewport';

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
    galleryState as unknown as { value: GalleryState },
    state => state.mediaItems,
    { dependencies: state => [state.mediaItems] }
  );

  const currentIndex = useSelector<GalleryState, number>(
    galleryState as unknown as { value: GalleryState },
    state => state.currentIndex,
    { dependencies: state => [state.currentIndex] }
  );

  const isDownloading = useCombinedSelector(
    [
      galleryState as unknown as { value: GalleryState },
      downloadState as unknown as { value: typeof downloadState.value },
    ] as const,
    (g, d) => Boolean(g.isLoading || d.isProcessing),
    (g, d) => [g.isLoading, d.isProcessing]
  );

  const [containerEl, setContainerEl] = createSignal<HTMLDivElement | null>(null);
  const [toolbarWrapperEl, setToolbarWrapperEl] = createSignal<HTMLDivElement | null>(null);
  const [itemsContainerEl, setItemsContainerEl] = createSignal<HTMLDivElement | null>(null);

  // isVisible을 파생 상태(Derived Signal)로 변환 - Phase 20.1
  const isVisible = createMemo(() => {
    const visible = mediaItems().length > 0;
    logger.debug('VerticalGalleryView: 가시성 계산', {
      visible,
      mediaCount: mediaItems().length,
    });
    return visible;
  });

  const [isHelpOpen, setIsHelpOpen] = createSignal(false);

  const hideTimeoutRef = { current: null as number | null };
  const forceVisibleItems = new Set<number>();

  const getInitialFitMode = (): ImageFitMode => {
    const saved = getSetting<ImageFitMode>('gallery.imageFitMode' as unknown as string, 'fitWidth');
    return saved ?? 'fitWidth';
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

  // 휠 스크롤 배율 설정 로드
  const wheelScrollMultiplier = getSetting<number>('gallery.wheelScrollMultiplier', 1.2);

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

  createEffect(() => {
    const container = containerEl();
    if (!container) return;

    if (isVisible()) {
      animateGalleryEnter(container);
      logger.debug('갤러리 진입 애니메이션 실행');
    } else {
      animateGalleryExit(container);
      logger.debug('갤러리 종료 애니메이션 실행');
    }
  });

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
              logger.warn('비디오 정리 실패:', error);
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
      logger.debug('스크롤 애니메이션', { scrollY, progress });
    }, container);

    onCleanup(() => {
      cleanup?.();
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
        logger.debug('VerticalGalleryView: 이미지 핏 모드 변경됨', {
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
      const container = containerEl();
      const target = scrollTargetElement ?? container;

      if (!container || !target) {
        logger.debug('VerticalGalleryView: 스크롤 감지 - 대상 요소 없음', {
          delta,
          hasContainer: !!container,
          hasTarget: !!target,
        });
        return;
      }

      const maxScrollTop = Math.max(0, target.scrollHeight - target.clientHeight);
      const currentTop = target.scrollTop;
      const desiredTop = currentTop + delta * wheelScrollMultiplier;
      const clampedTop = Math.max(0, Math.min(desiredTop, maxScrollTop));
      const scrollDelta = clampedTop - currentTop;

      if (scrollDelta === 0) {
        logger.debug('VerticalGalleryView: 스크롤 감지 - 경계 도달', {
          delta,
          currentTop,
          maxScrollTop,
          targetType: target === container ? 'container' : 'itemsContainer',
        });
        return;
      }

      target.scrollBy({
        top: scrollDelta,
        left: 0,
        behavior: Math.abs(scrollDelta) > 48 ? 'smooth' : 'auto',
      });

      logger.debug('VerticalGalleryView: 스크롤 감지', {
        delta,
        appliedDelta: scrollDelta,
        targetTop: clampedTop,
        timestamp: Date.now(),
        targetType: target === container ? 'container' : 'itemsContainer',
        multiplier: wheelScrollMultiplier,
      });
    },
    enabled: isVisible,
    blockTwitterScroll: true,
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
    shouldAutoFocus: () => !isScrolling(),
    autoFocusDebounce: SCROLL_IDLE_TIMEOUT,
  });

  createEffect(
    on(currentIndex, () => {
      forceFocusSync();
    })
  );

  useGalleryItemScroll(
    () => containerEl(),
    currentIndex,
    () => mediaItems().length,
    {
      enabled: true,
      behavior: 'smooth',
      block: 'start',
      debounceDelay: 100,
    }
  );

  useGalleryCleanup({
    isVisible,
    hideTimeoutRef,
    themeCleanup: () => {
      logger.debug('Theme cleanup called');
    },
  });

  useGalleryKeyboard({
    onClose: onClose || (() => {}),
    onOpenHelp: () => setIsHelpOpen(true),
  });

  const handleDownloadCurrent = () => {
    if (onDownloadCurrent) {
      onDownloadCurrent();
      logger.debug('VerticalGalleryView: 현재 아이템 다운로드 시작');
    }
  };

  const handleDownloadAll = () => {
    if (onDownloadAll) {
      onDownloadAll();
      logger.debug('VerticalGalleryView: 전체 다운로드 시작');
    }
  };

  const handleFitOriginal = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('original');
    setSetting('gallery.imageFitMode' as unknown as string, 'original').catch(() => {});
    logger.debug('VerticalGalleryView: 이미지 크기를 원본으로 설정');
  };

  const handleFitWidth = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitWidth');
    setSetting('gallery.imageFitMode' as unknown as string, 'fitWidth').catch(() => {});
    logger.debug('VerticalGalleryView: 이미지 크기를 가로 맞춤으로 설정');
  };

  const handleFitHeight = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitHeight');
    setSetting('gallery.imageFitMode' as unknown as string, 'fitHeight').catch(() => {});
    logger.debug('VerticalGalleryView: 이미지 크기를 세로 맞춤으로 설정');
  };

  const handleFitContainer = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitContainer');
    setSetting('gallery.imageFitMode' as unknown as string, 'fitContainer').catch(() => {});
    logger.debug('VerticalGalleryView: 이미지 크기를 창 맞춤으로 설정');
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
    logger.debug('VerticalGalleryView: 미디어 로드 완료', { mediaId, index });
    // Phase 18: 자동 스크롤 제거
    // - 수동 스크롤을 방해하지 않도록 미디어 로드 시 자동 스크롤 제거
    // - prev/next 네비게이션은 useGalleryItemScroll 훅이 처리
  };

  const handleMediaItemClick = (index: number) => {
    const items = mediaItems();
    const current = currentIndex();

    if (index >= 0 && index < items.length && index !== current) {
      navigateToItem(index);
      logger.debug('VerticalGalleryView: 미디어 아이템 클릭으로 네비게이션', { index });
    }
  };

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
      class={`${styles.container} ${stringWithDefault(className, '')}`}
      onClick={handleBackgroundClick}
      data-xeg-gallery='true'
      data-xeg-role='gallery'
    >
      <KeyboardHelpOverlay open={isHelpOpen()} onClose={() => setIsHelpOpen(false)} />

      <div class={styles.toolbarHoverZone} data-role='toolbar-hover-zone' />

      <div class={styles.toolbarWrapper} ref={el => setToolbarWrapperEl(el ?? null)}>
        <ToolbarWithSettings
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
          className={styles.toolbar || ''}
        />
      </div>

      <div
        class={styles.itemsContainer}
        data-xeg-role='items-container'
        data-xeg-role-compat='items-list'
        ref={el => setItemsContainerEl(el ?? null)}
      >
        <For
          each={mediaItems().map((item, index) => ({
            ...item,
            _galleryKey: `${item.id || item.url}-${index}`,
            _index: index,
          }))}
        >
          {item => {
            const actualIndex = (item as Record<string, unknown>)._index as number;
            const forcePreload = preloadIndices().includes(actualIndex);

            return (
              <VerticalImageItem
                media={item}
                index={actualIndex}
                isActive={actualIndex === currentIndex()}
                isFocused={actualIndex === focusedIndex()}
                forceVisible={forceVisibleItems.has(actualIndex) || forcePreload}
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
      </div>
    </div>
  );
}

export const VerticalGalleryView = VerticalGalleryViewCore;
