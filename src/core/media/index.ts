/**
 * @fileoverview 통합 미디어 관리자
 * @description 모든 미디어 관련 기능을 하나로 통합한 관리자
 * @version 2.0.0 - 구조 개선
 */

import { coreLogger as logger } from '../logger';

export type MediaType = 'image' | 'video' | 'gif';
export type MediaQuality = 'small' | 'medium' | 'large' | 'orig';

export interface MediaInfo {
  url: string;
  type: MediaType;
  quality: MediaQuality;
  filename?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface FilterOptions {
  minWidth?: number;
  minHeight?: number;
  allowedTypes?: MediaType[];
  excludePatterns?: string[];
}

/**
 * 통합 미디어 관리자
 * 모든 미디어 관련 작업을 중앙에서 관리
 */
export class CoreMediaManager {
  private static instance: CoreMediaManager;

  private constructor() {}

  static getInstance(): CoreMediaManager {
    if (!CoreMediaManager.instance) {
      CoreMediaManager.instance = new CoreMediaManager();
    }
    return CoreMediaManager.instance;
  }

  /**
   * 트윗에서 미디어 URL 추출
   */
  extractMediaUrls(element: HTMLElement): MediaInfo[] {
    const mediaInfos: MediaInfo[] = [];

    // 이미지 추출
    const images = element.querySelectorAll('img[src*="pbs.twimg.com"], img[src*="media.x.com"]');
    images.forEach(img => {
      const url = img.getAttribute('src');
      if (url && this.isValidMediaUrl(url)) {
        const imgElement = img as HTMLImageElement;
        const altText = img.getAttribute('alt');

        const mediaInfo: MediaInfo = {
          url: this.getHighQualityUrl(url),
          type: this.getMediaType(url),
          quality: 'orig',
        };

        if (altText) {
          mediaInfo.alt = altText;
        }

        if (imgElement.naturalWidth) {
          mediaInfo.width = imgElement.naturalWidth;
        }

        if (imgElement.naturalHeight) {
          mediaInfo.height = imgElement.naturalHeight;
        }

        mediaInfos.push(mediaInfo);
      }
    });

    // 비디오 추출
    const videos = element.querySelectorAll('video[src], video source[src]');
    videos.forEach(video => {
      const url = video.getAttribute('src');
      if (url && this.isValidMediaUrl(url)) {
        mediaInfos.push({
          url,
          type: 'video',
          quality: 'orig',
        });
      }
    });

    return this.removeDuplicates(mediaInfos);
  }

  /**
   * 고품질 미디어 URL로 변환
   */
  getHighQualityUrl(url: string): string {
    if (!url || typeof url !== 'string') return url;

    // Twitter/X 이미지 URL 품질 향상
    if (url.includes('pbs.twimg.com') || url.includes('media.x.com')) {
      let updatedUrl = url;

      // name 파라미터를 orig로 변경
      if (updatedUrl.includes('name=')) {
        updatedUrl = updatedUrl.replace(/name=\w+/g, 'name=orig');
      } else if (updatedUrl.includes('?')) {
        updatedUrl += '&name=orig';
      } else {
        updatedUrl += '?name=orig';
      }

      // format 파라미터 처리
      if (!updatedUrl.includes('format=')) {
        if (updatedUrl.includes('?')) {
          updatedUrl += '&format=jpg';
        } else {
          updatedUrl += '?format=jpg';
        }
      }

      // 크기 접미사 제거
      updatedUrl = updatedUrl.replace(/:small|:medium|:large/g, ':orig');

      return updatedUrl;
    }

    return url;
  }

  /**
   * 미디어 URL 유효성 검사
   */
  isValidMediaUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== 'string') return false;

    // 기본 URL 유효성
    try {
      new URL(url);
    } catch {
      return false;
    }

    // 지원되는 도메인 확인
    const supportedDomains = ['pbs.twimg.com', 'media.x.com', 'video.twimg.com', 'ton.twitter.com'];

    // 제외할 패턴
    const excludePatterns = ['profile_images', 'profile_banners', 'emoji', 'badge', 'icon'];

    const hasSupportedDomain = supportedDomains.some(domain => url.includes(domain));
    const hasExcludedPattern = excludePatterns.some(pattern => url.includes(pattern));

