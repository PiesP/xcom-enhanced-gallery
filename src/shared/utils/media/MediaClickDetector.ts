/**
 * @fileoverview MediaClickDetector - 안정적인 미디어 클릭 감지기
 * @description UI 변경에 강건한 미디어 클릭 감지 및 처리 로직 (DOM 캐싱 최적화)
 */

import { STABLE_SELECTORS, CSS, isVideoControlElement } from '../../../constants';
import { logger } from '../../logging/logger';
import { cachedQuerySelector } from '../../dom';

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
    if (cachedQuerySelector(`.${CSS.CLASSES.GALLERY_CONTAINER}`, document, 1000)) {
      logger.debug('MediaClickDetector: Gallery already open - blocking');
      return false;
    }

    // 갤러리를 차단해야 하는 요소들 먼저 확인
    if (MediaClickDetector.shouldBlockGalleryTrigger(target)) {
      logger.debug('MediaClickDetector: Blocked by shouldBlockGalleryTrigger');
      return false;
    }

    // 1. 미디어 컨테이너 확인 (최우선) - 더 포괄적인 선택자 사용
    const imageSelectors = STABLE_SELECTORS.IMAGE_CONTAINERS;
    for (const selector of imageSelectors) {
      if (target.closest(selector)) {
        logger.info(`✅ MediaClickDetector: 이미지 컨테이너 감지 - ${selector}`);
        return true;
      }
    }

    // 2. 미디어 플레이어 확인 - 더 포괄적인 선택자 사용
    const videoSelectors = STABLE_SELECTORS.MEDIA_PLAYERS;
    for (const selector of videoSelectors) {
      if (target.closest(selector)) {
        logger.info(`✅ MediaClickDetector: 미디어 플레이어 감지 - ${selector}`);
        return true;
      }
    }

    // 3. 직접적인 미디어 요소 확인
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      const isTwitterMedia = MediaClickDetector.isTwitterMediaElement(target);
      if (isTwitterMedia) {
        logger.info('✅ MediaClickDetector: 트위터 미디어 요소 직접 클릭');
        return true;
      }
    }

    // 4. 미디어 링크 확인 - 더 포괄적인 선택자 사용
    const linkSelectors = STABLE_SELECTORS.MEDIA_LINKS;
    for (const selector of linkSelectors) {
      if (target.closest(selector)) {
        logger.info(`✅ MediaClickDetector: 미디어 링크 감지 - ${selector}`);
        return true;
      }
    }

    // 5. 트윗 내부의 미디어 영역 확인 (가장 넓은 범위)
    let tweetContainer: Element | null = null;
    for (const selector of STABLE_SELECTORS.TWEET_CONTAINERS) {
      const found = target.closest(selector);
      if (found) {
        tweetContainer = found;
        break;
      }
    }
    if (tweetContainer) {
      // 트윗 내부에서 이미지나 비디오가 포함된 영역 클릭 확인
      const mediaSelectors = Array.from(
        new Set([...STABLE_SELECTORS.IMAGE_CONTAINERS, ...STABLE_SELECTORS.MEDIA_PLAYERS])
      );
      const hasMediaInTweet = tweetContainer.querySelector(mediaSelectors.join(', '));
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
   * @param target 클릭된 DOM 요소
   * @returns 차단 여부
   */
  public static shouldBlockGalleryTrigger(target: HTMLElement): boolean {
    // 1. 확장된 비디오 제어 요소들 차단 (구체적인 컨트롤만)
    if (isVideoControlElement(target)) {
      logger.debug('MediaClickDetector: 비디오 제어 요소 클릭 - 기본 동작 허용');
      return true;
    }

    // 2. 갤러리 내부 요소들 차단 (갤러리 중복 열기 방지)
    const galleryInternalSelectors = [
      `.${CSS.CLASSES.GALLERY_CONTAINER}`,
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

    // 3. 명확한 UI 버튼들만 차단
    const uiButtonSelectors = [
      // 안정 선택자 활용
      STABLE_SELECTORS.ACTION_BUTTONS.bookmark,
      STABLE_SELECTORS.ACTION_BUTTONS.retweet,
      STABLE_SELECTORS.ACTION_BUTTONS.like,
      STABLE_SELECTORS.ACTION_BUTTONS.reply,
      STABLE_SELECTORS.ACTION_BUTTONS.share,
      // 추가 사용자/아바타 요소들
      '[data-testid="User-Name"]',
      '[data-testid="UserAvatar"]',
    ];

    for (const selector of uiButtonSelectors) {
      if (target.closest(selector)) {
        logger.debug(`MediaClickDetector: UI 버튼 클릭 차단 - ${selector}`);
        return true;
      }
    }

    // 4. 순수 텍스트 링크만 차단 (미디어가 없는 링크)
    const statusLink = target.closest('a[href*="/status/"]') as HTMLAnchorElement;
    if (statusLink) {
      // 미디어 컨테이너 내부에 있으면 허용
      const isInMediaContainer = target.closest(STABLE_SELECTORS.MEDIA_CONTAINERS.join(', '));
      if (isInMediaContainer) {
        logger.debug('MediaClickDetector: 미디어 컨테이너 내 링크 - 갤러리 허용');
        return false;
      }

      // 링크 안에 미디어 요소가 있으면 허용 (캐시된 조회 사용)
      const mediaInLinkSelectors = Array.from(
        new Set([...STABLE_SELECTORS.IMAGE_CONTAINERS, ...STABLE_SELECTORS.MEDIA_PLAYERS])
      );
      const hasMedia = cachedQuerySelector(mediaInLinkSelectors.join(', '), statusLink, 2000);
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
      return img.src.includes('pbs.twimg.com') || img.src.includes('twimg.com');
    }

    if (element.tagName === 'VIDEO') {
      // 트위터 비디오는 보통 특정 컨테이너 안에 있음
      return !!element.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', '));
    }

    return false;
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
      const imageSelectors = STABLE_SELECTORS.IMAGE_CONTAINERS;
      for (const selector of imageSelectors) {
        const container = target.closest(selector) as HTMLElement;
        if (container) {
          // 컨테이너가 이미지 자체인 경우
          if (container.tagName === 'IMG' && MediaClickDetector.isTwitterMediaElement(container)) {
            const img = container as HTMLImageElement;
            return {
              type: 'image',
              element: img,
              mediaUrl: img.src,
              confidence: 0.9,
              method: `container_search:self:${selector}`,
            };
          }
          // 하위에서 이미지 탐색 후 유효성 확인
          const candidateImg = container.querySelector('img') as HTMLImageElement | null;
          if (candidateImg && MediaClickDetector.isTwitterMediaElement(candidateImg)) {
            return {
              type: 'image',
              element: candidateImg,
              mediaUrl: candidateImg.src,
              confidence: 0.9,
              method: `container_search:descendant:${selector}`,
            };
          }
        }
      }

      // 미디어 플레이어 검색
      const videoSelectors = STABLE_SELECTORS.MEDIA_PLAYERS;
      for (const selector of videoSelectors) {
        const container = target.closest(selector) as HTMLElement;
        if (container) {
          // 컨테이너가 비디오 자체인 경우
          if (container.tagName === 'VIDEO') {
            const video = container as HTMLVideoElement;
            return {
              type: 'video',
              element: video,
              mediaUrl: video.src || video.currentSrc,
              confidence: 0.9,
              method: `player_search:self:${selector}`,
            };
          }
          // 하위에서 비디오 탐색
          const video = container.querySelector('video') as HTMLVideoElement | null;
          if (video) {
            return {
              type: 'video',
              element: video,
              mediaUrl: video.src || video.currentSrc,
              confidence: 0.9,
              method: `player_search:descendant:${selector}`,
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
