/**
 * @fileoverview 미디어 정보 빌더 유틸리티
 * @version 1.0.0 - TDD GREEN Phase
 *
 * 중복된 MediaInfo 생성 로직을 통합한 공통 유틸리티
 */

import type { MediaInfo, TweetInfo } from '@shared/types/media.types';
import { MediaValidationUtils } from './MediaValidationUtils';

/**
 * 미디어 정보 생성 옵션
 */
export interface MediaInfoBuilderOptions {
  /** 썸네일 URL */
  thumbnailUrl?: string;
  /** 대체 텍스트 */
  alt?: string;
  /** 추출 소스 정보 */
  fallbackSource?: string;
  /** 추가 메타데이터 */
  additionalMetadata?: Record<string, unknown>;
  /** 요소의 크기 정보 */
  dimensions?: {
    width?: number;
    height?: number;
  };
}

/**
 * 미디어 정보 빌더 유틸리티
 *
 * FallbackStrategy의 여러 추출 메서드에서 중복된 MediaInfo 생성 로직을 통합
 */
export class MediaInfoBuilder {
  /**
   * MediaInfo 객체 생성
   *
   * @param id - 미디어 고유 ID
   * @param url - 미디어 URL
   * @param type - 미디어 타입 (자동 감지 가능)
   * @param tweetInfo - 트윗 정보
   * @param options - 추가 옵션
   * @returns 생성된 MediaInfo 객체
   */
  static createMediaInfo(
    id: string,
    url: string,
    type?: 'image' | 'video',
    tweetInfo?: TweetInfo,
    options: MediaInfoBuilderOptions = {}
  ): MediaInfo {
    const normalizedUrl = MediaValidationUtils.normalizeMediaUrl(url);
    const detectedType = type || MediaValidationUtils.detectMediaType(normalizedUrl);
    const filename = options.alt
      ? `${options.alt.replace(/[^a-zA-Z0-9]/g, '_')}_${id}`
      : MediaValidationUtils.extractFilename(normalizedUrl) || `media_${id}`;

    const mediaInfo: MediaInfo = {
      id,
      type: detectedType,
      url: normalizedUrl,
      originalUrl: url,
      filename,
      width: options.dimensions?.width || 0,
      height: options.dimensions?.height || 0,
      metadata: {
        source: options.fallbackSource || 'unknown',
        extractedAt: Date.now(),
        ...(tweetInfo && { tweetId: tweetInfo.tweetId }),
        ...(options.thumbnailUrl && { thumbnailUrl: options.thumbnailUrl }),
        ...(options.alt && { alt: options.alt }),
        ...options.additionalMetadata,
      },
    };

    return mediaInfo;
  }

  /**
   * 여러 미디어 정보를 배치 생성
   */
  static createMultipleMediaInfo(
    mediaData: Array<{
      id: string;
      url: string;
      type?: 'image' | 'video';
      options?: MediaInfoBuilderOptions;
    }>,
    tweetInfo?: TweetInfo
  ): MediaInfo[] {
    return mediaData.map(data =>
      this.createMediaInfo(data.id, data.url, data.type, tweetInfo, data.options)
    );
  }

  /**
   * HTML 요소로부터 미디어 정보 생성
   */
  static createFromElement(
    element: HTMLElement,
    id: string,
    url: string,
    tweetInfo?: TweetInfo,
    options: MediaInfoBuilderOptions = {}
  ): MediaInfo {
    // 요소에서 크기 정보 추출
    const dimensions = this.extractDimensionsFromElement(element);

    // 요소에서 alt 텍스트 추출
    const alt = this.extractAltFromElement(element);

    const mergedOptions: MediaInfoBuilderOptions = {
      ...options,
      dimensions: options.dimensions || dimensions,
      alt: options.alt || alt,
    };

    return this.createMediaInfo(id, url, undefined, tweetInfo, mergedOptions);
  }

  /**
   * HTML 요소에서 크기 정보 추출
   */
  private static extractDimensionsFromElement(element: HTMLElement): {
    width: number;
    height: number;
  } {
    const width = this.getElementDimension(element, 'width');
    const height = this.getElementDimension(element, 'height');

    return { width, height };
  }

  /**
   * HTML 요소에서 대체 텍스트 추출
   */
  private static extractAltFromElement(element: HTMLElement): string {
    if (element.tagName === 'IMG') {
      return element.getAttribute('alt') || '';
    }

    if (element.tagName === 'VIDEO') {
      return element.getAttribute('title') || element.getAttribute('aria-label') || '';
    }

    return '';
  }

  /**
   * 요소의 특정 차원 값 추출
   */
  private static getElementDimension(element: HTMLElement, dimension: 'width' | 'height'): number {
    // 속성에서 직접 추출
    const attr = element.getAttribute(dimension);
    if (attr) {
      const num = parseInt(attr, 10);
      if (!isNaN(num)) return num;
    }

    // 계산된 스타일에서 추출
    const computedStyle = window.getComputedStyle(element);
    const value = computedStyle[dimension];
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  }
}
