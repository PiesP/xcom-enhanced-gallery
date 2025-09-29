/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Progressive Image Loading Hook
 * @description 이미지의 점진적 로딩과 품질 향상을 제공하는 훅
 */

import type { Accessor } from 'solid-js';

import { getSolidCore, getSolidStore } from '@shared/external/vendors';
import { logger } from '@shared/logging/logger';

export interface ProgressiveImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  loadedSrc: string | null;
  progress: number;
  retryCount: number;
}

type MaybeAccessor<T> = T | Accessor<T>;

const resolve = <T>(value: MaybeAccessor<T>): T => {
  return typeof value === 'function' ? (value as Accessor<T>)() : value;
};

const resolveOptional = <T>(value: MaybeAccessor<T> | undefined): T | undefined => {
  if (typeof value === 'function') {
    return (value as Accessor<T>)();
  }
  return value;
};

const createInitialState = (): ProgressiveImageState => ({
  isLoading: false,
  isLoaded: false,
  hasError: false,
  loadedSrc: null,
  progress: 0,
  retryCount: 0,
});

export interface UseProgressiveImageOptions {
  src: MaybeAccessor<string>;
  lowQualitySrc?: MaybeAccessor<string | null | undefined>;
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
  const solid = getSolidCore();
  const store = getSolidStore();

  const { createMemo, createEffect, onCleanup, untrack } = solid;
  const { createStore, produce } = store;

  const [state, setState] = createStore(createInitialState());

  let timeoutId: number | undefined;
  let retryTimeoutId: number | undefined;
  let currentImage: HTMLImageElement | null = null;
  let disposed = false;
  let lastPrimarySrc = resolve(src);
  let lastPreviewSrc = resolveOptional(lowQualitySrc) ?? null;

  const clearTimers = () => {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (retryTimeoutId !== undefined) {
      window.clearTimeout(retryTimeoutId);
      retryTimeoutId = undefined;
    }
  };

  const disposeImage = () => {
    if (currentImage) {
      currentImage.onload = null;
      currentImage.onerror = null;
      currentImage = null;
    }
  };

  const safeUpdate = (updates: Partial<ProgressiveImageState>) => {
    if (disposed) {
      return;
    }
    setState(
      produce(draft => {
        Object.assign(draft, updates);
      })
    );
  };

  const resetState = () => {
    if (disposed) {
      return;
    }
    setState(() => createInitialState());
  };

  const handleError = (error: Error) => {
    if (disposed) {
      return;
    }

    const currentRetry = untrack(() => state.retryCount);
    logger.warn('Image load error:', {
      error: error.message,
      src: lastPrimarySrc,
      retryCount: currentRetry,
    });

    if (currentRetry < maxRetries) {
      const nextRetry = currentRetry + 1;
      const delay = retryDelay * Math.pow(2, currentRetry);

      safeUpdate({ retryCount: nextRetry, hasError: true });

      retryTimeoutId = window.setTimeout(() => {
        if (disposed) {
          return;
        }
        logger.info('Retrying image load:', { src: lastPrimarySrc, attempt: nextRetry });
        loadSequence(true);
      }, delay);
      return;
    }

    safeUpdate({
      isLoading: false,
      hasError: true,
      progress: 0,
    });
    logger.error('Image load failed after all retries:', lastPrimarySrc);
  };

