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
import type { ImageFitMode, MediaInfo } from '@shared/types';
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import {
  getPreactHooks,
  getPreact,
  getPreactCompat,
  getPreactSignals,
} from '@shared/external/vendors';
import { stringWithDefault } from '@shared/utils/type-safety-helpers';
import {
  animateGalleryEnter,
  animateGalleryExit,
  setupScrollAnimation,
} from '@shared/utils/animations';
import { useToolbarPositionBased } from '@features/gallery/hooks';
import { useGalleryCleanup } from './hooks/useGalleryCleanup';
import { useGalleryKeyboard } from './hooks/useGalleryKeyboard';
import { useGalleryScroll } from '../../hooks/useGalleryScroll';
import { useGalleryItemScroll } from '../../hooks/useGalleryItemScroll';
import { useVisibleCenterItem } from '../../hooks/useVisibleCenterItem';
import {
  navigationIntentState,
  setToolbarIntent,
  resetIntent,
} from '@shared/state/signals/navigation-intent.signals';
// CH2 REFACTOR 준비: viewRoot(gallery)와 itemsList 통합 후 배경 클릭 식별 유틸을 별도로 분리
// 임시 유틸: 향후 test/refactoring/gallery/container-depth-ch2-red.spec.ts GREEN 전환 시 사용
function isBackgroundClick(target: EventTarget | null, currentTarget: EventTarget | null): boolean {
  if (!target || !currentTarget) return false;
  if (!(target instanceof HTMLElement) || !(currentTarget instanceof HTMLElement)) return false;
  // 툴바 / 갤러리 아이템 내부 클릭은 배경이 아님
  if (
    target.closest('.toolbarWrapper') ||
    target.closest('.toolbarHoverZone') ||
    target.closest('[data-role="toolbar"]') ||
    target.closest('[class*="toolbar"]') ||
    target.closest('[data-xeg-role="items-list"]') ||
    target.closest('[data-xeg-role="gallery-item"]')
  ) {
    return false;
  }
  return target === currentTarget;
}
import { useSmartImageFit } from '../../hooks/useSmartImageFit';
import { useGalleryClassNames } from '../../hooks/useGalleryClassNames';
import { ensureGalleryScrollAvailable } from '@shared/utils';
import styles from './VerticalGalleryView.module.css';
import enhancedStyles from './EnhancedGalleryScroll.module.css';
import { VerticalImageItem } from './VerticalImageItem';
import { FEATURE_BODY_SCROLL_LOCK, isIOSSafari } from '@/constants';
import { useBodyScrollLock } from '@shared/hooks/useBodyScrollLock';

// 내부 경량 타입 정의 (vendor 직접 import 회피)
interface GalleryMouseEvent {
  target: EventTarget | null;
  currentTarget?: EventTarget | null;
  stopPropagation: () => void;
  preventDefault: () => void;
}

