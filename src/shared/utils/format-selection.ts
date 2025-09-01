/**
 * @file format-selection.ts
 * @description 이미지 URL 변환 및 최적 포맷 선택 유틸리티
 * TDD Phase 5: 이미지 포맷 최적화 및 WebP/AVIF 지원
 */

import { acceptsImageFormat, type SupportedImageFormat } from './format-detection';
import { logger } from '@shared/logging/logger';

/**
 * 이미지 URL 변환 옵션
 */
export interface ImageTransformOptions {
  /** 우선 포맷 (가능한 경우) */
  preferredFormat?: SupportedImageFormat;
  /** 원본 포맷으로 폴백 허용 여부 */
  allowFallback?: boolean;
  /** 포맷 변환 건너뛰기 */
  skipFormatTransform?: boolean;
}

/**
 * URL 변환 결과
 */
export interface UrlTransformResult {
  /** 변환된 URL */
  transformedUrl: string;
  /** 적용된 포맷 */
  appliedFormat: SupportedImageFormat;
  /** 원본에서 변경됨 여부 */
  wasTransformed: boolean;
  /** 변환 실패 이유 (있는 경우) */
  fallbackReason?: string;
}

/**
 * X.com 이미지 URL에서 포맷 추출
 */
function extractFormatFromTwitterUrl(url: string): SupportedImageFormat | null {
  try {
    const urlObj = new URL(url);

    // format 파라미터 확인
    const formatParam = urlObj.searchParams.get('format');
    if (formatParam && ['webp', 'png', 'jpeg', 'jpg'].includes(formatParam)) {
      return formatParam === 'jpg' ? 'jpeg' : (formatParam as SupportedImageFormat);
    }

    // 파일 확장자에서 추출
    const pathname = urlObj.pathname;
    const match = pathname.match(/\.(webp|avif|png|jpe?g)$/i);
    if (match) {
      const ext = match[1].toLowerCase();
      return ext === 'jpg' ? 'jpeg' : (ext as SupportedImageFormat);
    }

    return null;
  } catch (error) {
    logger.warn('URL 파싱 실패:', { url, error });
    return null;
  }
}

/**
 * 지원되는 최적 포맷 결정
 */
async function determineBestFormat(
  options: ImageTransformOptions = {}
): Promise<SupportedImageFormat> {
  const { preferredFormat } = options;

  // 명시적 선호 포맷이 지원되는지 확인
  if (preferredFormat && (await acceptsImageFormat(preferredFormat))) {
    return preferredFormat;
  }

  // 브라우저 지원 순서대로 확인
  const formatPriority: SupportedImageFormat[] = ['avif', 'webp', 'jpeg', 'png'];

  for (const format of formatPriority) {
    if (await acceptsImageFormat(format)) {
      return format;
    }
  }

  // 기본 폴백
  return 'jpeg';
}

/**
 * X.com 이미지 URL을 최적 포맷으로 변환
 */
export async function transformImageUrl(
  originalUrl: string,
  options: ImageTransformOptions = {}
): Promise<UrlTransformResult> {
  const { allowFallback = true, skipFormatTransform = false } = options;

  try {
    // 포맷 변환을 건너뛰는 경우
    if (skipFormatTransform) {
      const currentFormat = extractFormatFromTwitterUrl(originalUrl) || 'jpeg';
      return {
        transformedUrl: originalUrl,
        appliedFormat: currentFormat,
        wasTransformed: false,
        fallbackReason: 'Format transform skipped',
      };
    }

    const urlObj = new URL(originalUrl);

    // X.com 이미지 URL인지 확인
    if (!urlObj.hostname.includes('twimg.com') && !urlObj.hostname.includes('x.com')) {
      logger.warn('X.com 이미지 URL이 아님:', originalUrl);

      if (allowFallback) {
        const currentFormat = extractFormatFromTwitterUrl(originalUrl) || 'jpeg';
        return {
          transformedUrl: originalUrl,
          appliedFormat: currentFormat,
          wasTransformed: false,
          fallbackReason: 'Not a Twitter/X.com image URL',
        };
      }

      throw new Error('Unsupported URL format');
    }

    // 최적 포맷 결정
    const bestFormat = await determineBestFormat(options);
    const currentFormat = extractFormatFromTwitterUrl(originalUrl);

    // 이미 최적 포맷인 경우
    if (currentFormat === bestFormat) {
      return {
        transformedUrl: originalUrl,
        appliedFormat: bestFormat,
        wasTransformed: false,
      };
    }

    // URL 파라미터 업데이트
    urlObj.searchParams.set('format', bestFormat);

    // 추가적인 품질 최적화 (AVIF/WebP의 경우)
    if (['avif', 'webp'].includes(bestFormat)) {
      // 품질을 약간 낮춰서 파일 크기 최적화
      if (!urlObj.searchParams.has('name')) {
        urlObj.searchParams.set('name', 'large');
      }
    }

    const transformedUrl = urlObj.toString();

    return {
      transformedUrl,
      appliedFormat: bestFormat,
      wasTransformed: transformedUrl !== originalUrl,
    };
  } catch (error) {
    logger.error('URL 변환 실패:', { originalUrl, options, error });

    if (allowFallback) {
      const currentFormat = extractFormatFromTwitterUrl(originalUrl) || 'jpeg';
      return {
        transformedUrl: originalUrl,
        appliedFormat: currentFormat,
        wasTransformed: false,
        fallbackReason: `Transform failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    throw error;
  }
}

/**
 * 여러 이미지 URL을 배치로 변환
 */
export async function transformImageUrls(
  urls: string[],
  options: ImageTransformOptions = {}
): Promise<UrlTransformResult[]> {
  try {
    // 모든 URL을 병렬로 변환
    const transformPromises = urls.map(url => transformImageUrl(url, options));
    const results = await Promise.all(transformPromises);

    // 통계 로깅
    const transformedCount = results.filter(r => r.wasTransformed).length;
    const formatDistribution = results.reduce(
      (acc, r) => {
        acc[r.appliedFormat] = (acc[r.appliedFormat] || 0) + 1;
        return acc;
      },
      {} as Record<SupportedImageFormat, number>
    );

    logger.info('배치 URL 변환 완료:', {
      total: urls.length,
      transformed: transformedCount,
      formatDistribution,
    });

    return results;
  } catch (error) {
    logger.error('배치 URL 변환 실패:', { urlCount: urls.length, error });
    throw error;
  }
}

/**
 * 포맷 지원 상태 요약 조회
 */
export async function getFormatSupportSummary(): Promise<{
  supported: SupportedImageFormat[];
  optimal: SupportedImageFormat;
  bandwidth_reduction_estimate: number;
}> {
  const formats: SupportedImageFormat[] = ['avif', 'webp', 'jpeg', 'png'];
  const supported: SupportedImageFormat[] = [];

  for (const format of formats) {
    if (await acceptsImageFormat(format)) {
      supported.push(format);
    }
  }

  const optimal = await determineBestFormat();

  // 대역폭 절약 추정치 계산
  let bandwidth_reduction_estimate = 0;
  if (supported.includes('avif')) {
    bandwidth_reduction_estimate = 50; // AVIF: ~50% 절약
  } else if (supported.includes('webp')) {
    bandwidth_reduction_estimate = 25; // WebP: ~25% 절약
  }

  return {
    supported,
    optimal,
    bandwidth_reduction_estimate,
  };
}