  const loadImage = (
    imageSrc: string,
    options: { isRetry?: boolean; isPreview?: boolean; isCancelled: () => boolean }
  ) => {
    if (!imageSrc || options.isCancelled()) {
      return;
    }

    const img = new Image();
    currentImage = img;

    if (enableProgressTracking && !options.isPreview) {
      fetch(imageSrc)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const reader = response.body?.getReader();
          const contentLength = response.headers.get('Content-Length');

          if (!reader || !contentLength) {
            return;
          }

          const total = parseInt(contentLength, 10);
          let loaded = 0;

          const readChunk = (): void => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done || options.isCancelled()) {
                  return;
                }

                loaded += value?.length ?? 0;
                const progress = Math.round((loaded / total) * 100);
                safeUpdate({ progress });
                readChunk();
              })
              .catch(fetchError => {
                logger.debug('Progress tracking error:', fetchError);
              });
          };

          readChunk();
        })
        .catch(fetchError => {
          logger.debug('Progress fetch error:', fetchError);
        });
    }

    timeoutId = window.setTimeout(() => {
      if (options.isCancelled()) {
        return;
      }
      img.onload = null;
      img.onerror = null;
      handleError(new Error('Image load timeout'));
    }, timeout);

    img.onload = () => {
      if (options.isCancelled()) {
        return;
      }

      clearTimers();
      if (!options.isPreview) {
        safeUpdate({
          isLoading: false,
          isLoaded: true,
          hasError: false,
          loadedSrc: imageSrc,
          progress: 100,
        });
        logger.info('Image loaded successfully:', imageSrc);
      } else {
        safeUpdate({
          loadedSrc: imageSrc,
          progress: Math.max(
            untrack(() => state.progress),
            10
          ),
        });
      }
    };

    img.onerror = () => {
      if (options.isCancelled()) {
        return;
      }
      clearTimers();
      handleError(new Error('Image load failed'));
    };

    img.src = imageSrc;
  };

  const loadSequence = (isRetry: boolean) => {
    clearTimers();
    disposeImage();

    const primary = resolve(src);
    const preview = resolveOptional(lowQualitySrc) ?? null;
    lastPrimarySrc = primary;
    lastPreviewSrc = preview;

    if (!primary) {
      safeUpdate({
        isLoading: false,
        hasError: true,
        loadedSrc: null,
        progress: 0,
      });
      return;
    }

    safeUpdate({
      isLoading: true,
      isLoaded: false,
      hasError: false,
      progress: 0,
    });

    const cancelledRef = { cancelled: false };

    const cancel = () => {
      cancelledRef.cancelled = true;
      clearTimers();
      disposeImage();
    };

    const isCancelled = () => cancelledRef.cancelled || disposed;

    onCleanup(cancel);

    const startPrimary = () => {
      loadImage(primary, { isRetry, isCancelled });
    };

    if (preview && !isRetry && !untrack(() => state.isLoaded)) {
      loadImage(preview, { isPreview: true, isCancelled });
      window.setTimeout(startPrimary, 100);
    } else {
      startPrimary();
    }
  };

  const retry = () => {
    const canRetry = untrack(() => state.retryCount) < maxRetries;
    if (!canRetry) {
      return;
    }
    logger.info('Manual retry triggered:', lastPrimarySrc);
    safeUpdate({ retryCount: 0, hasError: false });
    loadSequence(false);
  };

  const reset = () => {
    clearTimers();
    disposeImage();
    resetState();
  };

  const sourceMemo = createMemo(() => ({
    primary: resolve(src),
    preview: resolveOptional(lowQualitySrc) ?? null,
  }));

  createEffect(() => {
    const { primary } = sourceMemo();
    if (!primary) {
      resetState();
      safeUpdate({ hasError: true });
      return;
    }
    loadSequence(false);
  });

  onCleanup(() => {
    disposed = true;
    clearTimers();
    disposeImage();
  });

  const imageProps = {
    get src() {
      return state.loadedSrc ?? lastPreviewSrc ?? lastPrimarySrc;
    },
    onLoad: () => {
      if (state.loadedSrc === lastPrimarySrc) {
        safeUpdate({ isLoading: false, isLoaded: true });
      }
    },
    onError: () => handleError(new Error('Image element error')),
    get style() {
      return {
        opacity: state.isLoaded ? 1 : 0.7,
        transition: 'opacity var(--xeg-duration-normal) var(--xeg-ease-standard)',
        transform: state.loadedSrc === lastPreviewSrc ? 'scale(0.98)' : 'scale(1)',
      } as Record<string, string | number>;
    },
  } satisfies UseProgressiveImageReturn['imageProps'];

  return {
    state,
    retry,
    reset,
    imageProps,
  };
}

/**
 * Legacy useProgressiveImage hook removed during Solid migration.
 */

export {};
