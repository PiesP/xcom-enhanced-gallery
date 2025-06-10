/**
 * Unified Tweet Information Extraction
 *
 * Centralizes all tweet information extraction logic to eliminate
 * duplication between different extraction methods.
 * Includes enhanced fallback strategies for robust extraction.
 */

import { logger } from '@infrastructure/logging/logger';
import { extractTweetInfoFromUrls, extractTweetUrlCandidates } from './url-patterns';

export interface TweetInfo {
  username: string;
  tweetId: string;
  tweetUrl: string;
}

/**
 * 통합된 트윗 정보 추출 함수
 *
 * 여러 전략을 순차적으로 시도하여 트윗 정보를 추출합니다.
 * Enhanced fallback 전략을 포함합니다.
 */
export function extractTweetInfoUnified(tweetContainer: HTMLElement): TweetInfo | null {
  const extractionStrategies = [
    () => extractFromStatusLinks(tweetContainer),
    () => extractFromTimeElement(tweetContainer),
    () => extractFromDataAttributes(tweetContainer),
    () => extractFromUrlAttributes(tweetContainer),
    () => extractFromAriaLabels(tweetContainer),
    () => extractFromCurrentUrl(),
    () => extractFromContentAnalysis(tweetContainer),
    // Enhanced fallback strategies
    () => extractFromGlobalContext(),
  ];

  for (const strategy of extractionStrategies) {
    try {
      const result = strategy();
      if (result && isValidTweetInfo(result)) {
        logger.debug('Tweet info extracted successfully:', result);
        return result;
      }
    } catch (error) {
      logger.debug('Extraction strategy failed:', error);
      // Continue to next strategy
    }
  }

  // Last resort: synthetic tweet info
  logger.warn('All tweet extraction strategies failed, generating synthetic info');
  return generateSyntheticTweetInfo();
}

/**
 * 상태 링크에서 트윗 정보 추출
 */
