/**
 * Copyright (c) 2024 X.com Enhanced Gallery - MIT License
 *
 * @fileoverview Vertical Gallery View Component
 * @version 6.0 - 통합 툴바 상태 관리 시스템 적용
 *
 * 주요 개선사항:
 * - 통합 툴바 상태 관리 (Signals 기반)
 * - 타이머 통합 관리로 충돌 방지
 * - 중복 로직 제거 및 코드 간소화
 * - 일관된 사용자 경험 제공
 */

import { logger } from '@shared/logging/logger';
import { Toast } from '@shared/components/ui/Toast/Toast';
import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';
import type { MediaItem } from '@shared/types/media.types';
import type { ImageFitMode, MediaInfo } from '@shared/types';
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import {
  getPreactHooks,
  getPreact,
  getPreactCompat,
  getPreactSignals,
} from '@shared/external/vendors';
import { stringWithDefault } from '@shared/utils/type-safety-helpers';
import type { MouseEvent } from 'preact/compat';
import {
  animateGalleryEnter,
  animateGalleryExit,
  setupScrollAnimation,
} from '@shared/utils/animations';
import { useToolbarPositionBased } from '@features/gallery/hooks';
import { isHTMLElement } from '@shared/utils/dom-guards';
import { useGalleryCleanup } from './hooks/useGalleryCleanup';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryScroll } from '../../hooks/useGalleryScroll';
import { useGalleryItemScroll } from '../../hooks/useGalleryItemScroll';
import { useSmartImageFit } from '../../hooks/useSmartImageFit';
import { ensureGalleryScrollAvailable } from '@shared/utils';
import styles from './VerticalGalleryView.module.css';
import { VerticalImageItem } from './VerticalImageItem';

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
}: VerticalGalleryViewProps) {
  const { useCallback, useEffect, useRef, useState, useMemo } = getPreactHooks();
  const { signal } = getPreactSignals();
  const { createElement } = getPreact();

  // Phase 8 GREEN: galleryState를 직접 사용 - Preact가 자동으로 신호 변경을 감지
  // Preact에서는 컴포넌트 내에서 signal.value 접근 시 자동으로 구독됨
  const currentState = galleryState.value;

  logger.info('🚀 VerticalGalleryView: Preact Signal 직접 사용', {
    mediaCount: currentState.mediaItems.length,
    currentIndex: currentState.currentIndex,
    isDownloading: currentState.isLoading,
  });

  // 구독된 상태에서 값 추출 - Preact Signal 직접 접근으로 자동 구독
  const mediaItems = currentState.mediaItems;
  const currentIndex = currentState.currentIndex;
  const isDownloading = currentState.isLoading;

  logger.debug('VerticalGalleryView: Rendering with state', {
    mediaCount: mediaItems.length,
    currentIndex,
    isDownloading,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarHoverZoneRef = useRef<HTMLDivElement>(null);
  const toolbarWrapperRef = useRef<HTMLDivElement>(null);

  // Phase 8 GREEN: signal로 가시성 상태 관리 현대화
  const isVisibleSignal = signal(mediaItems.length > 0);
  const isVisible = isVisibleSignal.value;

  // Phase 8 GREEN: signal로 DOM 준비 상태 추적 현대화
  const domReadySignal = signal(false);
  const domReady = domReadySignal.value;

  // DOM 요소 준비 확인 - signal과 함께 사용
  useEffect(() => {
    if (toolbarWrapperRef.current && toolbarHoverZoneRef.current) {
      domReadySignal.value = true;
    }
  }, [isVisible, domReadySignal]); // isVisible이 변경될 때마다 DOM 요소 확인

  // useToolbarPositionBased 훅을 사용하여 간소화된 위치 기반 툴바 제어
  const {
    isVisible: _toolbarVisible,
    show: _showToolbar,
    hide: _hideToolbar,
  } = useToolbarPositionBased({
    toolbarElement: domReady ? toolbarWrapperRef.current : null,
    hoverZoneElement: domReady ? toolbarHoverZoneRef.current : null,
    enabled: isVisible && mediaItems.length > 0 && domReady,
    initialAutoHideDelay: 1000, // 1초 후 자동 숨김
  });

  // 간소화된 위치 기반 시스템으로 교체:
  // - 복잡한 타이머 로직 제거 (100줄 → 30줄)
  // - 마우스 위치에 따른 즉시 반응형 제어
  // - 기존 CSS 호버 존 시스템 활용

  // Phase 8 GREEN: signal로 포커스 상태 관리 현대화
  const focusedIndexSignal = signal<number>(currentIndex);
  const focusedIndex = focusedIndexSignal.value;

  // Phase 8 GREEN: signal로 자동 스크롤 상태 관리 현대화 - 중복 스크롤 방지
  const lastAutoScrolledIndexSignal = signal<number>(-1);
  const lastAutoScrolledIndex = lastAutoScrolledIndexSignal.value;

  // 강제 렌더링 상태 관리 (더 이상 사용하지 않음)
  const [forceVisibleItems] = useState<Set<number>>(new Set());

  // 현재 이미지 요소 추적을 위한 ref
  const currentImageElementRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);

  // 현재 이미지 요소 업데이트 (VerticalImageItem에서 호출됨)
  const updateCurrentImageElement = useCallback(
    (element: HTMLImageElement | HTMLVideoElement | null) => {
      currentImageElementRef.current = element;
    },
    []
  );

  // 포커스된 인덱스와 현재 인덱스 동기화 - signal 방식
  useEffect(() => {
    focusedIndexSignal.value = currentIndex;
    // 인덱스가 변경되면 자동 스크롤 상태 초기화
    lastAutoScrolledIndexSignal.value = -1;

    // 현재 활성 이미지 요소 업데이트
    if (containerRef.current) {
      const itemsList = containerRef.current.querySelector('[data-xeg-role="items-list"]');
      if (itemsList) {
        const currentItem = itemsList.children[currentIndex] as HTMLElement;
        if (currentItem) {
          const imageElement = currentItem.querySelector('img, video') as
            | HTMLImageElement
            | HTMLVideoElement
            | null;
          updateCurrentImageElement(imageElement);
        }
      }
    }
  }, [currentIndex, focusedIndexSignal, lastAutoScrolledIndexSignal, updateCurrentImageElement]);

  // 메모이제이션 최적화
  const memoizedMediaItems = useMemo(() => {
    const itemsWithKeys = mediaItems.map((item: MediaInfo, index: number) => ({
      ...item,
      _galleryKey: `${item.id || item.url}-${index}`,
      _index: index,
    }));

    logger.debug('VerticalGalleryView: 미디어 아이템 메모이제이션', {
      count: itemsWithKeys.length,
    });

    return itemsWithKeys;
  }, [mediaItems]);

  // 렌더링할 아이템들 (가상 스크롤링 제거 - 항상 모든 아이템 렌더링)
  const itemsToRender = memoizedMediaItems;

  // Phase 8 GREEN: useSignal로 가시성 업데이트 최적화
  useEffect(() => {
    const shouldBeVisible = mediaItems.length > 0;
    if (isVisible !== shouldBeVisible) {
      isVisibleSignal.value = shouldBeVisible;
      logger.debug('VerticalGalleryView: 가시성 상태 변경', {
        wasVisible: isVisible,
        nowVisible: shouldBeVisible,
        mediaCount: mediaItems.length,
      });
    }
  }, [mediaItems.length, isVisible]);

  // 갤러리 진입/종료 애니메이션
  useEffect(() => {
    if (containerRef.current) {
      if (isVisible) {
        animateGalleryEnter(containerRef.current);
        logger.debug('갤러리 진입 애니메이션 실행');
      } else {
        animateGalleryExit(containerRef.current);
        logger.debug('갤러리 종료 애니메이션 실행');
      }
    }
  }, [isVisible]);

  // 갤러리 닫힘 시 비디오 정리
  useEffect(() => {
    if (!isVisible) {
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
  }, [isVisible]);

  // 초기 설정 최적화
  const getInitialFitMode = (): ImageFitMode => {
    try {
      const saved = localStorage.getItem('xeg-image-fit-mode');
      return (saved as ImageFitMode) || 'fitWidth';
    } catch (error) {
      logger.warn('ImageFitMode 복원 실패:', error);
      return 'fitWidth';
    }
  };

  const [imageFitMode, updateImageFitMode] = useState<ImageFitMode>(() => getInitialFitMode());

  // 현재 이미지의 스마트 핏 정보 계산
  const smartImageFit = useSmartImageFit({
    imageElement: currentImageElementRef.current,
    fitMode: imageFitMode,
    watchViewportResize: true,
  });

  // UI 상태와 독립적으로 스크롤 가용성 보장
  useEffect(() => {
    if (containerRef.current) {
      ensureGalleryScrollAvailable(containerRef.current);
    }
  }, []); // showToolbar 의존성 제거 - 순수 CSS로 관리됨

  // 개선된 갤러리 스크롤 처리 - 조건적 wheel 이벤트 처리 포함
  useGalleryScroll({
    container: containerRef.current,
    onScroll: delta => {
      // 큰 이미지에서의 스크롤 처리
      logger.debug('VerticalGalleryView: 큰 이미지 스크롤 감지', {
        delta,
        imageSize: smartImageFit.imageSize,
        viewportSize: smartImageFit.viewportSize,
        isSmallImage: smartImageFit.isImageSmallerThanViewport,
        timestamp: Date.now(),
      });
    },
    onImageNavigation: direction => {
      // 작은 이미지에서의 wheel 네비게이션 처리
      const nextIndex =
        direction === 'next'
          ? Math.min(currentIndex + 1, mediaItems.length - 1)
          : Math.max(currentIndex - 1, 0);

      if (nextIndex !== currentIndex) {
        logger.debug('VerticalGalleryView: 휠 네비게이션', {
          direction,
          currentIndex,
          nextIndex,
          imageSize: smartImageFit.imageSize,
          isSmallImage: smartImageFit.isImageSmallerThanViewport,
        });
        navigateToItem(nextIndex);
      }
    },
    imageSize: smartImageFit.imageSize,
    viewportSize: smartImageFit.viewportSize,
    enabled: isVisible,
    blockTwitterScroll: true,
  });

  // 부드러운 스크롤 애니메이션 설정
  useEffect(() => {
    if (containerRef.current) {
      const cleanup = setupScrollAnimation(({ scrollY, progress }) => {
        // 스크롤 진행도에 따른 동적 효과
        logger.debug('스크롤 애니메이션', { scrollY, progress });
      }, containerRef.current);

      return cleanup;
    }
    return () => {}; // cleanup 함수가 없는 경우 빈 함수 반환
  }, [isVisible]); // 백그라운드 클릭 핸들러 (갤러리 닫기만 처리)
  const handleBackgroundClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      // 툴바나 툴바 영역 클릭은 무시
      const rawTarget = event.target;
      if (!isHTMLElement(rawTarget)) return;
      const target = rawTarget;
      if (
        target.closest('.toolbarWrapper') ||
        target.closest('.toolbarHoverZone') ||
        target.closest('[data-role="toolbar"]') ||
        target.closest('[class*="toolbar"]')
      ) {
        return;
      }

      // event.target이 실제 클릭된 요소이고, event.currentTarget은 이벤트 리스너가 부착된 요소입니다.
      // 두 요소가 같을 때만 (즉, 컨테이너의 배경을 직접 클릭했을 때만) 갤러리를 닫습니다.
      if (event.target === event.currentTarget) {
        onClose?.();
      }
    },
    [onClose]
  );

  // 콘텐츠 클릭 핸들러 (이벤트 전파 방지)
  const handleContentClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  }, []);

  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      duration?: number;
    }>
  >([]);

  // 갤러리 아이템 스크롤 (자동 스크롤 처리)
  useGalleryItemScroll(containerRef, currentIndex, mediaItems.length, {
    enabled: true,
    behavior: 'smooth',
    block: 'start',
    debounceDelay: 100,
  });

  // 갤러리 정리
  useGalleryCleanup({
    isVisible,
    hideTimeoutRef: { current: null }, // 더 이상 사용하지 않음
    themeCleanup: () => {
      logger.debug('Theme cleanup called');
    },
  });

  // Toast 관리 함수
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 미디어 로드 완료 핸들러 - 자동 스크롤 로직 적용
  const handleMediaLoad = useCallback(
    (mediaId: string, index: number) => {
      logger.debug('VerticalGalleryView: 미디어 로드 완료', { mediaId, index });

      // 현재 선택된 인덱스와 일치하고, 아직 자동 스크롤하지 않은 경우에만 스크롤
      if (index === currentIndex && index !== lastAutoScrolledIndex) {
        // 이미지/비디오가 완전히 로드되었는지 확인
        const itemsListElement = containerRef.current?.querySelector(
          '[data-xeg-role="items-list"]'
        );
        const targetElement = itemsListElement?.children[index] as HTMLElement;

        if (targetElement) {
          // 이미지 또는 비디오 요소 찾기
          const mediaElement = targetElement.querySelector('img, video') as
            | HTMLImageElement
            | HTMLVideoElement;

          let isFullyLoaded = false;

          if (mediaElement) {
            if (mediaElement instanceof HTMLImageElement) {
              // 이미지의 경우 complete 속성 확인
              isFullyLoaded = mediaElement.complete;
            } else if (mediaElement instanceof HTMLVideoElement) {
              // 비디오의 경우 readyState 확인 (1 이상이면 메타데이터 로드 완료)
              isFullyLoaded = mediaElement.readyState >= 1;
            }
          } else {
            // 미디어 요소를 찾을 수 없는 경우 즉시 스크롤
            isFullyLoaded = true;
          }

          if (isFullyLoaded) {
            // 상단 정렬로 부드럽게 스크롤
            targetElement.scrollIntoView({
              block: 'start',
              behavior: 'smooth',
            });

            // 스크롤 완료 상태 업데이트 - useSignal 방식
            lastAutoScrolledIndexSignal.value = index;

            logger.debug('VerticalGalleryView: 자동 스크롤 실행', {
              index,
              mediaType: mediaElement instanceof HTMLImageElement ? 'image' : 'video',
            });
          } else {
            // 아직 완전히 로드되지 않은 경우, 일회성 로드 이벤트 리스너 연결
            if (mediaElement) {
              const handleLoadComplete = () => {
                targetElement.scrollIntoView({
                  block: 'start',
                  behavior: 'smooth',
                });
                lastAutoScrolledIndexSignal.value = index;
                logger.debug('VerticalGalleryView: 지연된 자동 스크롤 실행', { index });
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
    },
    [currentIndex, lastAutoScrolledIndex, containerRef]
  );

  // 미디어 아이템 클릭 핸들러 - 자동 스크롤 상태 초기화 추가
  const handleMediaItemClick = useCallback(
    (index: number) => {
      if (index >= 0 && index < mediaItems.length && index !== currentIndex) {
        // 새로운 아이템으로 네비게이션 시 자동 스크롤 상태 초기화 - useSignal 방식
        lastAutoScrolledIndexSignal.value = -1;
        navigateToItem(index);
        logger.debug('VerticalGalleryView: 미디어 아이템 클릭으로 네비게이션', { index });
      }
    },
    [currentIndex, mediaItems.length]
  );

  // 키보드 지원 (Esc 키만)
  useGalleryKeyboard({
    onClose: onClose || (() => {}),
  });

  // 다운로드 핸들러들
  const handleDownloadCurrent = useCallback(() => {
    if (onDownloadCurrent) {
      onDownloadCurrent();
      logger.debug('VerticalGalleryView: 현재 아이템 다운로드 시작');
    }
  }, [onDownloadCurrent]);

  const handleDownloadAll = useCallback(() => {
    if (onDownloadAll) {
      onDownloadAll();
      logger.debug('VerticalGalleryView: 전체 다운로드 시작');
    }
  }, [onDownloadAll]);

  // 이미지 핏 모드 핸들러들 - 이벤트 전파 차단 추가
  const handleFitOriginal = useCallback((event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    updateImageFitMode('original');
    try {
      localStorage.setItem('xeg-image-fit-mode', 'original');
      logger.debug('VerticalGalleryView: 이미지 크기를 원본으로 설정');
    } catch (error) {
      logger.debug('Failed to save image fit mode:', error);
    }
  }, []);

  const handleFitWidth = useCallback((event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    updateImageFitMode('fitWidth');
    try {
      localStorage.setItem('xeg-image-fit-mode', 'fitWidth');
      logger.debug('VerticalGalleryView: 이미지 크기를 가로 맞춤으로 설정');
    } catch (error) {
      logger.debug('Failed to save image fit mode:', error);
    }
  }, []);

  const handleFitHeight = useCallback((event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    updateImageFitMode('fitHeight');
    try {
      localStorage.setItem('xeg-image-fit-mode', 'fitHeight');
      logger.debug('VerticalGalleryView: 이미지 크기를 세로 맞춤으로 설정');
    } catch (error) {
      logger.debug('Failed to save image fit mode:', error);
    }
  }, []);

  const handleFitContainer = useCallback((event?: Event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    updateImageFitMode('fitContainer');
    try {
      localStorage.setItem('xeg-image-fit-mode', 'fitContainer');
      logger.debug('VerticalGalleryView: 이미지 크기를 창 맞춤으로 설정');
    } catch (error) {
      logger.debug('Failed to save image fit mode:', error);
    }
  }, []);

  // 이미지 핏 모드가 변경될 때 로그 출력
  useEffect(() => {
    logger.debug('VerticalGalleryView: 이미지 핏 모드 변경됨', {
      mode: imageFitMode,
      mediaItemsCount: mediaItems.length,
    });
  }, [imageFitMode, mediaItems.length]);

  // useToolbarPositionBased 훅이 모든 툴바 이벤트 처리를 담당
  // 중복된 이벤트 핸들러 제거 완료

  // 빈 상태 처리
  if (!isVisible || mediaItems.length === 0) {
    return (
      <div className={`${styles.container} ${styles.empty} ${stringWithDefault(className, '')}`}>
        <div className={styles.emptyMessage}>
          <h3>미디어가 없습니다</h3>
          <p>표시할 이미지나 비디오가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${stringWithDefault(className, '')}`}
      onClick={handleBackgroundClick}
      data-xeg-gallery='true'
      data-xeg-role='gallery'
    >
      {/* 툴바 호버 트리거 영역 (브라우저 상단 100px) */}
      <div className={styles.toolbarHoverZone} ref={toolbarHoverZoneRef} />

      {/* 툴바 래퍼 - 순수 CSS 호버로 제어됨 */}
      <div className={styles.toolbarWrapper} ref={toolbarWrapperRef}>
        <ToolbarWithSettings
          onClose={onClose || (() => {})}
          onPrevious={onPrevious || (() => {})}
          onNext={onNext || (() => {})}
          currentIndex={currentIndex}
          totalCount={mediaItems.length}
          isDownloading={isDownloading}
          onDownloadCurrent={handleDownloadCurrent}
          onDownloadAll={handleDownloadAll}
          onFitOriginal={handleFitOriginal}
          onFitWidth={handleFitWidth}
          onFitHeight={handleFitHeight}
          onFitContainer={handleFitContainer}
          className={styles.toolbar || ''}
        />
      </div>

      {/* 콘텐츠 영역 */}
      <div ref={contentRef} className={styles.content} onClick={handleContentClick}>
        <div
          className={styles.itemsList}
          data-xeg-role='items-list'
          // 스타일은 VerticalGalleryView.module.css에 정의됨
        >
          {itemsToRender.map((item: MediaItem, index: number) => {
            // 가상 스크롤링 제거 - 실제 인덱스는 배열 인덱스와 동일
            const actualIndex = index;

            // 키 생성 (memoizedMediaItems와 동일한 방식)
            const itemKey = `${item.id || item.url}-${actualIndex}`;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return createElement(VerticalImageItem as any, {
              key: itemKey,
              media: item,
              index: actualIndex,
              isActive: actualIndex === currentIndex,
              isFocused: actualIndex === focusedIndex,
              forceVisible: forceVisibleItems.has(actualIndex),
              fitMode: imageFitMode,
              onClick: () => handleMediaItemClick(actualIndex),
              onMediaLoad: handleMediaLoad,
              className: `${styles.galleryItem} ${actualIndex === currentIndex ? styles.itemActive : ''}`,
              'data-index': actualIndex,
            });
          })}
        </div>
      </div>

      {/* Toast 메시지 */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* 툴바 호버 핸들러 - 프로덕션 빌드 호환성을 위한 JavaScript 백업 */}
    </div>
  );
}

// 메모이제이션된 컴포넌트 - 동적 로딩 방식
const VerticalGalleryView = (() => {
  // 개발 환경에서는 memo 없이 사용 (Hot Reload 호환성)
  if (import.meta.env.DEV) {
    Object.defineProperty(VerticalGalleryViewCore, 'displayName', {
      value: 'VerticalGalleryView',
      writable: false,
      configurable: true,
    });
  }

  // memo 적용으로 성능 최적화
  const { memo } = getPreactCompat();
  return memo(VerticalGalleryViewCore);
})();

export { VerticalGalleryView };
