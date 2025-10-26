/**
 * @fileoverview MediaClickDetector - 안정적인 미디어 클릭 감지기
 * @description UI 변경에 강건한 미디어 클릭 감지 및 처리 로직 (DOM 캐싱 최적화)
 */

import { STABLE_SELECTORS, CSS } from '../../../constants';
import { isVideoControlElement } from '../utils';
import { logger } from '@shared/logging';
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

const GALLERY_INTERNAL_SELECTORS = [
  `.${CSS.CLASSES.GALLERY_CONTAINER}`,
  '[data-gallery-element]',
  '#xeg-gallery-root',
  '.vertical-gallery-view',
  '[data-xeg-gallery-container]',
  '[data-xeg-gallery]',
  '.xeg-vertical-gallery',
];

const UI_BUTTON_SELECTORS = [
  STABLE_SELECTORS.ACTION_BUTTONS.bookmark,
  STABLE_SELECTORS.ACTION_BUTTONS.retweet,
  STABLE_SELECTORS.ACTION_BUTTONS.like,
  STABLE_SELECTORS.ACTION_BUTTONS.reply,
  STABLE_SELECTORS.ACTION_BUTTONS.share,
  '[data-testid="User-Name"]',
  '[data-testid="UserAvatar"]',
];

const MEDIA_IN_LINK_SELECTORS = Array.from(
  new Set([...STABLE_SELECTORS.IMAGE_CONTAINERS, ...STABLE_SELECTORS.MEDIA_PLAYERS])
);

const TWEET_MEDIA_SELECTORS = MEDIA_IN_LINK_SELECTORS;

/**
 * 처리 가능한 미디어 요소인지 확인
 */
