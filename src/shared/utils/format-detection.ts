/**
 * @fileoverview 이미지 포맷 지원 감지 유틸리티
 * @description WebP/AVIF 등 최신 이미지 포맷 지원 여부를 감지
 */

import { logger } from '@shared/logging/logger';

/**
 * 지원되는 이미지 포맷 타입
 */
export type SupportedImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

/**
 * 포맷 감지 결과 캐시
 */
export const formatSupportCache = new Map<SupportedImageFormat, boolean>();

/**
 * Canvas를 사용한 포맷 지원 감지
 */
export function detectFormatWithCanvas(format: SupportedImageFormat): Promise<boolean> {
  return new Promise(resolve => {
    try {
      // 기본 포맷은 Canvas 테스트 없이 바로 true 반환
      if (format === 'jpeg' || format === 'png') {
        resolve(true);
        return;
      }

      // 테스트 환경에서 document가 없을 수 있음
      if (typeof document === 'undefined') {
        logger.warn('[FormatDetection] Document not available, using fallback');
        resolve(getUserAgentBasedSupport(format));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(false);
        return;
      }

      // 1x1 픽셀 이미지 생성
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1, 1);

      // 지정된 포맷으로 변환 시도
      const mimeType = `image/${format}`;
      const dataUrl = canvas.toDataURL(mimeType);

      // 변환이 성공했는지 확인 (실제 포맷으로 변환되었는지)
      const isSupported = dataUrl.startsWith(`data:${mimeType}`);
      resolve(isSupported);
    } catch (error) {
      logger.warn(`[FormatDetection] Canvas detection failed for ${format}:`, error);
      resolve(getUserAgentBasedSupport(format));
    }
  });
}

/**
 * UserAgent 기반 포맷 지원 감지 (폴백)
 */
export function getUserAgentBasedSupport(format: SupportedImageFormat): boolean {
  if (typeof navigator === 'undefined') {
    // 기본 지원 포맷만 true
    return format === 'jpeg' || format === 'png';
  }

  const userAgent = navigator.userAgent;

  switch (format) {
    case 'jpeg':
    case 'png':
      return true; // 기본적으로 모든 브라우저가 지원

    case 'webp':
      // Chrome 23+, Firefox 65+, Safari 14+, Edge 18+
      return (
        /Chrome/.test(userAgent) ||
        /Firefox/.test(userAgent) ||
        /Safari/.test(userAgent) ||
        /Edge/.test(userAgent) ||
        /EdgA\//.test(userAgent) // Android Edge
      );

    case 'avif':
      // Chrome 85+, Firefox 93+, 일부 최신 브라우저
      return (
        /Chrome/.test(userAgent) || /Firefox/.test(userAgent) || /Safari/.test(userAgent) // Safari 16+
      );

    default:
      return false;
  }
}

/**
 * 이미지 포맷 지원 여부 확인
 * @param format 확인할 이미지 포맷
 * @returns 지원 여부
 */
export async function acceptsImageFormat(format: SupportedImageFormat): Promise<boolean> {
  // 캐시에서 먼저 확인
  if (formatSupportCache.has(format)) {
    return formatSupportCache.get(format)!;
  }

  let isSupported: boolean;

  // 기본 포맷은 항상 지원
  if (format === 'jpeg' || format === 'png') {
    isSupported = true;
  } else {
    // Canvas 기반 감지 시도, 실패 시 UserAgent 기반 fallback
    try {
      isSupported = await detectFormatWithCanvas(format);
    } catch (error) {
      logger.warn(`[FormatDetection] Canvas detection error for ${format}:`, error);
      isSupported = getUserAgentBasedSupport(format);
    }
  }

  // 결과 캐시
  formatSupportCache.set(format, isSupported);

  logger.debug(`[FormatDetection] ${format} support:`, isSupported);
  return isSupported;
}

/**
 * 포맷 지원 캐시 초기화 (테스트용)
 */
export function clearFormatSupportCache(): void {
  formatSupportCache.clear();
}

/**
 * 현재 캐시된 포맷 지원 정보 조회 (디버그용)
 */
export function getFormatSupportCache(): Map<SupportedImageFormat, boolean> {
  return new Map(formatSupportCache);
}
