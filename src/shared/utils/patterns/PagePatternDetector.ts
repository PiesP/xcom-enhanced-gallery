/**
 * @fileoverview PagePatternDetector - Twitter 페이지 패턴 감지기
 * @description TDD로 구현된 페이지 타입 및 DOM 패턴 감지 유틸리티
 * @version 1.0.0 - TDD Phase 1
 */

export interface PageTypeDetectionResult {
  type: 'POST' | 'PROFILE' | 'HOME' | 'SEARCH' | 'UNKNOWN';
  confidence: number;
}

export interface MediaContainerDetectionResult {
  isMediaContainer: boolean;
  containerType: 'TWEET_MEDIA' | 'VIDEO_PLAYER' | 'IMAGE_GALLERY' | 'NONE';
  confidence: number;
}

/**
 * Twitter 페이지 패턴 감지기
 * URL 패턴과 DOM 구조를 분석하여 페이지 타입과 미디어 컨테이너를 감지
 */
export class PagePatternDetector {
  private static readonly URL_PATTERNS = {
    POST: /\/status\/\d+/,
    PROFILE: /^\/[^/]+$/,
    HOME: /^\/(home)?$/,
    SEARCH: /\/search/,
  } as const;

  private static readonly TWITTER_PATTERNS = [
    'tweet',
    'tweetPhoto',
    'tweetText',
    'tweetButton',
    'videoPlayer',
    'videoComponent',
    'playButton',
    'photoViewerLayer',
  ] as const;

  private static readonly MEDIA_SELECTORS = [
    '[data-testid="tweetPhoto"]',
    'img[src*="twimg.com"]',
    '[data-testid="videoPlayer"]',
    '[data-testid="videoComponent"]',
    '[data-testid="photoViewerLayer"]',
  ] as const;

  /**
   * URL을 기반으로 페이지 타입 감지
   */
  detectPageType(url: string): PageTypeDetectionResult {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // URL 패턴 기반 감지
      const urlResult = this.detectPageTypeFromURL(pathname);
      if (urlResult.confidence > 0.7) {
        return urlResult;
      }

      // DOM 구조 기반 추가 분석 (높은 신뢰도)
      const domResult = this.detectPageTypeFromDOM();
      if (domResult.confidence > urlResult.confidence) {
        return domResult;
      }

      return urlResult;
    } catch {
      return { type: 'UNKNOWN', confidence: 0.0 };
    }
  }

  /**
   * DOM 요소가 미디어 컨테이너인지 감지
   */
  detectMediaContainer(element: HTMLElement): MediaContainerDetectionResult {
    // 트윗 미디어 컨테이너 감지
    if (this.isTweetMediaContainer(element)) {
      return {
        isMediaContainer: true,
        containerType: 'TWEET_MEDIA',
        confidence: 0.9,
      };
    }

    // 비디오 플레이어 감지
    if (this.isVideoPlayerContainer(element)) {
      return {
        isMediaContainer: true,
        containerType: 'VIDEO_PLAYER',
        confidence: 0.85,
      };
    }

    // 이미지 갤러리 감지
    if (this.isImageGalleryContainer(element)) {
      return {
        isMediaContainer: true,
        containerType: 'IMAGE_GALLERY',
        confidence: 0.8,
      };
    }

    // 미디어가 없는 경우
    return {
      isMediaContainer: false,
      containerType: 'NONE',
      confidence: 0.0,
    };
  }

  /**
   * DOM 요소에서 Twitter 관련 패턴 추출
   */
  extractDOMPatterns(element: HTMLElement): string[] {
    const patterns: string[] = [];

    // data-testid 속성에서 패턴 추출
    const elementsWithTestId = element.querySelectorAll('[data-testid]');
    elementsWithTestId.forEach(el => {
      const testId = el.getAttribute('data-testid');
      if (testId && this.isTwitterPattern(testId)) {
        patterns.push(testId);
      }
    });

    // 현재 요소의 data-testid도 확인
    const currentTestId = element.getAttribute('data-testid');
    if (currentTestId && this.isTwitterPattern(currentTestId)) {
      patterns.push(currentTestId);
    }

    // 중복 제거
    return [...new Set(patterns)];
  }

  /**
   * URL 패턴 기반 페이지 타입 감지
   */
  private detectPageTypeFromURL(pathname: string): PageTypeDetectionResult {
    if (PagePatternDetector.URL_PATTERNS.POST.test(pathname)) {
      return { type: 'POST', confidence: 0.9 };
    }

    if (PagePatternDetector.URL_PATTERNS.HOME.test(pathname)) {
      return { type: 'HOME', confidence: 0.9 };
    }

    if (PagePatternDetector.URL_PATTERNS.SEARCH.test(pathname)) {
      return { type: 'SEARCH', confidence: 0.8 };
    }

    if (PagePatternDetector.URL_PATTERNS.PROFILE.test(pathname)) {
      return { type: 'PROFILE', confidence: 0.8 };
    }

    return { type: 'UNKNOWN', confidence: 0.0 };
  }

  /**
   * DOM 구조 기반 페이지 타입 감지
   */
  private detectPageTypeFromDOM(): PageTypeDetectionResult {
    // 미디어 뷰어가 열려있으면 POST 페이지
    if (document.querySelector('[data-testid="photoViewerLayer"]')) {
      return { type: 'POST', confidence: 0.95 };
    }

    // 트윗 스레드 뷰 감지
    if (document.querySelector('[data-testid="primaryColumn"] [data-testid="tweet"]')) {
      return { type: 'POST', confidence: 0.85 };
    }

    return { type: 'UNKNOWN', confidence: 0.0 };
  }

  /**
   * 트윗 미디어 컨테이너 여부 확인
   */
  private isTweetMediaContainer(element: HTMLElement): boolean {
    // data-testid="tweet" 내부에 미디어가 있는지 확인
    const tweetContainer =
      element.closest('[data-testid="tweet"]') || element.querySelector('[data-testid="tweet"]');

    if (!tweetContainer) return false;

    // 미디어 관련 요소 확인
    return PagePatternDetector.MEDIA_SELECTORS.some(selector =>
      tweetContainer.querySelector(selector)
    );
  }

  /**
   * 비디오 플레이어 컨테이너 여부 확인
   */
  private isVideoPlayerContainer(element: HTMLElement): boolean {
    return !!(
      element.querySelector('[data-testid="videoPlayer"]') ||
      element.querySelector('[data-testid="videoComponent"]') ||
      element.closest('[data-testid="videoPlayer"]')
    );
  }

  /**
   * 이미지 갤러리 컨테이너 여부 확인
   */
  private isImageGalleryContainer(element: HTMLElement): boolean {
    const images = element.querySelectorAll('img[src*="twimg.com"]');
    return images.length > 1; // 여러 이미지가 있으면 갤러리로 간주
  }

  /**
   * Twitter 관련 패턴인지 확인
   */
  private isTwitterPattern(testId: string): boolean {
    return PagePatternDetector.TWITTER_PATTERNS.some(pattern => testId.includes(pattern));
  }
}
