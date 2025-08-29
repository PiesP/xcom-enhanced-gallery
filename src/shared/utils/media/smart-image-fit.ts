/**
 * Smart Image Fit 유틸리티
 * 요구사항에 따른 스마트한 이미지 크기 조절 로직
 */

export interface SmartImageFitResult {
  width: number;
  height: number;
  shouldApply: boolean;
  mode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';
}

export interface ImageDimensions {
  naturalWidth: number;
  naturalHeight: number;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * 스마트 이미지 핏 계산 함수
 * 요구사항에 따라 이미지 크기를 조절합니다.
 */
export function calculateSmartImageFit(
  imageDimensions: ImageDimensions,
  viewportDimensions: ViewportDimensions | undefined,
  mode: 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer'
): SmartImageFitResult {
  const { naturalWidth, naturalHeight } = imageDimensions;

  // 뷰포트 크기가 정의되지 않은 경우 처리
  if (!viewportDimensions) {
    return {
      width: naturalWidth,
      height: naturalHeight,
      shouldApply: false,
      mode,
    };
  }

  const { width: viewportWidth, height: viewportHeight } = viewportDimensions;

  // 엣지 케이스 처리
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return {
      width: 0,
      height: 0,
      shouldApply: false,
      mode,
    };
  }

  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return {
      width: naturalWidth,
      height: naturalHeight,
      shouldApply: false,
      mode,
    };
  }

  switch (mode) {
    case 'original':
      return {
        width: naturalWidth,
        height: naturalHeight,
        shouldApply: true,
        mode,
      };

    case 'fitWidth': {
      // 이미지 가로가 뷰포트보다 클 때만 가로에 맞춤
      if (naturalWidth > viewportWidth) {
        const ratio = viewportWidth / naturalWidth;
        const scaledHeight = naturalHeight * ratio;
        return {
          width: viewportWidth,
          height: scaledHeight,
          shouldApply: true,
          mode,
        };
      }
      // 그렇지 않으면 원본 크기 유지
      return {
        width: naturalWidth,
        height: naturalHeight,
        shouldApply: true,
        mode,
      };
    }

    case 'fitHeight': {
      // 이미지 세로가 뷰포트보다 클 때만 세로에 맞춤
      if (naturalHeight > viewportHeight) {
        const ratio = viewportHeight / naturalHeight;
        const scaledWidth = naturalWidth * ratio;
        return {
          width: scaledWidth,
          height: viewportHeight,
          shouldApply: true,
          mode,
        };
      }
      // 그렇지 않으면 원본 크기 유지
      return {
        width: naturalWidth,
        height: naturalHeight,
        shouldApply: true,
        mode,
      };
    }

    case 'fitContainer': {
      const widthExceedsViewport = naturalWidth > viewportWidth;
      const heightExceedsViewport = naturalHeight > viewportHeight;

      // 가로와 세로 모두 뷰포트보다 작으면 원본 크기 유지
      if (!widthExceedsViewport && !heightExceedsViewport) {
        return {
          width: naturalWidth,
          height: naturalHeight,
          shouldApply: true,
          mode,
        };
      }

      // 가로만 초과하는 경우
      if (widthExceedsViewport && !heightExceedsViewport) {
        const ratio = viewportWidth / naturalWidth;
        const scaledHeight = naturalHeight * ratio;
        return {
          width: viewportWidth,
          height: scaledHeight,
          shouldApply: true,
          mode,
        };
      }

      // 세로만 초과하는 경우
      if (!widthExceedsViewport && heightExceedsViewport) {
        const ratio = viewportHeight / naturalHeight;
        const scaledWidth = naturalWidth * ratio;
        return {
          width: scaledWidth,
          height: viewportHeight,
          shouldApply: true,
          mode,
        };
      }

      // 가로와 세로 모두 초과하는 경우 - 더 작게 하는 쪽 선택
      const widthRatio = viewportWidth / naturalWidth;
      const heightRatio = viewportHeight / naturalHeight;

      if (widthRatio <= heightRatio) {
        // 가로 기준이 더 제한적
        const scaledHeight = naturalHeight * widthRatio;
        return {
          width: viewportWidth,
          height: scaledHeight,
          shouldApply: true,
          mode,
        };
      } else {
        // 세로 기준이 더 제한적
        const scaledWidth = naturalWidth * heightRatio;
        return {
          width: scaledWidth,
          height: viewportHeight,
          shouldApply: true,
          mode,
        };
      }
    }

    default:
      return {
        width: naturalWidth,
        height: naturalHeight,
        shouldApply: false,
        mode,
      };
  }
}
