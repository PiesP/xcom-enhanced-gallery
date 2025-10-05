/**
 * @fileoverview MediaClickDetector - 안정적인 미디어 클릭 감지기
 * @description UI 변경에 강건한 미디어 클릭 감지 및 처리 로직 (DOM 캐싱 최적화)
 */

import { SELECTORS } from '@/constants';
import { logger } from '@shared/logging/logger';
import { cachedQuerySelector } from '@shared/dom';
import { createTrustedHostnameGuard, TWITTER_MEDIA_HOSTS } from '@shared/utils/url-safety';

const isTrustedTwitterMediaHostname = createTrustedHostnameGuard(TWITTER_MEDIA_HOSTS);

/**
 * 미디어 감지 결과
 */
export interface MediaDetectionResult {
  /** 감지된 미디어 타입 */
  type: 'video' | 'image' | 'none';
  /** 감지된 요소 */
  element: HTMLElement | null;
  /** 미디어 URL (있는 경우) */
  mediaUrl?: string;
  /** 감지 신뢰도 (0-1) */
  confidence: number;
  /** 감지 방법 */
  method: string;
}

/**
 * 안정적인 미디어 클릭 감지기
 * 트위터 UI 변경에 대응하는 다중 선택자 전략 사용
 * DOM 캐싱을 통한 성능 최적화 적용
 */
export class MediaClickDetector {
  private static instance: MediaClickDetector;

  public static getInstance(): MediaClickDetector {
    MediaClickDetector.instance ??= new MediaClickDetector();
    return MediaClickDetector.instance;
  }

  /**
   * 처리 가능한 미디어 요소인지 확인
   * @param target 클릭된 DOM 요소
   * @returns 미디어 처리 가능 여부
   */
  public static isProcessableMedia(target: HTMLElement): boolean {
    if (!target) return false;

    logger.debug('MediaClickDetector: Checking processable media for:', {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      dataset: target.dataset,
    });

    // 갤러리가 이미 열려있으면 무시 (캐시된 조회 사용)
    if (cachedQuerySelector('.xeg-gallery-container', document, 1000)) {
      logger.debug('MediaClickDetector: Gallery already open - blocking');
      return false;
    }

    // 갤러리를 차단해야 하는 요소들 먼저 확인
    if (MediaClickDetector.shouldBlockGalleryTrigger(target)) {
      logger.debug('MediaClickDetector: Blocked by shouldBlockGalleryTrigger');
      return false;
    }

    // 1. 미디어 컨테이너 확인 (최우선) - 더 포괄적인 선택자 사용
    const imageSelectors = [
      SELECTORS.TWEET_PHOTO,
      'img[src*="pbs.twimg.com"]',
      '[data-testid="tweetPhoto"]',
      '[data-testid="tweet"] img',
      'article img[src*="twimg.com"]',
      // 트위터 미디어 컨테이너
      '[data-testid="tweetText"] img',
      '.tweet-media img',
      '.media-entity img',
    ];
    for (const selector of imageSelectors) {
      const match = target.closest(selector);
      if (match && MediaClickDetector.hasTrustedImage(match)) {
        logger.info(`✅ MediaClickDetector: 이미지 컨테이너 감지 - ${selector}`);
        return true;
      }
    }

    // 2. 미디어 플레이어 확인 (Twitter URL 검증 포함)
    // Timeline과 Tweet Detail 페이지 양쪽 호환
    const videoSelectors = [
      SELECTORS.VIDEO_PLAYER,
      '[data-testid="videoPlayer"]',
      '[data-testid="videoComponent"]',
      '[data-testid="tweet"] video',
      'article video',
      '.video-container',
      '.media-video',
    ];
    for (const selector of videoSelectors) {
      const match = target.closest(selector);
      if (match) {
        // video 태그 포함 선택자는 URL 검증 필수 (보안)
        if (selector.includes('video')) {
          const videoElement =
            match.tagName === 'VIDEO' ? (match as HTMLVideoElement) : match.querySelector('video');
          if (videoElement && MediaClickDetector.isTwitterMediaElement(videoElement)) {
            logger.info(`✅ MediaClickDetector: 미디어 플레이어 감지 (URL 검증) - ${selector}`);
            return true;
          }
        } else {
          // data-testid 기반 컨테이너는 Twitter 내부 요소이므로 신뢰
          logger.info(`✅ MediaClickDetector: 미디어 플레이어 감지 - ${selector}`);
          return true;
        }
      }
    }

    // 3. 직접적인 미디어 요소 확인 (IMG, VIDEO 태그)
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      const isTwitterMedia = MediaClickDetector.isTwitterMediaElement(target);
      if (isTwitterMedia) {
        logger.info('✅ MediaClickDetector: 트위터 미디어 요소 직접 클릭');
        return true;
      }
    }