function extractFromStatusLinks(tweetContainer: HTMLElement): TweetInfo | null {
  const links = tweetContainer.querySelectorAll('a[href*="/status/"]');

  for (const link of links) {
    const href = (link as HTMLAnchorElement).href;
    const urlCandidates = [href];
    const result = extractTweetInfoFromUrls(urlCandidates);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * time 요소에서 트윗 정보 추출
 */
function extractFromTimeElement(tweetContainer: HTMLElement): TweetInfo | null {
  const timeElement = tweetContainer.querySelector('time');
  if (!timeElement) {
    return null;
  }

  const parentLink = timeElement.closest('a[href*="/status/"]') as HTMLAnchorElement;
  if (!parentLink) {
    return null;
  }

  const urlCandidates = [parentLink.href];
  return extractTweetInfoFromUrls(urlCandidates);
}

/**
 * data 속성에서 트윗 정보 추출
 */
function extractFromDataAttributes(tweetContainer: HTMLElement): TweetInfo | null {
  const testIds = ['tweet', 'cellInnerDiv'];

  for (const testId of testIds) {
    const element = tweetContainer.querySelector(`[data-testid="${testId}"]`);
    if (element) {
      const urlCandidates = extractTweetUrlCandidates(element as HTMLElement);
      const result = extractTweetInfoFromUrls(urlCandidates);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * URL 속성에서 트윗 정보 추출
 */
function extractFromUrlAttributes(tweetContainer: HTMLElement): TweetInfo | null {
  const urlCandidates = extractTweetUrlCandidates(tweetContainer);
  return extractTweetInfoFromUrls(urlCandidates);
}

/**
 * aria-label에서 트윗 정보 추출
 */
function extractFromAriaLabels(tweetContainer: HTMLElement): TweetInfo | null {
  const ariaElements = tweetContainer.querySelectorAll('[aria-label*="@"]');

  for (const element of ariaElements) {
    const ariaLabel = element.getAttribute('aria-label');
    if (!ariaLabel) {
      continue;
    }

    const usernameMatch = ariaLabel.match(/@([a-zA-Z0-9_]+)/);
    if (!usernameMatch) {
      continue;
    }

    const username = usernameMatch[1];
    if (!username) {
      continue;
    }

    // Try to find status ID in the same context
    const urlCandidates = extractTweetUrlCandidates(tweetContainer);
    const tweetInfoFromUrls = extractTweetInfoFromUrls(urlCandidates);

    if (tweetInfoFromUrls && tweetInfoFromUrls.username === username) {
      return tweetInfoFromUrls;
    }
  }

  return null;
}

/**
 * 현재 URL에서 트윗 정보 추출
 */
function extractFromCurrentUrl(): TweetInfo | null {
  const currentUrl = window.location.href;
  const urlCandidates = [currentUrl];
  return extractTweetInfoFromUrls(urlCandidates);
}

/**
 * 콘텐츠 분석을 통한 트윗 정보 추출
 */
function extractFromContentAnalysis(tweetContainer: HTMLElement): TweetInfo | null {
  try {
    // 텍스트 콘텐츠에서 사용자명 패턴 찾기
    const textContent = tweetContainer.textContent ?? '';
    const usernameMatch = textContent.match(/@([a-zA-Z0-9_]+)/);

    if (!usernameMatch) {
      return null;
    }

    const username = usernameMatch[1];
    if (!username) {
      return null;
    }

    // 상위 요소에서 상태 ID 찾기
    const parentElement = tweetContainer.closest('[data-testid*="tweet"], article');
    if (!parentElement) {
      return null;
    }

    const urlCandidates = extractTweetUrlCandidates(parentElement as HTMLElement);
    const tweetInfoFromUrls = extractTweetInfoFromUrls(urlCandidates);

    if (tweetInfoFromUrls) {
      return tweetInfoFromUrls;
    }

    // 마지막 시도: 타임스탬프 기반 ID 생성
    const timeElement = tweetContainer.querySelector('time');
    if (timeElement) {
      const datetime = timeElement.getAttribute('datetime');
      if (datetime) {
        const timestamp = new Date(datetime).getTime();
        const syntheticId = Math.floor(timestamp / 1000).toString();
        const tweetUrl = `https://x.com/${username}/status/${syntheticId}`;

        return { username, tweetId: syntheticId, tweetUrl };
      }
    }
  } catch (error) {
    logger.debug('Content analysis failed:', error);
  }

  return null;
}

/**
 * Global context에서 트윗 정보 추출 (Enhanced strategy)
 */
function extractFromGlobalContext(): TweetInfo | null {
  try {
    // Check React Fiber data
    const reactInstances = document.querySelectorAll('[data-reactroot] *, [data-react-checksum] *');
    for (const instance of reactInstances) {
      const reactProps = getReactProps(instance);
      if (reactProps && typeof reactProps === 'object' && 'children' in reactProps) {
        const props = reactProps as {
          children?: {
            props?: {
              tweet?: {
                user?: { screen_name?: string };
                id_str?: string;
              };
            };
          };
        };

        const tweetData = props.children?.props?.tweet;
        if (
          tweetData?.user?.screen_name &&
          tweetData.id_str &&
          typeof tweetData.user.screen_name === 'string' &&
          typeof tweetData.id_str === 'string'
        ) {
          return {
            username: tweetData.user.screen_name,
            tweetId: tweetData.id_str,
            tweetUrl: `https://x.com/${tweetData.user.screen_name}/status/${tweetData.id_str}`,
          };
        }
      }
    }

    // Check window global objects that might contain tweet data
    const globalKeys = ['__INITIAL_STATE__', '__NEXT_DATA__', 'YTInitialData'];
    for (const key of globalKeys) {
      try {
        const globalData = (window as unknown as Record<string, unknown>)[key];
        if (globalData && typeof globalData === 'object') {
          const tweetInfo = extractFromGlobalObject(globalData);
          if (tweetInfo) {
            return tweetInfo;
          }
        }
      } catch {
        // Ignore errors from global object access
      }
    }
  } catch (error) {
    logger.debug('Global context extraction failed:', error);
  }
  return null;
}

/**
 * Get React props from a DOM element
 */
function getReactProps(element: Element): unknown {
  try {
    for (const key in element) {
      if (key.startsWith('__reactInternalInstance')) {
        return (element as unknown as Record<string, unknown>)[key];
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Extract tweet info from global object
 */
function extractFromGlobalObject(obj: unknown): TweetInfo | null {
  try {
    if (typeof obj !== 'object' || obj === null) {
      return null;
    }

    const objRecord = obj as Record<string, unknown>;

    // Recursively search for tweet-like objects
    const searchKeys = ['tweet', 'status', 'legacy', 'core', 'user_results'];
    for (const key of searchKeys) {
      if (objRecord[key]) {
        const result = extractFromGlobalObject(objRecord[key]);
        if (result) {
          return result;
        }
      }
    }

    // Check if this object looks like tweet data
    if (
      'screen_name' in objRecord &&
      'id_str' in objRecord &&
      typeof objRecord.screen_name === 'string' &&
      typeof objRecord.id_str === 'string'
    ) {
      return {
        username: objRecord.screen_name,
        tweetId: objRecord.id_str,
        tweetUrl: `https://x.com/${objRecord.screen_name}/status/${objRecord.id_str}`,
      };
    }

    if (
      'user' in objRecord &&
      'id_str' in objRecord &&
      typeof objRecord.user === 'object' &&
      objRecord.user !== null &&
      'screen_name' in objRecord.user &&
      typeof (objRecord.user as Record<string, unknown>).screen_name === 'string' &&
      typeof objRecord.id_str === 'string'
    ) {
      const user = objRecord.user as Record<string, unknown>;
      return {
        username: user.screen_name as string,
        tweetId: objRecord.id_str,
        tweetUrl: `https://x.com/${user.screen_name}/status/${objRecord.id_str}`,
      };
    }

    // Search array values
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = extractFromGlobalObject(item);
        if (result) {
          return result;
        }
      }
    }
  } catch {
    // Ignore errors during deep object traversal
  }
  return null;
}

/**
 * Generate synthetic tweet info as last resort
 */
function generateSyntheticTweetInfo(): TweetInfo {
  const syntheticId = Math.floor(Date.now() / 1000).toString();
  const username = 'unknown_user';
  return {
    username,
    tweetId: syntheticId,
    tweetUrl: `https://x.com/${username}/status/${syntheticId}`,
  };
}

/**
 * 트윗 정보 유효성 검증
 */
function isValidTweetInfo(tweetInfo: TweetInfo): boolean {
  return !!(
    tweetInfo?.username &&
    tweetInfo?.tweetId &&
    tweetInfo?.tweetUrl &&
    tweetInfo.username !== 'i' &&
    tweetInfo.tweetId.match(/^\d+$/)
  );
}