export function isProcessableMedia(target: HTMLElement | null): boolean {
  if (!target) return false;

  logger.debug('MediaClickDetector: Checking processable media for:', {
    tagName: target.tagName,
    className: target.className,
    id: target.id,
    dataset: target.dataset,
  });

  if (cachedQuerySelector(`.${CSS.CLASSES.GALLERY_CONTAINER}`, document, 1000)) {
    logger.debug('MediaClickDetector: Gallery already open - blocking');
    return false;
  }

  if (shouldBlockMediaTrigger(target)) {
    logger.debug('MediaClickDetector: Blocked by shouldBlockGalleryTrigger');
    return false;
  }

  for (const selector of STABLE_SELECTORS.IMAGE_CONTAINERS) {
    if (target.closest(selector)) {
      logger.info(`✅ MediaClickDetector: 이미지 컨테이너 감지 - ${selector}`);
      return true;
    }
  }

  for (const selector of STABLE_SELECTORS.MEDIA_PLAYERS) {
    if (target.closest(selector)) {
      logger.info(`✅ MediaClickDetector: 미디어 플레이어 감지 - ${selector}`);
      return true;
    }
  }

  if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
    if (isTwitterMediaElement(target)) {
      logger.info('✅ MediaClickDetector: 트위터 미디어 요소 직접 클릭');
      return true;
    }
  }

  for (const selector of STABLE_SELECTORS.MEDIA_LINKS) {
    if (target.closest(selector)) {
      logger.info(`✅ MediaClickDetector: 미디어 링크 감지 - ${selector}`);
      return true;
    }
  }

  let tweetContainer: Element | null = null;
  for (const selector of STABLE_SELECTORS.TWEET_CONTAINERS) {
    const found = target.closest(selector);
    if (found) {
      tweetContainer = found;
      break;
    }
  }

  if (tweetContainer) {
    const hasMediaInTweet = tweetContainer.querySelector(TWEET_MEDIA_SELECTORS.join(', '));
    if (hasMediaInTweet) {
      const mediaRect = hasMediaInTweet.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
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

export function shouldBlockMediaTrigger(target: HTMLElement | null): boolean {
  if (!target) return false;

  if (isVideoControlElement(target)) {
    logger.debug('MediaClickDetector: 비디오 제어 요소 클릭 - 기본 동작 허용');
    return true;
  }

  for (const selector of GALLERY_INTERNAL_SELECTORS) {
    if (target.closest(selector)) {
      logger.debug('MediaClickDetector: 갤러리 내부 요소 클릭 - 차단');
      return true;
    }
  }

  for (const selector of UI_BUTTON_SELECTORS) {
    if (target.closest(selector)) {
      logger.debug(`MediaClickDetector: UI 버튼 클릭 차단 - ${selector}`);
      return true;
    }
  }

  const mcSel = STABLE_SELECTORS.MEDIA_CONTAINERS.join(', ');

  // 외부 링크 내 이미지: 미디어 컨테이너 제외
  if (target.tagName === 'IMG') {
    const parentLink = target.closest('a');
    if (parentLink && !parentLink.href.includes('/status/') && !target.closest(mcSel)) {
      return true;
    }
  }

  const statusLink = target.closest('a[href*="/status/"]');
  if (!statusLink) return false;

  if (target.closest(mcSel)) {
    logger.debug('MediaClickDetector: 미디어 컨테이너 내 링크 - 갤러리 허용');
    return false;
  }

  if (cachedQuerySelector(MEDIA_IN_LINK_SELECTORS.join(', '), statusLink, 2000)) {
    logger.debug('MediaClickDetector: 미디어 포함 링크 - 갤러리 허용');
    return false;
  }

  logger.debug('MediaClickDetector: 순수 텍스트 링크 클릭 차단');
  return true;
}

/**
 * 클릭된 요소에서 미디어 정보 추출
 */
export function detectMediaFromClick(target: HTMLElement): MediaDetectionResult {
  try {
    if (target.tagName === 'IMG' && isTwitterMediaElement(target)) {
      const img = target as HTMLImageElement;
      return {
        type: 'image',
        element: target,
        mediaUrl: img.src,
        confidence: 1.0,
        method: 'direct_element',
      };
    }

    if (target.tagName === 'VIDEO' && isTwitterMediaElement(target)) {
      const video = target as HTMLVideoElement;
      return {
        type: 'video',
        element: target,
        mediaUrl: video.src || video.currentSrc,
        confidence: 1.0,
        method: 'direct_element',
      };
    }

    for (const selector of STABLE_SELECTORS.IMAGE_CONTAINERS) {
      const container = target.closest(selector) as HTMLElement | null;
      if (!container) continue;

      if (container.tagName === 'IMG' && isTwitterMediaElement(container)) {
        const img = container as HTMLImageElement;
        return {
          type: 'image',
          element: img,
          mediaUrl: img.src,
          confidence: 0.9,
          method: `container_search:self:${selector}`,
        };
      }

      const candidateImg = container.querySelector('img') as HTMLImageElement | null;
      if (candidateImg && isTwitterMediaElement(candidateImg)) {
        return {
          type: 'image',
          element: candidateImg,
          mediaUrl: candidateImg.src,
          confidence: 0.9,
          method: `container_search:descendant:${selector}`,
        };
      }
    }

    for (const selector of STABLE_SELECTORS.MEDIA_PLAYERS) {
      const container = target.closest(selector) as HTMLElement | null;
      if (!container) continue;

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
 */
export function findMediaAtCoordinates(x: number, y: number): MediaDetectionResult {
  try {
    const elementAtPoint = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!elementAtPoint) {
      return { type: 'none', element: null, confidence: 0, method: 'no_element_at_point' };
    }

    return detectMediaFromClick(elementAtPoint);
  } catch (error) {
    logger.error('[MediaClickDetector] 좌표 기반 감지 실패:', error);
    return { type: 'none', element: null, confidence: 0, method: 'coordinate_error' };
  }
}

function isTwitterMediaElement(element: HTMLElement): boolean {
  if (element.tagName === 'IMG') {
    // Phase 153: 링크 미리보기 이미지 지원
    // IMG 요소는 모두 처리 가능으로 간주. 이후 STABLE_SELECTORS 필터링과
    // DOM 백업 전략의 추가 검증 계층에서 유효한 미디어만 선별됨.
    return true;
  }

  if (element.tagName === 'VIDEO') {
    return !!element.closest(STABLE_SELECTORS.MEDIA_PLAYERS.join(', '));
  }

  return false;
}