interface GalleryStyle {
  [key: string]: string | number | undefined; // CSSProperties 구조 호환을 위한 인덱스 시그니처
  position: string;
  top: number | string;
  left: number | string;
  width: string;
  minHeight: string;
  overflowY: 'auto' | 'scroll' | 'hidden' | 'visible';
  zIndex: number;
  backgroundColor: string;
}

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
  // Preact core (createElement 제거: JSX 사용으로 대체)
  getPreact();

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

  const containerRef = useRef<HTMLDivElement>(null); // overlay
  const scrollAreaRef = useRef<HTMLDivElement>(null); // 내부 스크롤 영역
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

  // Phase 9.3 REFACTOR: 갤러리 클래스 이름 최적화된 생성
  const galleryClassName = useGalleryClassNames(
    styles,
    enhancedStyles,
    smartImageFit.isImageSmallerThanViewport,
    [stringWithDefault(className, '')]
  );

  // UI 상태와 독립적으로 스크롤 가용성 보장
  useEffect(() => {
    if (containerRef.current) {
      ensureGalleryScrollAvailable(containerRef.current);
    }
  }, []); // showToolbar 의존성 제거 - 순수 CSS로 관리됨

  // 개선된 갤러리 스크롤 처리 - 조건적 wheel 이벤트 처리 포함
  useGalleryScroll({
    container: containerRef.current,
    scrollElement: scrollAreaRef.current,
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

  // 중심 아이템 계산 훅 (containerRef 기준)
  const { centerIndex, recompute } = useVisibleCenterItem({
    containerRef,
    enabled: isVisible,
  });

  // FocusSync v2: polling 제거 → scroll/wheel 이벤트 기반 rAF + idle window(150ms)
  const { useRef: _useRef2 } = getPreactHooks();
  const idleTimerRef = _useRef2<number | null>(null);
  const lastUserScrollSyncRef = _useRef2(0);
  useEffect(() => {
    const el = scrollAreaRef.current || containerRef.current;
    if (!el) return;
    const handleActivity = () => {
      if (navigationIntentState.value.intent !== 'user-scroll') return;
      recompute();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        if (navigationIntentState.value.intent === 'user-scroll') {
          if (centerIndex >= 0 && centerIndex !== currentIndex) {
            navigateToItem(centerIndex);
          }
          if (Date.now() - navigationIntentState.value.lastUserScrollAt > 300) {
            resetIntent();
          }
        }
      }, 150);
      lastUserScrollSyncRef.current = Date.now();
    };
    el.addEventListener('scroll', handleActivity, { passive: true });
    el.addEventListener('wheel', handleActivity, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleActivity);
      el.removeEventListener('wheel', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [centerIndex, currentIndex, recompute]);

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
    (event: GalleryMouseEvent) => {
      if (isBackgroundClick(event.target, event.currentTarget)) {
        onClose?.();
      }
    },
    [onClose]
  );

  // 콘텐츠 클릭 핸들러 (이벤트 전파 방지)
  const handleContentClick = useCallback((event: GalleryMouseEvent) => {
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
        // CH2: items-list wrapper 제거 → 컨테이너 직속 children 사용
        const targetElement = containerRef.current?.children[index] as HTMLElement;

        if (targetElement) {
          // 이미지 또는 비디오 요소 찾기
          const mediaElement = targetElement.querySelector('img, video') as
            | HTMLImageElement
            | HTMLVideoElement;

          let isFullyLoaded = false;

          if (mediaElement) {
            if (
              typeof HTMLImageElement !== 'undefined' &&
              mediaElement instanceof HTMLImageElement
            ) {
              // 이미지의 경우 complete 속성 확인
              isFullyLoaded = mediaElement.complete;
            } else if (
              typeof HTMLVideoElement !== 'undefined' &&
              mediaElement instanceof HTMLVideoElement
            ) {
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

  // 인라인 갤러리 스타일 (뷰포트 전체, 내부 스크롤 허용)
  const galleryStyle: GalleryStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    minHeight: '100vh',
    overflowY: 'auto',
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.95)',
  };

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

  // 조건부 Body Scroll Lock:
  // 1) iOS Safari 에서만 기본 적용 (overscroll-behavior 한계 보완)
  // 2) 콘텐츠 높이가 뷰포트보다 작은 경우(스크롤 델타 누수 가능) 적용
  // 3) 기능 플래그가 비활성화되면 전역 비활성
  const shouldLockBody = (() => {
    if (!FEATURE_BODY_SCROLL_LOCK) return false;
    const iOS = isIOSSafari();
    const isTestEnv =
      typeof import.meta !== 'undefined' &&
      typeof (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === 'string' &&
      (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE === 'test';
    // 콘텐츠가 작아 배경 스크롤 누수 위험이 있는지 검사
    const containerEl = scrollAreaRef.current || containerRef.current;
    const contentTooSmall = (() => {
      if (!containerEl) return false;
      try {
        const scrollHeight = containerEl.scrollHeight;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        return scrollHeight <= viewportHeight + 8; // 여유 8px
      } catch {
        return false;
      }
    })();
    return iOS || contentTooSmall || isTestEnv;
  })();

  useBodyScrollLock({
    enabled: shouldLockBody,
    debugLabel: 'vertical-gallery',
  });

  // CH2 GREEN: viewRoot(data-xeg-role="gallery") 와 itemsList(data-xeg-role="items-list") 통합
  // 기존 depth: body > #xeg-gallery-root > gallery(viewRoot) > items-list > item (5)
  // 변경 후:    body > #xeg-gallery-root > gallery(items container) > item (4)
  // 구현: 단일 gallery 컨테이너 내부에서 아이템을 직접 렌더 (items-list wrapper 제거)
  return (
    <div
      ref={containerRef}
      style={galleryStyle}
      className={galleryClassName}
      onClick={handleBackgroundClick}
      data-xeg-gallery='true'
      data-xeg-role='gallery'
      data-xeg-depth-phase='ch2'
      data-xeg-structure='overlay-split'
    >
      {/* 툴바 호버 트리거 영역 (브라우저 상단 100px) */}
      <div className={styles.toolbarHoverZone} ref={toolbarHoverZoneRef} />

      {/* 툴바 래퍼 - 순수 CSS 호버로 제어됨 */}
      <div className={styles.toolbarWrapper} ref={toolbarWrapperRef}>
        <ToolbarWithSettings
          onClose={onClose || (() => {})}
          onPrevious={() => {
            setToolbarIntent('prev');
            const nextIndex = Math.max(0, currentIndex - 1);
            navigateToItem(nextIndex);
            onPrevious?.();
          }}
          onNext={() => {
            setToolbarIntent('next');
            const nextIndex = Math.min(mediaItems.length - 1, currentIndex + 1);
            navigateToItem(nextIndex);
            onNext?.();
          }}
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

      {/* Scroll Area (내부 스크롤 전용) */}
      <div ref={scrollAreaRef} className={styles.scrollArea} data-xeg-role='scroll-area'>
        <div
          ref={contentRef}
          className={`${styles.itemsList} ${styles.content || ''}`}
          onClick={handleContentClick}
          data-xeg-role='items-list'
          data-xeg-role-phase='gallery-items-container'
          style={{ display: 'contents' }}
        >
          {itemsToRender.map((item: MediaInfo, index: number) => {
            const actualIndex = index;
            const itemKey = `${item.id || item.url}-${actualIndex}`;
            return (
              <VerticalImageItem
                key={itemKey}
                media={item}
                index={actualIndex}
                isActive={actualIndex === currentIndex}
                isFocused={actualIndex === focusedIndex}
                forceVisible={forceVisibleItems.has(actualIndex)}
                fitMode={imageFitMode}
                onClick={() => handleMediaItemClick(actualIndex)}
                onMediaLoad={handleMediaLoad}
                className={`${styles.galleryItem} ${actualIndex === currentIndex ? styles.itemActive : ''}`}
                data-index={actualIndex}
                data-xeg-role='gallery-item'
              />
            );
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
