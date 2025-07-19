/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Progressive Image Loading Hook
 * @description 이미지의 점진적 로딩과 품질 향상을 제공하는 훅
 */

import { logger } from '@core/logging/logger';
import { getPreactHooks } from '@infrastructure/external/vendors';

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
  state: ProgressiveImageState;
  retry: () => void;
  reset: () => void;
  imageProps: {
    src: string;
    onLoad: () => void;
    onError: () => void;
    style: Record<string, string | number>;
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
  const { useState, useEffect, useCallback, useRef } = getPreactHooks();
  const [state, setState] = useState<ProgressiveImageState>({
    isLoading: false,
    isLoaded: false,
    hasError: false,
    loadedSrc: null,
    progress: 0,
    retryCount: 0,
  });

  const timeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updates: Partial<ProgressiveImageState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 타이머 정리
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // 이미지 로딩 함수
  const loadImage = useCallback(
    (imageSrc: string, isRetry = false) => {
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
      imageRef.current = img;

      // 진행률 추적 (Fetch API 사용)
      if (enableProgressTracking) {
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

              const readChunk = () => {
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
      }

      // 타임아웃 설정
      timeoutRef.current = window.setTimeout(() => {
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
    },
    [enableProgressTracking, timeout, clearTimers, updateState]
  );

  // 에러 처리
  const handleError = useCallback(
    (error: Error) => {
      logger.warn('Image load error:', { error: error.message, src, retryCount: state.retryCount });

      if (state.retryCount < maxRetries) {
        const delay = retryDelay * Math.pow(2, state.retryCount); // 지수 백오프

        updateState({
          retryCount: state.retryCount + 1,
        });

        retryTimeoutRef.current = window.setTimeout(() => {
          logger.info('Retrying image load:', { src, att: state.retryCount + 1 });
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
    },
    [src, state.retryCount, maxRetries, retryDelay, loadImage, updateState]
  );

  // 수동 재시도
  const retry = useCallback(() => {
    if (state.retryCount < maxRetries) {
      logger.info('Manual retry triggered:', src);
      updateState({ retryCount: 0 });
      loadImage(src);
    }
  }, [src, state.retryCount, maxRetries, loadImage, updateState]);

  // 상태 리셋
  const reset = useCallback(() => {
    clearTimers();
    updateState({
      isLoading: false,
      isLoaded: false,
      hasError: false,
      loadedSrc: null,
      progress: 0,
      retryCount: 0,
    });
  }, [clearTimers, updateState]);

  // 이미지 소스 변경 시 로딩 시작
  useEffect(() => {
    if (src) {
      // 저품질 이미지가 있으면 먼저 로드
      if (lowQualitySrc && !state.isLoaded) {
        loadImage(lowQualitySrc);
        // 고품질 이미지는 잠시 후 로드
        setTimeout(() => loadImage(src), 100);
      } else {
        loadImage(src);
      }
    }

    return () => {
      clearTimers();
    };
  }, [src, lowQualitySrc]); // state.isLoaded 의존성 제거로 무한 루프 방지

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearTimers();
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
  }, [clearTimers]);

  // 이미지 엘리먼트 속성
  const imageProps = {
    src: state.loadedSrc ?? lowQualitySrc ?? src,
    onLoad: () => {
      if (state.loadedSrc === src) {
        // 고품질 이미지 로딩 완료
        updateState({ isLoading: false, isLoaded: true });
      }
    },
    onError: () => handleError(new Error('Image element error')),
    style: {
      opacity: state.isLoaded ? 1 : 0.7,
      transition: 'opacity 0.3s ease',
      filter: state.loadedSrc === lowQualitySrc ? 'blur(2px)' : 'none',
    },
  };

  return {
    state,
    retry,
    reset,
    imageProps,
  };
}
