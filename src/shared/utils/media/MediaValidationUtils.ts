/**
 * @fileoverview 미디어 URL 검증 유틸리티
 * @version 1.0.0 - TDD GREEN Phase
 *
 * 중복된 미디어 URL 검증 로직을 통합한 공통 유틸리티
 */

/**
 * 미디어 URL 검증 옵션
 */
export interface MediaValidationOptions {
  /** 프로필 이미지 허용 여부 */
  allowProfileImages?: boolean;
  /** Data URL 허용 여부 */
  allowDataUrls?: boolean;
  /** HTTP 허용 여부 (기본: HTTPS만) */
  allowHttp?: boolean;
  /** 허용할 추가 도메인들 */
  allowedDomains?: string[];
  /** 허용할 파일 확장자들 */
  allowedExtensions?: string[];
}

/**
 * 기본 검증 옵션
 */
const DEFAULT_VALIDATION_OPTIONS: Required<MediaValidationOptions> = {
  allowProfileImages: false,
  allowDataUrls: false,
  allowHttp: false,
  allowedDomains: ['pbs.twimg.com', 'video.twimg.com'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'],
};

/**
 * 미디어 URL 검증 유틸리티
 *
 * FallbackStrategy와 DOMDirectStrategy에서 중복된 검증 로직을 통합
 */
export class MediaValidationUtils {
  /**
   * 미디어 URL이 유효한지 검증
   *
   * @param url - 검증할 URL
   * @param options - 검증 옵션
   * @returns 유효한 미디어 URL인지 여부
   */
  static isValidMediaUrl(url: string, options: MediaValidationOptions = {}): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };

    // Data URL 처리
    if (url.startsWith('data:')) {
      return opts.allowDataUrls;
    }

    // HTTP/HTTPS 체크
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return false;
    }

    if (url.startsWith('http://') && !opts.allowHttp) {
      return false;
    }

    // 프로필 이미지 체크
    if (!opts.allowProfileImages && url.includes('profile_images')) {
      return false;
    }

    // 도메인 체크
    const isAllowedDomain = opts.allowedDomains.some(domain => url.includes(domain));

    // 확장자 체크
    const lowerUrl = url.toLowerCase();
    const hasValidExtension = opts.allowedExtensions.some(ext => lowerUrl.includes(ext));

    // 허용된 도메인이거나 유효한 확장자를 가져야 함
    return isAllowedDomain || hasValidExtension;
  }

  /**
   * 미디어 타입 감지
   *
   * @param url - 미디어 URL
   * @returns 미디어 타입
   */
  static detectMediaType(url: string): 'image' | 'video' {
    const lowerUrl = url.toLowerCase();

    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    const isVideo =
      videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('video');

    return isVideo ? 'video' : 'image';
  }

  /**
   * URL에서 파일명 추출
   *
   * @param url - 미디어 URL
   * @returns 추출된 파일명
   */
  static extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';

      // 쿼리 파라미터 제거
      return filename.split('?')[0] || `media_${Date.now()}`;
    } catch {
      return `media_${Date.now()}`;
    }
  }

  /**
   * 미디어 URL을 정규화
   *
   * @param url - 원본 URL
   * @returns 정규화된 URL
   */
  static normalizeMediaUrl(url: string): string {
    if (!url) return url;

    // 트위터 미디어 URL의 경우 원본 크기로 변환
    if (url.includes('pbs.twimg.com')) {
      return url.replace(/(\?.*)?$/, '?name=orig');
    }

    return url;
  }
}
