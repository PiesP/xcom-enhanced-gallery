/**
 * Unified Tweet Information Extraction
 *
 * Centralizes all tweet information extraction logic to eliminate
 * duplication between different extraction methods.
 * Includes enhanced fallback strategies for robust extraction.
 */

import { logger } from '@infrastructure/logging/logger';
import {
  safeArrayFunction,
  safeMatchExtractWithDefault,
  safeNodeListAccess,
} from '@shared/utils/core/type-safety-helpers';
import {
  extractTweetInfoFromUrl,
  extractTweetInfoFromUrls,
  extractTweetUrlCandidates,
  isInvalidStatusUrl,
} from './url-patterns';

export interface TweetInfo {
  username: string;
  tweetId: string;
  tweetUrl: string;
}

export interface PartialTweetInfo {
  username?: string;
  tweetId?: string;
  tweetUrl?: string;
}

/**
 * 트윗 정보 유효성 검증
 */
function isValidTweetInfo(info: TweetInfo | null): info is TweetInfo {
  if (!info) {
    return false;
  }

  const { username, tweetId, tweetUrl } = info;

  // Check that all required fields are present and non-empty
  if (!username || !tweetId || !tweetUrl) {
    return false;
  }

  // Validate username format (no @ symbol, alphanumeric + underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return false;
  }

  // Validate tweet ID format (numeric string)
  if (!/^\d+$/.test(tweetId)) {
    return false;
  }

  // Validate tweet URL format
  if (!tweetUrl.includes('/status/') || !tweetUrl.includes(tweetId)) {
    return false;
  }

  return true;
}

/**
 * Unified Tweet Information Extraction Function
 * 클릭된 요소로부터 트윗 정보를 추출합니다.
 */
export function extractTweetInfoUnified(
  tweetContainer: HTMLElement | null,
  clickedElement?: HTMLElement
): TweetInfo | null {
  if (!tweetContainer) {
    logger.debug('트윗 컨테이너가 없음');
    return null;
  }

  // 추출 전략 배열
  const extractionStrategies = [
    () => extractFromCurrentUrl(),
    () => extractFromClickedElement(clickedElement || tweetContainer),
    () => extractFromContainerAnalysis(tweetContainer),
    () => extractFromContentAnalysis(tweetContainer),
    () => extractFromGlobalContext(),
  ];

  for (let i = 0; i < extractionStrategies.length; i++) {
    try {
      const strategy = safeArrayFunction(extractionStrategies, i);
      if (!strategy) continue;

      const result = strategy;
      if (result && isValidTweetInfo(result)) {
        logger.debug(`트윗 정보 추출 성공 (전략 ${i + 1})`, result);
        return result;
      }
    } catch (error) {
      logger.debug(`추출 전략 ${i + 1} 실패:`, error);
      continue;
    }
  }

  logger.debug('모든 추출 전략 실패');
  return null;
}

/**
 * 현재 URL에서 트윗 정보 추출
 */
function extractFromCurrentUrl(): TweetInfo | null {
  const currentUrl = window.location.href;
  logger.debug('현재 URL에서 트윗 정보 추출 시도:', currentUrl);

  const result = extractTweetInfoFromUrl(currentUrl);
  if (result && isValidTweetInfo(result)) {
    logger.debug('현재 URL에서 트윗 정보 추출 성공:', result);
    return result;
  }

  return null;
}

/**
 * 클릭된 요소로부터 트윗 정보 추출
 */
function extractFromClickedElement(clickedElement: HTMLElement): TweetInfo | null {
  if (!clickedElement) {
    return null;
  }

  // 1. 직접적으로 미디어 요소인 경우
  if (clickedElement.tagName === 'IMG' || clickedElement.tagName === 'VIDEO') {
    const mediaContainer =
      clickedElement.closest('[data-testid*="tweet"]') ||
      clickedElement.closest('article') ||
      clickedElement.parentElement;

    if (mediaContainer) {
      const urlCandidates = extractTweetUrlCandidates(mediaContainer as HTMLElement);
      const result = extractTweetInfoFromUrls(urlCandidates);
      if (result && isValidTweetInfo(result)) {
        return result;
      }
    }
  }

  // 2. 클릭된 요소가 직접 링크인 경우 (미디어 링크 처리 포함)
  if (clickedElement.tagName === 'A') {
    const href =
      (clickedElement as HTMLAnchorElement).getAttribute?.('href') ??
      (clickedElement as HTMLAnchorElement).href;
    if (href && !isInvalidStatusUrl(href)) {
      // photo/video 링크에서 status 링크로 변환
      let tweetUrl = href;
      if (href.includes('/photo/') || href.includes('/video/')) {
        const statusMatch = href.match(/^(.+\/status\/\d+)/);
        if (statusMatch) {
          tweetUrl = safeMatchExtractWithDefault(statusMatch, 1, href);
        }
      }

      // 상대 경로를 절대 경로로 변환
      const fullUrl = tweetUrl.startsWith('/') ? `https://x.com${tweetUrl}` : tweetUrl;
      const result = extractTweetInfoFromUrls([fullUrl]);
      if (result && isValidTweetInfo(result)) {
        logger.debug('Tweet info extracted from clicked link:', result);
        return result;
      }
    }
  }

  // 3. 클릭된 요소의 형제/인근 링크에서 찾기
  const nearbyLinks = clickedElement.parentElement?.querySelectorAll(
    'a[href*="/status/"], a[href*="/photo/"], a[href*="/video/"]'
  );
  if (nearbyLinks && nearbyLinks.length > 0) {
    for (const link of nearbyLinks) {
      const href =
        (link as HTMLAnchorElement).getAttribute('href') ?? (link as HTMLAnchorElement).href;
      if (href && !isInvalidStatusUrl(href)) {
        // photo/video 링크에서 status 링크로 변환
        let tweetUrl = href;
        if (href.includes('/photo/') || href.includes('/video/')) {
          const statusMatch = href.match(/^(.+\/status\/\d+)/);
          if (statusMatch) {
            tweetUrl = safeMatchExtractWithDefault(statusMatch, 1, href);
          }
        }

        // 상대 경로를 절대 경로로 변환
        const fullUrl = tweetUrl.startsWith('/') ? `https://x.com${tweetUrl}` : tweetUrl;
        const result = extractTweetInfoFromUrls([fullUrl]);
        if (result && isValidTweetInfo(result)) {
          logger.debug('Tweet info extracted from nearby link:', result);
          return result;
        }
      }
    }
  }

  return null;
}

