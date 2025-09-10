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
import type { ImageFitMode } from '@shared/types';
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import { getPreactHooks, getPreact } from '@shared/external/vendors';
import { stringWithDefault } from '@shared/utils/type-safety-helpers';
import {
  animateGalleryEnter,
  animateGalleryExit,
  setupScrollAnimation,
} from '@shared/utils/animations';
import { useGalleryCleanup } from './hooks/useGalleryCleanup';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryScroll } from '../../hooks/useGalleryScroll';
import { useGalleryItemScroll } from '../../hooks/useGalleryItemScroll';
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
  const { createElement } = getPreact();

  // Signal에서 상태 구독
  const [state, setState] = useState(galleryState.value);

  useEffect(() => {
    const unsubscribe = galleryState.subscribe(newState => {
      setState(newState);
    });

    logger.info('🚀 VerticalGalleryView: Signal 구독 시작', {
      mediaCount: state.mediaItems.length,
      currentIndex: state.currentIndex,
      isDownloading: state.isLoading,
    });

    return unsubscribe;
  }, []);

  // 구독된 상태에서 값 추출
  const mediaItems = state.mediaItems;
  const currentIndex = state.currentIndex;
  const isDownloading = state.isLoading;

  logger.debug('VerticalGalleryView: Rendering with state', {
    mediaCount: mediaItems.length,
    currentIndex,
    isDownloading,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  // DOM 평탄화를 위해 중간 content 래퍼 제거 (A1)
  // const contentRef = useRef<HTMLDivElement>(null);
  const toolbarHoverZoneRef = useRef<HTMLDivElement>(null);
  const toolbarWrapperRef = useRef<HTMLDivElement>(null);

  // 단순화된 가시성 상태 관리
  const [isVisible, setIsVisible] = useState(mediaItems.length > 0);

  // DOM 요소 준비 상태 추적
  const [domReady, setDomReady] = useState(false);

  // DOM 요소 준비 확인
  useEffect(() => {
    if (toolbarWrapperRef.current && toolbarHoverZoneRef.current) {
      setDomReady(true);
    }
  }, [isVisible]); // isVisible이 변경될 때마다 DOM 요소 확인

  // 순수 CSS 기반 툴바 제어 시스템으로 전환 완료
  // - 복잡한 JavaScript 타이머 로직 제거
  // - 브라우저 네이티브 호버 성능 활용
  // - CSS 변수를 통한 상태 관리
  logger.debug('VerticalGalleryView: CSS 기반 툴바 시스템 활성화', {
    mediaCount: mediaItems.length,
    domReady,
  });

  // 간소화된 CSS 기반 툴바 제어 시스템:
  // - JavaScript 타이머 로직 제거 (100줄 → 0줄)
  // - 브라우저 네이티브 성능 활용
  // - CSS 호버 존 시스템으로 즉시 반응형 제어

  // 포커스 상태 관리
  const [focusedIndex, setFocusedIndex] = useState<number>(currentIndex);

  // 자동 스크롤 상태 관리 - 중복 스크롤 방지
  const [lastAutoScrolledIndex, setLastAutoScrolledIndex] = useState<number>(-1);

  // 강제 렌더링 상태 관리 (더 이상 사용하지 않음)
  const [forceVisibleItems] = useState<Set<number>>(new Set());

  // 포커스된 인덱스와 현재 인덱스 동기화
  useEffect(() => {
    setFocusedIndex(currentIndex);
    // 인덱스가 변경되면 자동 스크롤 상태 초기화
    setLastAutoScrolledIndex(-1);
  }, [currentIndex]);

  // 메모이제이션 최적화
  const memoizedMediaItems = useMemo(() => {
    const itemsWithKeys = mediaItems.map((item, index) => ({
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

  // 최적화: 미디어 개수 변경 시에만 가시성 업데이트
  useEffect(() => {
    const shouldBeVisible = mediaItems.length > 0;
    if (isVisible !== shouldBeVisible) {
      setIsVisible(shouldBeVisible);
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

  // UI 상태와 독립적으로 스크롤 가용성 보장
  useEffect(() => {
    if (containerRef.current) {
      ensureGalleryScrollAvailable(containerRef.current);
    }
  }, []); // showToolbar 의존성 제거 - 순수 CSS로 관리됨

  // 개선된 갤러리 스크롤 처리 - UI 상태와 독립적으로 동작
  useGalleryScroll({
    container: containerRef.current,
    onScroll: delta => {
      // 스크롤이 발생할 때마다 호출되는 콜백
      logger.debug('VerticalGalleryView: 스크롤 감지', { delta, timestamp: Date.now() });
      // 순수 CSS 호버 시스템으로 인해 별도의 UI 타이머 재설정 불필요
    },
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
    (event: MouseEvent) => {
      // 툴바나 툴바 영역 클릭은 무시
      const target = event.target as HTMLElement;
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
        const itemsContainerElement = containerRef.current?.querySelector(
          '[data-xeg-role="items-container"]'
        );
        const targetElement = itemsContainerElement?.children[index] as HTMLElement;

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

            // 스크롤 완료 상태 업데이트
            setLastAutoScrolledIndex(index);

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
                setLastAutoScrolledIndex(index);
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
        // 새로운 아이템으로 네비게이션 시 자동 스크롤 상태 초기화
        setLastAutoScrolledIndex(-1);
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

  // CSS 기반 툴바 제어가 모든 이벤트 처리를 담당
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

      {/* 콘텐츠 영역 - 직접 아이템 렌더링 (래퍼 제거 완료) */}
      <div
        className={styles.itemsContainer}
        data-xeg-role='items-container'
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          overflow: 'auto',
        }}
      >
        {itemsToRender.map((item, index) => {
          const actualIndex = index;
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
            'data-xeg-role': 'gallery-item',
            onDownload: onDownloadAll ? () => handleDownloadCurrent() : undefined,
            onFocus: () => setFocusedIndex(actualIndex),
            onBlur: () => setFocusedIndex(-1),
          });
        })}
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
    return VerticalGalleryViewCore;
  }

  // 프로덕션에서는 지연 로딩으로 memo 적용
  return VerticalGalleryViewCore;
})();

export { VerticalGalleryView };