    // 3-1. Timeline 전용: role="button" + aria-label 패턴 감지
    // Timeline에서는 video 태그 없이 div[role="button"]으로 동영상 표현
    const ariaLabel = target.getAttribute('aria-label') || '';
    const role = target.getAttribute('role') || '';

    if (
      role === 'button' &&
      (ariaLabel.includes('동영상') ||
        ariaLabel.includes('video') ||
        ariaLabel.includes('재생') ||
        ariaLabel.includes('Play'))
    ) {
      // videoComponent 또는 cellInnerDiv 컨테이너 내부에 있는지 확인
      const isInVideoContext = target.closest(
        '[data-testid="videoComponent"], [data-testid="cellInnerDiv"]'
      );
      if (isInVideoContext) {
        logger.info('✅ MediaClickDetector: Timeline 동영상 role button 감지');
        return true;
      }
    }

    // 4. 미디어 링크 확인 - 더 포괄적인 선택자 사용
    const linkSelectors = [
      'a[href*="/photo/"]',
      'a[href*="/video/"]',
      'a[href*="pic.twitter.com"]',
      'a[href*="pbs.twimg.com"]',
    ];
    for (const selector of linkSelectors) {
      const match = target.closest(selector);
      if (match && MediaClickDetector.hasTrustedLink(match)) {
        logger.info(`✅ MediaClickDetector: 미디어 링크 감지 - ${selector}`);
        return true;
      }
    }

    // 5. 트윗 내부의 미디어 영역 확인 (가장 넓은 범위)
    const tweetContainer = target.closest('article[data-testid="tweet"], [data-testid="tweet"]');
    if (tweetContainer) {
      // 트윗 내부에서 이미지나 비디오가 포함된 영역 클릭 확인
      const hasMediaInTweet = tweetContainer.querySelector(
        'img[src*="twimg.com"], video, [data-testid="tweetPhoto"], [data-testid="videoPlayer"]'
      );
      if (hasMediaInTweet) {
        // 클릭된 위치가 미디어 영역 근처인지 확인
        const mediaRect = hasMediaInTweet.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        // 미디어 영역과 클릭 영역이 겹치는지 확인
        const isNearMedia =
          targetRect.left < mediaRect.right &&
          targetRect.right > mediaRect.left &&
          targetRect.top < mediaRect.bottom &&
          targetRect.bottom > mediaRect.top;

        if (isNearMedia) {
          logger.info('✅ MediaClickDetector: 미디어가 있는 트윗 영역 클릭');
          return true;
        }
      }
    }

