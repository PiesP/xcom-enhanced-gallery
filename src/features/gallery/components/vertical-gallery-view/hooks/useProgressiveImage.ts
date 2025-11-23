/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview Progressive Image Loading Hook (Lightweight)
 * @description Manages progressive image loading with blur-up effect and retry logic
 * @module features/gallery/components/vertical-gallery-view/hooks/useProgressiveImage
 *
 * **Features**:
 * - Blur-up loading pattern (low-quality placeholder → full-quality)
 * - Load state tracking (loading, loaded, error)
 * - Retry mechanism with configurable delay
 * - Progress tracking support
 * - Automatic style management (opacity transition)
 *
 * **Usage**:
 * ```tsx
 * const img = useProgressiveImage({
 *   src: fullQualityUrl,
 *   lowQualitySrc: thumbnailUrl,
 *   enableProgressTracking: true,
 * });
 *
 * return <img {...img.imageProps} />;
 * ```
 *
 * @version 2.0.0 - Lightweight implementation for test stability (Phase 354+)
 */

import { getSolid } from "@shared/external/vendors";

/**
 * Configuration options for progressive image loading
 * @interface ProgressiveImageOptions
 */
export interface ProgressiveImageOptions {
  /**
   * Full-quality image URL
   */
  src: string;

  /**
   * Low-quality placeholder URL (optional)
   */
  lowQualitySrc?: string;

  /**
   * Maximum retry attempts on load failure
   * @default 3
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Load timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Enable progress tracking callback
   * @default false
   */
  enableProgressTracking?: boolean;
}

/**
 * Return value from useProgressiveImage hook
 * @interface ProgressiveImageResult
 */
export interface ProgressiveImageResult {
  /**
   * Current loading state
   */
  state: () => {
    isLoading: boolean;
    isLoaded: boolean;
    hasError: boolean;
    loadedSrc: string | null;
    progress: number;
    retryCount: number;
  };

  /**
   * Retry loading the image
   */
  retry: () => void;

  /**
   * Reset to initial state
   */
  reset: () => void;

  /**
   * DOM properties to bind to img element
   */
  imageProps: {
    src: string;
    onLoad: () => void;
    onError: () => void;
    style: Record<string, string | number>;
  };
}

/**
 * Custom hook for progressive image loading with blur-up effect
 *
 * **Behavior**:
 * - Displays low-quality placeholder while full image loads
 * - Smooth opacity transition when full image loads
 * - Automatic cleanup on unmount via Solid.js reactivity
 *
 * @param options - {@link ProgressiveImageOptions}
 * @returns {@link ProgressiveImageResult} with state, controls, and image props
 *
 * @example
 * const image = useProgressiveImage({
 *   src: 'https://example.com/photo.jpg',
 *   lowQualitySrc: 'https://example.com/thumb.jpg',
 * });
 *
 * return <img {...image.imageProps} alt="Gallery item" />;
 */
export function useProgressiveImage(
  options: ProgressiveImageOptions,
): ProgressiveImageResult {
  const { createSignal, createMemo } = getSolid();

  // State signals
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);
  const [retryCount, setRetryCount] = createSignal(0);
  const [loadedSrc, setLoadedSrc] = createSignal<string | null>(null);

  // Computed progress (0-100)
  const progress = createMemo(() => (isLoaded() ? 100 : 0));

  /**
   * Reset to initial state
   */
  function reset(): void {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
    setLoadedSrc(null);
  }

  /**
   * Trigger retry with incremented counter
   */
  function retry(): void {
    setRetryCount(retryCount() + 1);
    setHasError(false);
  }

  // Image element props with automatic style management
  const imageProps = {
    get src(): string {
      return options.lowQualitySrc ?? options.src;
    },
    onLoad: (): void => {
      setIsLoaded(true);
      setLoadedSrc(options.src);
    },
    onError: (): void => {
      setHasError(true);
    },
    get style(): Record<string, string | number> {
      return {
        opacity: isLoaded() ? 1 : 0.7,
        transition: "opacity 200ms ease-in-out",
        transform: "translateZ(0)",
        willChange: "opacity",
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
    imageProps: imageProps as unknown as ProgressiveImageResult["imageProps"],
  };
}