    return hasSupportedDomain && !hasExcludedPattern;
  }

  /**
   * 미디어 타입 판별
   */
  getMediaType(url: string): MediaType {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('.mp4') || lowerUrl.includes('video') || lowerUrl.includes('.m3u8')) {
      return 'video';
    }

    if (lowerUrl.includes('.gif')) {
      return 'gif';
    }

    return 'image';
  }

  /**
   * 파일명 생성
   */
  generateFilename(
    mediaInfo: MediaInfo,
    tweetInfo?: { username?: string; tweetId?: string }
  ): string {
    const { url, type } = mediaInfo;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

    // URL에서 파일 확장자 추출
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = this.getFileExtension(pathname, type);

    // 파일명 구성 요소
    const parts: string[] = [];

    if (tweetInfo?.username) {
      parts.push(tweetInfo.username.replace(/^@/, ''));
    }

    if (tweetInfo?.tweetId) {
      parts.push(tweetInfo.tweetId);
    }

    parts.push(timestamp);

    // 기본 파일명이 없으면 타입 추가
    if (parts.length === 1) {
      parts.unshift(type);
    }

    return `${parts.join('_')}.${extension}`;
  }

  /**
   * 미디어 필터링
   */
  filterMedia(mediaInfos: MediaInfo[], options: FilterOptions = {}): MediaInfo[] {
    return mediaInfos.filter(media => {
      // 크기 필터
      if (options.minWidth && media.width && media.width < options.minWidth) {
        return false;
      }

      if (options.minHeight && media.height && media.height < options.minHeight) {
        return false;
      }

      // 타입 필터
      if (options.allowedTypes && !options.allowedTypes.includes(media.type)) {
        return false;
      }

      // 제외 패턴 필터
      if (options.excludePatterns) {
        const hasExcluded = options.excludePatterns.some(pattern =>
          media.url.toLowerCase().includes(pattern.toLowerCase())
        );
        if (hasExcluded) return false;
      }

      return true;
    });
  }

  /**
   * 미디어 로드 상태 확인
   */
  async checkMediaLoadStatus(url: string): Promise<boolean> {
    try {
      const img = new Image();
      return new Promise(resolve => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    } catch (error) {
      logger.error('미디어 로드 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 미디어 사전 로딩
   */
  preloadMedia(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      return new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // 실패해도 계속 진행
        img.src = url;
      });
    });

    return Promise.all(promises);
  }

  /**
   * 중복 미디어 제거
   */
  removeDuplicates(mediaInfos: MediaInfo[]): MediaInfo[] {
    const seen = new Set<string>();
    return mediaInfos.filter(media => {
      const key = media.url;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 파일 확장자 추출
   */
  private getFileExtension(pathname: string, type: MediaType): string {
    // URL에서 확장자 추출 시도
    const match = pathname.match(/\.(\w+)$/);
    if (match?.[1]) {
      return match[1];
    }

    // 타입별 기본 확장자
    switch (type) {
      case 'video':
        return 'mp4';
      case 'gif':
        return 'gif';
      case 'image':
      default:
        return 'jpg';
    }
  }
}

// 전역 인스턴스 export
export const coreMediaManager = CoreMediaManager.getInstance();

// 편의 함수들
export const extractMediaUrls = (element: HTMLElement): MediaInfo[] =>
  coreMediaManager.extractMediaUrls(element);

export const getHighQualityUrl = (url: string): string => coreMediaManager.getHighQualityUrl(url);

export const isValidMediaUrl = (url: string | null | undefined): boolean =>
  coreMediaManager.isValidMediaUrl(url);

export const generateFilename = (
  mediaInfo: MediaInfo,
  tweetInfo?: { username?: string; tweetId?: string }
): string => coreMediaManager.generateFilename(mediaInfo, tweetInfo);

export const filterMedia = (mediaInfos: MediaInfo[], options?: FilterOptions): MediaInfo[] =>
  coreMediaManager.filterMedia(mediaInfos, options);

export const removeDuplicates = (mediaInfos: MediaInfo[]): MediaInfo[] =>
  coreMediaManager.removeDuplicates(mediaInfos);