    logger.debug('MediaClickDetector: No media detected');
    return false;
  }

  /**
   * 갤러리 트리거를 차단해야 하는 요소인지 확인
   *
   * **Epic TIMELINE-VIDEO-CLICK-FIX 개선 사항**:
   * - 광범위한 `[data-testid="videoComponent"] button` 선택자 제거
   * - 대신 aria-label 기반 구체적 패턴 사용 (재생/일시정지/진행 상태)
   * - False positive 방지: "설정 열기" 등 일반 버튼은 갤러리 허용
   *
   * @param target 클릭된 DOM 요소
   * @returns 차단 여부
   */
  public static shouldBlockGalleryTrigger(target: HTMLElement): boolean {
    // 1. 플레이 버튼은 기본 동작 유지
    if (target.closest('[data-testid="playButton"]')) {
      logger.debug('MediaClickDetector: 플레이 버튼 클릭 - 기본 동작 허용');
      return true;
    }

    // 2. 비디오 제어 요소: aria-label 기반 구체적 패턴만 차단
    // (Epic TIMELINE-VIDEO-CLICK-FIX: 광범위한 선택자 제거)
    const videoControlSelectors = [
      // 언어별 aria-label 패턴
      'button[aria-label*="다시보기"]',
      'button[aria-label*="일시정지"]',
      'button[aria-label*="재생"]',
      'button[aria-label*="Replay"]',
      'button[aria-label*="Pause"]',
      'button[aria-label*="Play"]',
      // videoPlayer 내부의 구체적 컨트롤만
      '[data-testid="videoPlayer"] button[aria-label*="재생"]',
      '[data-testid="videoPlayer"] button[aria-label*="일시정지"]',
      '[data-testid="videoPlayer"] button[aria-label*="Play"]',
      '[data-testid="videoPlayer"] button[aria-label*="Pause"]',
      '.video-controls button',
      '.player-controls button',
      '[role="slider"]', // 진행 바
      // 'video' 제거됨 - 너무 포괄적
    ];

    for (const selector of videoControlSelectors) {
      if (target.closest(selector)) {
        logger.debug('MediaClickDetector: 비디오 제어 요소 클릭 - 기본 동작 허용');
        return true;
      }
    }

    // 3. 갤러리 내부 요소들 차단 (갤러리 중복 열기 방지)
    const galleryInternalSelectors = [
      '.xeg-gallery-container',
      '[data-gallery-element]',
      '#xeg-gallery-root',
      '.vertical-gallery-view',
      '[data-xeg-gallery-container]',
      '[data-xeg-gallery]',
      '.xeg-vertical-gallery',
    ];

    for (const selector of galleryInternalSelectors) {
      if (target.closest(selector)) {
        logger.debug('MediaClickDetector: 갤러리 내부 요소 클릭 - 차단');
        return true;
      }
    }

    // 4. 플레이 버튼 내부의 SVG 아이콘들은 기본 동작 유지
    const playButton = target.closest('[data-testid="playButton"]');
    if (
      playButton &&
      (target.tagName === 'svg' || target.tagName === 'circle' || target.tagName === 'path')
    ) {
      logger.debug('MediaClickDetector: 플레이 버튼 내 SVG 요소 클릭 - 기본 동작 허용');
      return true;
    }

    // 5. 명확한 UI 버튼들만 차단
    const uiButtonSelectors = [
      'button[data-testid*="bookmark"]',
      'button[data-testid*="retweet"]',
      'button[data-testid*="like"]',
      'button[data-testid*="reply"]',
      '[data-testid="User-Name"]',
      '[data-testid="UserAvatar"]',
    ];

    for (const selector of uiButtonSelectors) {
      if (target.closest(selector)) {
        logger.debug(`MediaClickDetector: UI 버튼 클릭 차단 - ${selector}`);
        return true;
      }
    }

    // 5. 순수 텍스트 링크만 차단 (미디어가 없는 링크)
    const statusLink = target.closest('a[href*="/status/"]') as HTMLAnchorElement;
    if (statusLink) {
      // 미디어 컨테이너 내부에 있으면 허용
      const isInMediaContainer = target.closest(
        '[data-testid="tweetPhoto"], [data-testid="videoPlayer"]'
      );
      if (isInMediaContainer) {
        logger.debug('MediaClickDetector: 미디어 컨테이너 내 링크 - 갤러리 허용');
        return false;
      }

      // 링크 안에 미디어 요소가 있으면 허용 (캐시된 조회 사용)
      const hasMedia = cachedQuerySelector(
        'img[src*="twimg.com"], video, [data-testid="tweetPhoto"]',
        statusLink,
        2000 // 미디어 요소는 상대적으로 안정적이므로 긴 TTL
      );
      if (hasMedia) {
        logger.debug('MediaClickDetector: 미디어 포함 링크 - 갤러리 허용');
        return false;
      }

      // 순수 텍스트 링크는 차단
      logger.debug('MediaClickDetector: 순수 텍스트 링크 클릭 차단');
      return true;
    }

    return false;
  }

  /**
   * 트위터 미디어 요소인지 확인
   * @param element 확인할 DOM 요소
   * @returns 트위터 미디어 여부
   */
  private static isTwitterMediaElement(element: HTMLElement): boolean {
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      return isTrustedTwitterMediaHostname(img.src);
    }

    if (element.tagName === 'VIDEO') {
      // 트위터 비디오는 보통 특정 컨테이너 안에 있음
      const video = element as HTMLVideoElement;
      const hasTrustedPoster = video.poster ? isTrustedTwitterMediaHostname(video.poster) : false;

      // src 또는 currentSrc URL 검증 추가
      const hasTrustedSrc = video.src ? isTrustedTwitterMediaHostname(video.src) : false;
      const hasTrustedCurrentSrc = video.currentSrc
        ? isTrustedTwitterMediaHostname(video.currentSrc)
        : false;

      return (
        hasTrustedPoster ||
        hasTrustedSrc ||
        hasTrustedCurrentSrc ||
        !!element.closest('[data-testid="videoPlayer"], [data-testid="tweetVideo"]')
      );
    }

    return false;
  }

  private static hasTrustedImage(element: Element): boolean {
    const candidate =
      element instanceof HTMLImageElement
        ? element
        : (element.querySelector('img[src]') as HTMLImageElement | null);
    if (!candidate) {
      return false;
    }
    return isTrustedTwitterMediaHostname(candidate.src);
  }

  private static hasTrustedLink(element: Element): boolean {
    const anchor =
      element instanceof HTMLAnchorElement
        ? element
        : (element.closest('a[href]') as HTMLAnchorElement | null) ||
          (element.querySelector('a[href]') as HTMLAnchorElement | null);

    if (!anchor) {
      return false;
    }

    const href = anchor.href;
    if (!href) {
      return false;
    }

    if (/twimg\.com/i.test(href)) {
      return isTrustedTwitterMediaHostname(href);
    }

    return true;
  }

  /**
   * 클릭된 요소에서 미디어 정보 추출
   * @param target 클릭된 DOM 요소
   * @returns 미디어 감지 결과
   */
  public detectMediaFromClick(target: HTMLElement): MediaDetectionResult {
    try {
      // 직접적인 미디어 요소
      if (target.tagName === 'IMG' && MediaClickDetector.isTwitterMediaElement(target)) {
        const img = target as HTMLImageElement;
        return {
          type: 'image',
          element: target,
          mediaUrl: img.src,
          confidence: 1.0,
          method: 'direct_element',
        };
      }

      if (target.tagName === 'VIDEO' && MediaClickDetector.isTwitterMediaElement(target)) {
        const video = target as HTMLVideoElement;
        return {
          type: 'video',
          element: target,
          mediaUrl: video.src || video.currentSrc,
          confidence: 1.0,
          method: 'direct_element',
        };
      }

      // 안정적인 선택자를 통한 미디어 컨테이너 검색
      const imageSelectors = [SELECTORS.TWEET_PHOTO, 'img[src*="pbs.twimg.com"]'];
      for (const selector of imageSelectors) {
        const container = target.closest(selector) as HTMLElement;
        if (container) {
          // 이미지 찾기
          const img = container.querySelector('img[src]') as HTMLImageElement;
          if (img && isTrustedTwitterMediaHostname(img.src)) {
            return {
              type: 'image',
              element: img,
              mediaUrl: img.src,
              confidence: 0.9,
              method: `container_search:${selector}`,
            };
          }
        }
      }

      // 미디어 플레이어 검색
      const videoSelectors = [SELECTORS.VIDEO_PLAYER, 'video'];
      for (const selector of videoSelectors) {
        const container = target.closest(selector) as HTMLElement;
        if (container) {
          // 비디오 찾기
          const video = container.querySelector('video') as HTMLVideoElement;
          if (video) {
            return {
              type: 'video',
              element: video,
              mediaUrl: video.src || video.currentSrc,
              confidence: 0.9,
              method: `player_search:${selector}`,
            };
          }
        }
      }

      return {
        type: 'none',
        element: null,
        confidence: 0,
        method: 'not_found',
      };
    } catch (error) {
      logger.error('[MediaClickDetector] 미디어 감지 실패:', error);
      return {
        type: 'none',
        element: null,
        confidence: 0,
        method: 'error',
      };
    }
  }

  /**
   * 클릭 좌표 기반 정확한 미디어 요소 찾기
   * @param x X 좌표
   * @param y Y 좌표
   * @returns 미디어 감지 결과
   */
  public findMediaAtCoordinates(x: number, y: number): MediaDetectionResult {
    try {
      const elementAtPoint = document.elementFromPoint(x, y) as HTMLElement;
      if (!elementAtPoint) {
        return { type: 'none', element: null, confidence: 0, method: 'no_element_at_point' };
      }

      return this.detectMediaFromClick(elementAtPoint);
    } catch (error) {
      logger.error('[MediaClickDetector] 좌표 기반 감지 실패:', error);
      return { type: 'none', element: null, confidence: 0, method: 'coordinate_error' };
    }
  }
}

// 하위 호환성을 위한 별칭
// Export 정리 - 클래스 자체 export만 유지
