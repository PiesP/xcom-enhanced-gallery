/**
 * Smart Image Fit Hook
 * 실제 DOM 요소와 뷰포트 크기를 기반으로 한 스마트 이미지 핏 로직
 */

import { useMemo, useCallback } from 'preact/hooks';
import type { ImageFitMode } from '@shared/types/app.types';
import { getViewportSize } from '@shared/browser/utils/browser-utils';
import { calculateSmartImageFit } from '@shared/utils/media/smart-image-fit';
import { throttleScroll } from '@shared/utils';

export interface UseSmartImageFitOptions {
  /** 미디어 요소 (이미지 또는 비디오) */
  imageElement: HTMLImageElement | HTMLVideoElement | null;
  /** 현재 핏 모드 */
  fitMode: ImageFitMode;
  /** 뷰포트 크기 변경 감지 여부 (기본: true) */
  watchViewportResize?: boolean;
}

export interface UseSmartImageFitResult {
  /** 계산된 이미지 스타일 */
  imageStyle: Record<string, string | number | undefined>;
  /** 핏이 적용되었는지 여부 */
  isApplied: boolean;
  /** 계산된 크기 */
  calculatedSize: {
    width: number;
    height: number;
  };
}

/**
 * 스마트 이미지 핏 훅
 * 이미지 크기와 뷰포트 크기를 비교하여 조건부로 크기를 조정합니다.
 */
export function useSmartImageFit({
  imageElement,
  fitMode,
  watchViewportResize = true,
}: UseSmartImageFitOptions): UseSmartImageFitResult {
  // 뷰포트 크기 감지 (throttled)
  const viewportSize = useMemo(() => {
    if (!watchViewportResize) {
      const size = getViewportSize();
      // 테스트 환경에서 기본값 제공
      if (size.width === 0 || size.height === 0) {
        return { width: 1920, height: 1080 }; // 기본 해상도
      }
      return size;
    }

    // 리사이즈 이벤트는 실제 구현에서 처리됨 (여기서는 현재 크기만 반환)
    const size = getViewportSize();
    // 테스트 환경에서 기본값 제공
    if (size.width === 0 || size.height === 0) {
      return { width: 1920, height: 1080 }; // 기본 해상도
    }
    return size;
  }, [watchViewportResize]);

  // 이미지 크기 계산
  const calculatedFit = useMemo(() => {
    if (!imageElement) {
      return {
        width: 0,
        height: 0,
        shouldApply: false,
        mode: fitMode,
      };
    }

    // 이미지와 비디오 모두에서 자연 크기 추출
    let naturalWidth: number;
    let naturalHeight: number;

    if (imageElement instanceof HTMLImageElement) {
      naturalWidth = imageElement.naturalWidth;
      naturalHeight = imageElement.naturalHeight;
    } else if (imageElement instanceof HTMLVideoElement) {
      naturalWidth = imageElement.videoWidth;
      naturalHeight = imageElement.videoHeight;
    } else {
      return {
        width: 0,
        height: 0,
        shouldApply: false,
        mode: fitMode,
      };
    }

    if (!naturalWidth || !naturalHeight) {
      return {
        width: 0,
        height: 0,
        shouldApply: false,
        mode: fitMode,
      };
    }

    const imageDimensions = {
      naturalWidth,
      naturalHeight,
    };

    return calculateSmartImageFit(imageDimensions, viewportSize, fitMode);
  }, [imageElement, viewportSize, fitMode]);

  // CSS 스타일 생성
  const imageStyle = useMemo<Record<string, string | number | undefined>>(() => {
    if (!calculatedFit.shouldApply || calculatedFit.width === 0 || calculatedFit.height === 0) {
      return {};
    }

    // 원본 크기 추출 (이미지/비디오 공통)
    let maxWidth: number | undefined;
    let maxHeight: number | undefined;

    if (imageElement instanceof HTMLImageElement) {
      maxWidth = imageElement.naturalWidth;
      maxHeight = imageElement.naturalHeight;
    } else if (imageElement instanceof HTMLVideoElement) {
      maxWidth = imageElement.videoWidth;
      maxHeight = imageElement.videoHeight;
    }

    const baseStyle: Record<string, string | number | undefined> = {
      // 원본보다 커지지 않도록 보장
      maxWidth: maxWidth ? `${maxWidth}px` : undefined,
      maxHeight: maxHeight ? `${maxHeight}px` : undefined,
    };

    switch (fitMode) {
      case 'original':
        return {
          ...baseStyle,
          width: `${calculatedFit.width}px`,
          height: `${calculatedFit.height}px`,
          objectFit: 'none',
        };

      case 'fitWidth':
        if (calculatedFit.width === maxWidth) {
          // 원본 크기 유지
          return {
            ...baseStyle,
            width: `${calculatedFit.width}px`,
            height: `${calculatedFit.height}px`,
            objectFit: 'none',
          };
        }
        return {
          ...baseStyle,
          width: `${calculatedFit.width}px`,
          height: 'auto',
          objectFit: 'contain',
        };

      case 'fitHeight':
        if (calculatedFit.height === maxHeight) {
          // 원본 크기 유지
          return {
            ...baseStyle,
            width: `${calculatedFit.width}px`,
            height: `${calculatedFit.height}px`,
            objectFit: 'none',
          };
        }
        return {
          ...baseStyle,
          width: 'auto',
          height: `${calculatedFit.height}px`,
          objectFit: 'contain',
        };

      case 'fitContainer':
        if (calculatedFit.width === maxWidth && calculatedFit.height === maxHeight) {
          // 원본 크기 유지
          return {
            ...baseStyle,
            width: `${calculatedFit.width}px`,
            height: `${calculatedFit.height}px`,
            objectFit: 'none',
          };
        }
        return {
          ...baseStyle,
          width: `${calculatedFit.width}px`,
          height: `${calculatedFit.height}px`,
          objectFit: 'contain',
        };

      default:
        return baseStyle;
    }
  }, [calculatedFit, fitMode, imageElement]);

  return {
    imageStyle,
    isApplied: calculatedFit.shouldApply,
    calculatedSize: {
      width: calculatedFit.width,
      height: calculatedFit.height,
    },
  };
}

/**
 * 뷰포트 리사이즈 감지 훅
 * 성능 최적화를 위해 throttle된 리사이즈 이벤트를 제공합니다.
 */
export function useViewportResize(callback: () => void, _enabled = true) {
  const throttledCallback = useCallback(throttleScroll(callback), [callback]);

  // 실제 리사이즈 이벤트 리스너는 컴포넌트에서 구현
  // 여기서는 콜백 함수만 제공
  return throttledCallback;
}
