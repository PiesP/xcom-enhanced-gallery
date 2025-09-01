/**
 * @fileoverview 갤러리 CSS 조건부 적용 훅
 * @description Phase 9.3 REFACTOR - 조건부 CSS 클래스 적용 로직 분리 및 최적화
 * @version 1.0.0
 */

import { getPreactHooks } from '@shared/external/vendors';

const { useMemo: preactUseMemo } = getPreactHooks();

/**
 * 갤러리 컨테이너 클래스 이름 생성 훅
 *
 * @param baseStyles - 기본 스타일 객체 (styles.*)
 * @param enhancedStyles - 강화된 스타일 객체 (enhancedStyles.*)
 * @param isSmallImage - 작은 이미지 여부
 * @param additionalClasses - 추가 조건부 클래스들
 * @returns 조합된 클래스 이름 문자열
 */
export function useGalleryClassNames(
  baseStyles: Record<string, string>,
  enhancedStyles?: Record<string, string>,
  isSmallImage?: boolean,
  additionalClasses?: (string | undefined | null | false)[]
): string {
  return preactUseMemo(() => {
    const classNames: (string | undefined | null | false)[] = [
      baseStyles.container,
      // Phase 9.2: 작은 이미지일 때 smallImageMode 클래스 적용
      isSmallImage && enhancedStyles?.smallImageMode,
      // 추가 조건부 클래스들
      ...(additionalClasses || []),
    ];

    return classNames.filter(Boolean).join(' ');
  }, [baseStyles, enhancedStyles, isSmallImage, additionalClasses]);
}

/**
 * 최적화된 스타일 의존성 검증 훅
 *
 * @param styleObjects - 체크할 스타일 객체들
 * @returns 스타일 로딩 완료 여부
 */
export function useStylesReady(...styleObjects: (Record<string, string> | undefined)[]): boolean {
  return preactUseMemo(() => {
    return styleObjects.every(
      styles => styles && typeof styles === 'object' && Object.keys(styles).length > 0
    );
  }, [styleObjects]);
}

/**
 * 이미지 크기 기반 클래스 조건 생성기
 *
 * @param imageSize - 이미지 크기 { width, height }
 * @param viewportSize - 뷰포트 크기 { width, height }
 * @returns 크기 기반 조건부 클래스 정보
 */
export function useImageSizeClassConditions(
  imageSize: { width: number; height: number } | null,
  viewportSize: { width: number; height: number } | null
) {
  return preactUseMemo(() => {
    if (!imageSize || !viewportSize) {
      return {
        isSmallImage: false,
        isWideImage: false,
        isTallImage: false,
        aspectRatio: 1,
      };
    }

    const isSmallImage =
      imageSize.height < viewportSize.height && imageSize.width < viewportSize.width;
    const isWideImage = imageSize.width > imageSize.height;
    const isTallImage = imageSize.height > imageSize.width;
    const aspectRatio = imageSize.width / imageSize.height;

    return {
      isSmallImage,
      isWideImage,
      isTallImage,
      aspectRatio,
    };
  }, [imageSize, viewportSize]);
}
