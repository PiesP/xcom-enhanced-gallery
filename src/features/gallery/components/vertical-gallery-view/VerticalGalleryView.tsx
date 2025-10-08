import { getSolid } from '@shared/external/vendors';

/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview Vertical Gallery View Component (Solid.js)
 * @version 7.0 - Phase 5.2 Solid.js 전환
 *
 * 주요 개선사항:
 * - Solid.js 네이티브 반응성 활용
 * - Preact hooks → Solid primitives 전환
 * - For/Show 컴포넌트로 효율적 렌더링
 * - 자동 최적화 (memo 불필요)
 * - 통합 툴바 상태 관리 (Signals 기반)
 */

import { logger } from '../../../../shared/logging/logger';
import { ToolbarWithSettings } from '../../../../shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';
import type { ImageFitMode } from '../../../../shared/types';
import { galleryState, navigateToItem } from '../../../../shared/state/signals/gallery.signals';
import { downloadState } from '../../../../shared/state/signals/download.signals';
import { languageService } from '../../../../shared/services/LanguageService';
import { keyboardNavigator } from '../../../../shared/services';
import { stringWithDefault } from '../../../../shared/utils/type-safety-helpers';
import {
  animateGalleryEnter,
  animateGalleryExit,
  setupScrollAnimation,
} from '../../../../shared/utils/animations';
import { ensureGalleryScrollAvailable } from '../../../../shared/utils/core-utils';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';
import { computePreloadIndices } from '../../../../shared/utils/performance';
import { getSetting, setSetting } from '../../../../shared/container/settings-access';
import { observeViewportCssVars } from '../../../../shared/utils/viewport';

export interface VerticalGalleryViewProps {
  onClose?: () => void;
  className?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownloadCurrent?: () => void;
  onDownloadAll?: () => void;
}

