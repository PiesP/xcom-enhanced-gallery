/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Vertical Gallery View Component
 * @version 6.0 - 통합 툴바 상태 관리 시스템 (Solid.js)
 */

import type { JSX } from 'solid-js';
import { logger } from '../../../../shared/logging/logger';
import { Toolbar } from '../../../../shared/components/ui/Toolbar/Toolbar';
import type { ImageFitMode } from '../../../../shared/types';
import { galleryState, navigateToItem } from '../../../../shared/state/signals/gallery.signals';
import type { GalleryState } from '../../../../shared/state/signals/gallery.signals';
import { downloadState } from '../../../../shared/state/signals/download.signals';
import { getSolid } from '../../../../shared/external/vendors';
import { createStabilityDetector } from '../../../../shared/services/stability-detector';
import { languageService } from '../../../../shared/services/language-service';
import { stringWithDefault } from '../../../../shared/utils/type-safety-helpers';
import {
  animateGalleryEnter,
  animateGalleryExit,
  setupScrollAnimation,
} from '../../../../shared/utils/animations';
import { useGalleryCleanup } from './hooks/useGalleryCleanup';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryScroll } from '../../hooks/useGalleryScroll';
import { useGalleryItemScroll } from '../../hooks/useGalleryItemScroll';
import { useGalleryFocusTracker } from '../../hooks/useGalleryFocusTracker';
import { ensureGalleryScrollAvailable } from '../../../../shared/utils/core-utils';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';
import { computePreloadIndices } from '../../../../shared/utils/performance';
import { getSetting, setSetting } from '../../../../shared/container/settings-access';
import { KeyboardHelpOverlay } from '../KeyboardHelpOverlay/KeyboardHelpOverlay';
import { useSelector, useCombinedSelector } from '../../../../shared/utils/signal-selector';
import type { MediaInfo } from '../../../../shared/types';
import { observeViewportCssVars } from '../../../../shared/utils/viewport';
import { globalTimerManager } from '../../../../shared/utils/timer-management';

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

  // 가시성 변경 디버깅 로그를 별도 effect로 분리
  createEffect(() => {
    const visible = isVisible();
    logger.debug('VerticalGalleryView: 가시성 계산', {
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

    // 타이머 설정
    const timer = globalTimerManager.setTimeout(() => {
      setIsInitialToolbarVisible(false);
      logger.debug('VerticalGalleryView: 툴바 자동 숨김 실행', {
        delay: autoHideDelay,
      });
    }, autoHideDelay);

    // cleanup에서 타이머 정리
    onCleanup(() => {
      globalTimerManager.clearTimeout(timer);
      logger.debug('VerticalGalleryView: 툴바 자동 숨김 타이머 정리');
    });
  });

  const [isHelpOpen, setIsHelpOpen] = createSignal(false);

  const hideTimeoutRef = { current: null as number | null };

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
          logger.debug('갤러리 진입 애니메이션 실행');
        } else {
          animateGalleryExit(container);
          logger.debug('갤러리 종료 애니메이션 실행');
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
      // Phase 76: 브라우저 네이티브 스크롤로 전환
      // scrollBy 수동 호출 제거 - CSS overflow:auto로 자동 처리
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

      logger.debug('VerticalGalleryView: 스크롤 감지 (네이티브)', {
        delta,
        currentTop: target.scrollTop,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight,
        timestamp: Date.now(),
        targetType: target === container ? 'container' : 'itemsContainer',
      });
    },
    enabled: isVisible,
    blockTwitterScroll: true,
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
    // ✅ Step 4: Idle timeout 튜닝 - 중복 지연 제거
    // 기존: SCROLL_IDLE_TIMEOUT (350ms) + 100ms margin = 500ms
    // 개선: 매우 짧은 debounce (50ms)로 키 입력과의 race 방지하면서 반응성 개선
    autoFocusDebounce: 50,
    isScrolling, // ✅ Phase 83.3: settling 기반 포커스 갱신 최적화
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
    setSetting('gallery.imageFitMode', 'original').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
    logger.debug('VerticalGalleryView: 이미지 크기를 원본으로 설정');
  };

  const handleFitWidth = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitWidth');
    setSetting('gallery.imageFitMode', 'fitWidth').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
    logger.debug('VerticalGalleryView: 이미지 크기를 가로 맞춤으로 설정');
  };

  const handleFitHeight = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitHeight');
    setSetting('gallery.imageFitMode', 'fitHeight').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
    logger.debug('VerticalGalleryView: 이미지 크기를 세로 맞춤으로 설정');
  };

  const handleFitContainer = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitContainer');
    setSetting('gallery.imageFitMode', 'fitContainer').catch(err => {
      logger.warn('Failed to save fit mode', { error: err });
    });
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
      navigateToItem(index, 'click');
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
      </div>
    </div>
  );
}

export const VerticalGalleryView = VerticalGalleryViewCore;
