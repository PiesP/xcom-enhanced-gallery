/**
 * Lightweight progressive image hook for tests
 * Provides stable API used by tests without bringing full impl back.
 */
import { getSolid } from '@shared/external/vendors';

export interface ProgressiveImageOptions {
  src: string;
  lowQualitySrc?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  enableProgressTracking?: boolean;
}

export interface ProgressiveImageResult {
  state: () => {
    isLoading: boolean;
    isLoaded: boolean;
    hasError: boolean;
    loadedSrc: string | null;
    progress: number;
    retryCount: number;
  };
  retry: () => void;
  reset: () => void;
  imageProps: {
    src: string;
    onLoad: () => void;
    onError: () => void;
    style: Record<string, string | number>;
  };
}

export function useProgressiveImage(options: ProgressiveImageOptions): ProgressiveImageResult {
  const { createSignal, createMemo } = getSolid();
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);
  const [retryCount, setRetryCount] = createSignal(0);
  const [loadedSrc, setLoadedSrc] = createSignal<string | null>(null);

  const progress = createMemo(() => (isLoaded() ? 1 : 0) * 100);

  function reset() {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
    setLoadedSrc(null);
  }

  function retry() {
    setRetryCount(retryCount() + 1);
    setHasError(false);
  }

  const imageProps = {
    get src() {
      return options.lowQualitySrc ?? options.src;
    },
    onLoad: () => {
      setIsLoaded(true);
      setLoadedSrc(options.src);
    },
    onError: () => {
      setHasError(true);
    },
    get style() {
      return {
        opacity: isLoaded() ? 1 : 0.7,
        transition: 'opacity 200ms ease',
        transform: 'translateZ(0)',
      } as const;
    },
  } as const;

  return {
    state: () => ({
      isLoading: false,
      isLoaded: isLoaded(),
      hasError: hasError(),
      loadedSrc: loadedSrc(),
      progress: progress(),
      retryCount: retryCount(),
    }),
    retry,
    reset,
    imageProps: imageProps as unknown as ProgressiveImageResult['imageProps'],
  };
}

export default useProgressiveImage;