export function VerticalGalleryView(props: VerticalGalleryViewProps) {
  // vendors getter를 함수 내부에서 호출
  const { createSignal, createEffect, onCleanup, mergeProps, For, Show } = getSolid();

  // Props에 기본값 병합
  const merged = mergeProps(
    {
      className: '',
      onClose: () => {},
      onPrevious: () => {},
      onNext: () => {},
    },
    props
  );

  // Refs (Solid는 let 변수로 관리)
  let containerRef: HTMLDivElement | undefined;
  let toolbarHoverZoneRef: HTMLDivElement | undefined;
  let toolbarWrapperRef: HTMLDivElement | undefined;

  // Local signals
  const [isVisible, setIsVisible] = createSignal(galleryState.value.mediaItems.length > 0);
  const [domReady, setDomReady] = createSignal(false);
  const [focusedIndex, setFocusedIndex] = createSignal(galleryState.value.currentIndex);
  const [lastAutoScrolledIndex, setLastAutoScrolledIndex] = createSignal(-1);

  // 초기 imageFitMode 설정
  const getInitialFitMode = (): ImageFitMode => {
    const saved = getSetting<ImageFitMode>('gallery.imageFitMode' as unknown as string, 'fitWidth');
    return saved ?? 'fitWidth';
  };

  const [imageFitMode, setImageFitMode] = createSignal<ImageFitMode>(getInitialFitMode());

  // Derived values from signals
  const mediaItems = () => galleryState.value.mediaItems;
  const currentIndex = () => galleryState.value.currentIndex;
  const isDownloading = () =>
    Boolean(galleryState.value.isLoading || downloadState.value.isProcessing);

  logger.debug('VerticalGalleryView.solid: Rendering with state', {
    mediaCount: mediaItems().length,
    currentIndex: currentIndex(),
    isDownloading: isDownloading(),
  });

  // DOM 요소 준비 확인
  createEffect(() => {
    if (toolbarWrapperRef && toolbarHoverZoneRef) {
      setDomReady(true);
    }
  });

  logger.debug('VerticalGalleryView.solid: CSS 기반 툴바 시스템 활성화', {
    mediaCount: mediaItems().length,
    domReady: domReady(),
  });

  // 포커스된 인덱스와 현재 인덱스 동기화
  createEffect(() => {
    const idx = currentIndex();
    setFocusedIndex(idx);
    setLastAutoScrolledIndex(-1);
  });

  // 메모이제이션된 미디어 아이템
  const memoizedMediaItems = () => {
    const items = mediaItems();
    return items.map((item, index: number) => ({
      ...item,
      _galleryKey: `${item.id || item.url}-${index}`,
      _index: index,
    }));
  };

  // 렌더링할 아이템들 (가상 스크롤링 제거)
  const itemsToRender = memoizedMediaItems;

  // Preload 인덱스 계산
  const preloadIndices = () => {
    const count = getSetting<number>('gallery.preloadCount', 0);
    return computePreloadIndices(currentIndex(), mediaItems().length, count);
  };

  // 가시성 업데이트
  createEffect(() => {
    const shouldBeVisible = mediaItems().length > 0;
    if (isVisible() !== shouldBeVisible) {
      setIsVisible(shouldBeVisible);
      logger.debug('VerticalGalleryView.solid: 가시성 상태 변경', {
        wasVisible: isVisible(),
        nowVisible: shouldBeVisible,
        mediaCount: mediaItems().length,
      });
    }
  });

  // 갤러리 진입/종료 애니메이션
  createEffect(() => {
    if (containerRef) {
      if (isVisible()) {
        animateGalleryEnter(containerRef);
        logger.debug('갤러리 진입 애니메이션 실행');
      } else {
        animateGalleryExit(containerRef);
        logger.debug('갤러리 종료 애니메이션 실행');
      }
    }
  });

  // 갤러리 닫힘 시 비디오 정리
  createEffect(() => {
    if (!isVisible()) {
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
  });

  // UI 상태와 독립적으로 스크롤 가용성 보장
  createEffect(() => {
    if (containerRef) {
      ensureGalleryScrollAvailable(containerRef);
    }
  });

  // 컨테이너 뷰포트 제약 CSS 변수 주입
  createEffect(() => {
    const el = containerRef;
    if (!el) return;

    const getChrome = () => {
      const t = toolbarWrapperRef;
      const toolbarHeight = t ? Math.floor(t.getBoundingClientRect().height) : 0;
      return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
    };

    const cleanup = observeViewportCssVars(el, getChrome);
    onCleanup(cleanup);
  });

  // 갤러리 스크롤 처리 (커스텀 hook 대체)
  createEffect(() => {
    if (!containerRef || !isVisible()) return;

    const handleWheel = (event: WheelEvent) => {
      const delta = event.deltaY;
      logger.debug('VerticalGalleryView.solid: 스크롤 감지', {
        delta,
        timestamp: Date.now(),
      });
      // 순수 CSS 호버 시스템으로 인해 별도의 UI 타이머 재설정 불필요
    };

    containerRef.addEventListener('wheel', handleWheel, { passive: true });
    onCleanup(() => containerRef?.removeEventListener('wheel', handleWheel));
  });

  // 부드러운 스크롤 애니메이션 설정
  createEffect(() => {
    if (containerRef && isVisible()) {
      const cleanup = setupScrollAnimation(({ scrollY, progress }) => {
        logger.debug('스크롤 애니메이션', { scrollY, progress });
      }, containerRef);

      onCleanup(cleanup);
    }
  });

  // 배경 클릭 핸들러
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
      merged.onClose();
    }
  };

  // 갤러리 아이템 스크롤 (자동 스크롤 처리)
  createEffect(() => {
    if (!containerRef) return;

    const idx = currentIndex();
    const itemsContainerElement = containerRef.querySelector('[data-xeg-role="items-container"]');
    const targetElement = itemsContainerElement?.children[idx] as HTMLElement;

    if (targetElement) {
      targetElement.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
  });

  // 키보드 이벤트 처리 (중앙화된 KeyboardNavigator 사용)
  createEffect(() => {
    const unsubscribe = keyboardNavigator.subscribe(
      {
        onEscape: () => {
          merged.onClose();
        },
      },
      {
        context: 'vertical-gallery-view',
        preventDefault: true,
        stopPropagation: true,
      }
    );

    onCleanup(unsubscribe);
  });

  // 미디어 로드 완료 핸들러
  const handleMediaLoad = (mediaId: string, index: number) => {
    logger.debug('VerticalGalleryView.solid: 미디어 로드 완료', { mediaId, index });

    if (index === currentIndex() && index !== lastAutoScrolledIndex()) {
      const itemsContainerElement = containerRef?.querySelector(
        '[data-xeg-role="items-container"]'
      );
      const targetElement = itemsContainerElement?.children[index] as HTMLElement;

      if (targetElement) {
        const mediaElement = targetElement.querySelector('img, video') as
          | HTMLImageElement
          | HTMLVideoElement;

        let isFullyLoaded = false;

        if (mediaElement) {
          if (mediaElement instanceof HTMLImageElement) {
            isFullyLoaded = mediaElement.complete;
          } else if (mediaElement instanceof HTMLVideoElement) {
            isFullyLoaded = mediaElement.readyState >= 1;
          }
        } else {
          isFullyLoaded = true;
        }

        if (isFullyLoaded) {
          targetElement.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
          });

          setLastAutoScrolledIndex(index);

          logger.debug('VerticalGalleryView.solid: 자동 스크롤 실행', {
            index,
            mediaType: mediaElement instanceof HTMLImageElement ? 'image' : 'video',
          });
        } else {
          if (mediaElement) {
            const handleLoadComplete = () => {
              targetElement.scrollIntoView({
                block: 'start',
                behavior: 'smooth',
              });
              setLastAutoScrolledIndex(index);
              logger.debug('VerticalGalleryView.solid: 지연된 자동 스크롤 실행', { index });
            };

            if (mediaElement instanceof HTMLImageElement) {
              mediaElement.addEventListener('load', handleLoadComplete, { once: true });
            } else if (mediaElement instanceof HTMLVideoElement) {
              mediaElement.addEventListener('loadeddata', handleLoadComplete, { once: true });
            }
          }
        }
      }
    }
  };

  // 미디어 아이템 클릭 핸들러
  const handleMediaItemClick = (index: number) => {
    if (index >= 0 && index < mediaItems().length && index !== currentIndex()) {
      setLastAutoScrolledIndex(-1);
      navigateToItem(index);
      logger.debug('VerticalGalleryView.solid: 미디어 아이템 클릭으로 네비게이션', { index });
    }
  };

  // 다운로드 핸들러들
  const handleDownloadCurrent = () => {
    if (props.onDownloadCurrent) {
      props.onDownloadCurrent();
      logger.debug('VerticalGalleryView.solid: 현재 아이템 다운로드 시작');
    }
  };

  const handleDownloadAll = () => {
    if (props.onDownloadAll) {
      props.onDownloadAll();
      logger.debug('VerticalGalleryView.solid: 전체 다운로드 시작');
    }
  };

  // 이미지 핏 모드 핸들러들
  const handleFitOriginal = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('original');
    setSetting('gallery.imageFitMode' as unknown as string, 'original').catch(() => {});
    logger.debug('VerticalGalleryView.solid: 이미지 크기를 원본으로 설정');
  };

  const handleFitWidth = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitWidth');
    setSetting('gallery.imageFitMode' as unknown as string, 'fitWidth').catch(() => {});
    logger.debug('VerticalGalleryView.solid: 이미지 크기를 가로 맞춤으로 설정');
  };

  const handleFitHeight = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitHeight');
    setSetting('gallery.imageFitMode' as unknown as string, 'fitHeight').catch(() => {});
    logger.debug('VerticalGalleryView.solid: 이미지 크기를 세로 맞춤으로 설정');
  };

  const handleFitContainer = (event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setImageFitMode('fitContainer');
    setSetting('gallery.imageFitMode' as unknown as string, 'fitContainer').catch(() => {});
    logger.debug('VerticalGalleryView.solid: 이미지 크기를 창 맞춤으로 설정');
  };

  // 이미지 핏 모드 변경 로그
  createEffect(() => {
    logger.debug('VerticalGalleryView.solid: 이미지 핏 모드 변경됨', {
      mode: imageFitMode(),
      mediaItemsCount: mediaItems().length,
    });
  });

  // 빈 상태 처리
  const EmptyState = () => {
    const emptyTitle = languageService.getString('messages.gallery.emptyTitle');
    const emptyDesc = languageService.getString('messages.gallery.emptyDescription');

    return (
      <div class={`${styles.container} ${styles.empty} ${stringWithDefault(merged.className, '')}`}>
        <div class={styles.emptyMessage}>
          <h3>{emptyTitle}</h3>
          <p>{emptyDesc}</p>
        </div>
      </div>
    );
  };

  return (
    <Show when={isVisible() && mediaItems().length > 0} fallback={<EmptyState />}>
      <div
        ref={containerRef}
        class={`${styles.container} ${stringWithDefault(merged.className, '')}`}
        onClick={handleBackgroundClick}
        data-xeg-gallery='true'
        data-xeg-role='gallery'
      >
        {/* 툴바 호버 트리거 영역 */}
        <div class={styles.toolbarHoverZone} ref={toolbarHoverZoneRef} />

        {/* 툴바 래퍼 */}
        <div class={styles.toolbarWrapper} ref={toolbarWrapperRef}>
          <ToolbarWithSettings
            onClose={merged.onClose}
            onPrevious={merged.onPrevious}
            onNext={merged.onNext}
            currentIndex={currentIndex()}
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

        {/* 콘텐츠 영역 - For 컴포넌트로 아이템 렌더링 */}
        <div
          class={styles.itemsContainer}
          data-xeg-role='items-container'
          data-xeg-role-compat='items-list'
        >
          <For each={itemsToRender()}>
            {(item, index) => {
              const actualIndex = index();
              const forcePreload = preloadIndices().includes(actualIndex);

              return (
                <VerticalImageItem
                  media={item}
                  index={actualIndex}
                  totalCount={mediaItems().length}
                  isActive={actualIndex === currentIndex()}
                  isFocused={actualIndex === focusedIndex()}
                  forceVisible={forcePreload}
                  fitMode={imageFitMode()}
                  onClick={() => handleMediaItemClick(actualIndex)}
                  onMediaLoad={handleMediaLoad}
                  className={`${styles.galleryItem} ${actualIndex === currentIndex() ? styles.itemActive : ''}`}
                  data-index={actualIndex}
                  data-xeg-role='gallery-item'
                  {...(props.onDownloadAll && { onDownload: handleDownloadCurrent })}
                  onFocus={() => setFocusedIndex(actualIndex)}
                  onBlur={() => setFocusedIndex(-1)}
                />
              );
            }}
          </For>
        </div>
      </div>
    </Show>
  );
}