/**
 * 컨테이너 분석을 통한 트윗 정보 추출
 */
function extractFromContainerAnalysis(tweetContainer: HTMLElement): TweetInfo | null {
  const urlCandidates = extractTweetUrlCandidates(tweetContainer);
  const result = extractTweetInfoFromUrls(urlCandidates);

  if (result && isValidTweetInfo(result)) {
    logger.debug('컨테이너 분석으로 트윗 정보 추출 성공:', result);
    return result;
  }

  // 미디어 링크에서 추출 시도
  const mediaLinks = Array.from(
    tweetContainer.querySelectorAll('a[href*="/photo/"], a[href*="/video/"], a[href*="/status/"]')
  ).map(
    link => (link as HTMLAnchorElement).getAttribute('href') ?? (link as HTMLAnchorElement).href
  );

  for (const href of mediaLinks) {
    if (
      href &&
      (href.includes('/photo/') || href.includes('/video/') || href.includes('/status/'))
    ) {
      // photo/video 링크에서 status 링크로 변환
      let tweetUrl = href;
      if (href.includes('/photo/') || href.includes('/video/')) {
        const statusMatch = href.match(/^(.+\/status\/\d+)/);
        if (statusMatch) {
          tweetUrl = safeMatchExtractWithDefault(statusMatch, 1, href);
        }
      }

      if (tweetUrl && !isInvalidStatusUrl(tweetUrl)) {
        const fullUrl = tweetUrl.startsWith('/') ? `https://x.com${tweetUrl}` : tweetUrl;
        const result = extractTweetInfoFromUrls([fullUrl]);
        if (result && isValidTweetInfo(result)) {
          logger.debug('Tweet info extracted from media link pattern:', {
            originalHref: href,
            convertedUrl: fullUrl,
            result,
          });
          return result;
        }
      }
    }
  }

  return null;
}

/**
 * 콘텐츠 분석을 통한 트윗 정보 추출
 */
function extractFromContentAnalysis(tweetContainer: HTMLElement): TweetInfo | null {
  // DOM 구조 기반 추출
  const articles = document.querySelectorAll('article[data-testid="tweet"]');

  for (let i = 0; i < articles.length; i++) {
    const article = safeNodeListAccess(articles, i);
    if (article?.contains(tweetContainer)) {
      const urlCandidates = extractTweetUrlCandidates(article as HTMLElement);
      const result = extractTweetInfoFromUrls(urlCandidates);

      if (result && isValidTweetInfo(result)) {
        logger.debug('콘텐츠 분석으로 트윗 정보 추출 성공:', result);
        return result;
      }
    }
  }

  return null;
}

/**
 * 전역 컨텍스트에서 트윗 정보 추출
 */
function extractFromGlobalContext(): TweetInfo | null {
  // 페이지 전체에서 트윗 링크 찾기
  const allLinks = document.querySelectorAll('a[href*="/status/"]');

  for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
    const link = safeNodeListAccess(allLinks, i) as HTMLAnchorElement;
    if (link) {
      const href = link.getAttribute('href') ?? link.href;
      if (href && !isInvalidStatusUrl(href)) {
        const result = extractTweetInfoFromUrl(href);
        if (result && isValidTweetInfo(result)) {
          logger.debug('전역 컨텍스트에서 트윗 정보 추출 성공:', result);
          return result;
        }
      }
    }
  }

  return null;
}

/**
 * 미디어 링크를 트윗 정보로 변환
 */
export function convertMediaLinkToTweetInfo(href: string): TweetInfo | null {
  if (!href) return null;

  // photo/video 링크에서 status 링크로 변환
  let tweetUrl = href;
  if (href.includes('/photo/') || href.includes('/video/')) {
    const statusMatch = href.match(/^(.+\/status\/\d+)/);
    if (statusMatch) {
      tweetUrl = safeMatchExtractWithDefault(statusMatch, 1, href);
    }
  }

  // 상대 경로를 절대 경로로 변환
  const fullUrl = tweetUrl.startsWith('/') ? `https://x.com${tweetUrl}` : tweetUrl;
  const result = extractTweetInfoFromUrls([fullUrl]);
  if (result && isValidTweetInfo(result)) {
    return result;
  }
  return null;
}

/**
 * 간소화된 트윗 정보 추출 (호환성용)
 */
export function extractSimpleTweetInfo(clickedElement?: HTMLElement): TweetInfo | null {
  if (!clickedElement) {
    return extractFromCurrentUrl();
  }

  const tweetContainer =
    clickedElement.closest('[data-testid*="tweet"]') ||
    clickedElement.closest('article') ||
    clickedElement;

  return extractTweetInfoUnified(tweetContainer as HTMLElement, clickedElement);
}
