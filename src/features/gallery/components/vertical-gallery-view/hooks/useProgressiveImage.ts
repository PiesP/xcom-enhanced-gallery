/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Progressive Image Loading Hook
 * @description Solid.js 기반 이미지의 점진적 로딩과 품질 향상을 제공하는 훅
 */

import { logger } from '../../../../../shared/logging/logger';
import { getSolid } from '../../../../../shared/external/vendors';
import { globalTimerManager } from '../../../../../shared/utils/timer-management';

export interface ProgressiveImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  loadedSrc: string | null;
  progress: number;
  retryCount: number;
}

export interface UseProgressiveImageOptions {
  src: string;
  lowQualitySrc?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  enableProgressTracking?: boolean;
}

export interface UseProgressiveImageReturn {
  state: () => ProgressiveImageState;
  retry: () => void;
  reset: () => void;
  imageProps: {
    readonly src: string;
    readonly onLoad: () => void;
    readonly onError: () => void;
    readonly style: Record<string, string | number>;
  };
}

/**
 * 점진적 이미지 로딩을 위한 커스텀 훅
 *
 * @param options - 이미지 로딩 옵션
 * @returns 이미지 로딩 상태 및 제어 메서드
 */
export function useProgressiveImage({
  src,
  lowQualitySrc,
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 30000,
  enableProgressTracking = true,
}: UseProgressiveImageOptions): UseProgressiveImageReturn {
  const { createSignal, createEffect, on, untrack, onCleanup } = getSolid();

  const [state, setState] = createSignal<ProgressiveImageState>({
    isLoading: false,
    isLoaded: false,
    hasError: false,
    loadedSrc: null,
    progress: 0,
    retryCount: 0,
  });

  let timeoutId: number | null = null;
  let retryTimeoutId: number | null = null;
  let imageEl: HTMLImageElement | null = null;

  // 타이머 정리
  const clearTimers = () => {
    if (timeoutId !== null) {
      globalTimerManager.clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (retryTimeoutId !== null) {
      globalTimerManager.clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }
  };

  // 상태 업데이트 헬퍼
  const updateState = (updates: Partial<ProgressiveImageState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // 에러 처리
  const handleError = (error: Error) => {
    const current = untrack(() => state());
    logger.warn('Image load error:', { error: error.message, src, retryCount: current.retryCount });

    if (current.retryCount < maxRetries) {
      const attempt = current.retryCount + 1;
      const delay = retryDelay * Math.pow(2, current.retryCount); // 지수 백오프

      updateState({ retryCount: attempt });

      retryTimeoutId = globalTimerManager.setTimeout(() => {
        logger.info('Retrying image load:', { src, attempt });
        loadImage(src, true);
      }, delay);
    } else {
      updateState({
        isLoading: false,
        hasError: true,
        progress: 0,
      });
      logger.error('Image load failed after all retries:', src);
    }
  };

  // 진행률 추적 시작
  const startProgressTracking = (imageSrc: string) => {
    if (!enableProgressTracking) {
      return;
    }

    fetch(imageSrc)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const contentLength = response.headers.get('Content-Length');

        if (reader && contentLength) {
          const total = parseInt(contentLength, 10);
          let loaded = 0;

          const readChunk = (): void => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) return;

                loaded += value?.length || 0;
                const progress = Math.round((loaded / total) * 100);
                updateState({ progress });
                readChunk();
              })
              .catch(error => {
                logger.debug('Progress tracking error:', error);
              });
          };

          readChunk();
        }
      })
      .catch(error => {
        logger.debug('Progress fetch error:', error);
      });
  };

  // 이미지 로딩 함수
  const loadImage = (imageSrc: string, isRetry = false) => {
    if (!imageSrc) {
      logger.warn('Empty image source provided');
      return;
    }

    clearTimers();

    if (!isRetry) {
      updateState({
        isLoading: true,
        isLoaded: false,
        hasError: false,
        progress: 0,
      });
    }

    const img = new Image();
    imageEl = img;

    // 진행률 추적 시작
    startProgressTracking(imageSrc);

    // 타임아웃 설정
    timeoutId = globalTimerManager.setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      handleError(new Error('Image load timeout'));
    }, timeout);

    // 로드 성공 핸들러
    img.onload = () => {
      clearTimers();
      updateState({
        isLoading: false,
        isLoaded: true,
        hasError: false,
        loadedSrc: imageSrc,
        progress: 100,
      });
      logger.info('Image loaded successfully:', imageSrc);
    };

    // 로드 실패 핸들러
    img.onerror = () => {
      clearTimers();
      handleError(new Error('Image load failed'));
    };

    img.src = imageSrc;
  };

  // Manual retry
  const retry = () => {
    const current = state();
    if (current.retryCount < maxRetries) {
      logger.info('Manual retry triggered:', src);
      updateState({ retryCount: 0 });
      loadImage(src);
    }
  };

  // 상태 리셋
  const reset = () => {
    clearTimers();
    updateState({
      isLoading: false,
      isLoaded: false,
      hasError: false,
      loadedSrc: null,
      progress: 0,
      retryCount: 0,
    });
  };

  // 이미지 소스 변경 시 로딩 시작
  createEffect(
    on(
      () => [src, lowQualitySrc] as const,
      ([currentSrc, currentLowQuality]) => {
        clearTimers();

        if (!currentSrc) {
          return;
        }

        const alreadyLoaded = untrack(() => state().loadedSrc === currentSrc);

        // 저품질 이미지가 있으면 먼저 로드
        if (currentLowQuality && !alreadyLoaded) {
          loadImage(currentLowQuality);
          // 고품질 이미지는 잠시 후 로드
          globalTimerManager.setTimeout(() => loadImage(currentSrc), 100);
        } else {
          loadImage(currentSrc);
        }
      },
      { defer: true }
    )
  );

  // 컴포넌트 언마운트 시 정리
  onCleanup(() => {
    clearTimers();
    if (imageEl) {
      imageEl.onload = null;
      imageEl.onerror = null;
      imageEl = null;
    }
  });

  // 이미지 엘리먼트 속성
  const imageProps = {
    get src() {
      const current = state();
      return current.loadedSrc ?? lowQualitySrc ?? src;
    },
    onLoad: () => {
      if (state().loadedSrc === src) {
        // 고품질 이미지 로딩 완료
        updateState({ isLoading: false, isLoaded: true });
      }
    },
    onError: () => handleError(new Error('Image element error')),
    get style() {
      const current = state();
      return {
        opacity: current.isLoaded ? 1 : 0.7,
        transition: 'opacity var(--xeg-duration-normal) var(--xeg-ease-standard)',
        transform:
          current.loadedSrc && current.loadedSrc === lowQualitySrc ? 'scale(0.98)' : 'scale(1)',
      };
    },
  } as const;

  return {
    state,
    retry,
    reset,
    imageProps,
  };
}
