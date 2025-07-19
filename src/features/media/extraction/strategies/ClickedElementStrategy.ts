/**
 * @fileoverview 클릭된 요소에서 URL을 추출하는 전략
 * @version 2.0.0 - Extraction architecture
 */

import type {
  ExtractionContext,
  Result,
  TweetUrl,
  TweetUrlExtractionStrategy,
} from '../types/extraction.types';
import { ExtractionError, ExtractionErrorCode } from '../types/extraction.types';
import { safeParseInt } from '@core/utils/type-safety-helpers';

/**
 * 클릭된 요소에서 트윗 URL을 추출하는 전략
 * 우선순위가 가장 높은 전략으로, 사용자가 실제로 클릭한 요소에서 직접 URL을 추출합니다.
 */
export class ClickedElementStrategy implements TweetUrlExtractionStrategy {
  public readonly name = 'ClickedElementStrategy';
  public readonly priority = 1000; // 최고 우선순위

  canHandle(context: ExtractionContext): boolean {
    return !!context.clickedElement;
  }

  async extract(context: ExtractionContext): Promise<Result<TweetUrl>> {
    return this.extractTweetUrl(context);
  }

  extractTweetUrl(context: ExtractionContext): Promise<Result<TweetUrl>> {
    if (!context.clickedElement) {
      return Promise.resolve({
        success: false,
        error: new ExtractionError(
          'No clicked element provided',
          ExtractionErrorCode.INVALID_URL,
          context
        ),
      });
    }

    try {
      // 1. 클릭된 요소 자체에서 href 찾기
      const directUrl = this.extractFromElement(context.clickedElement);
      if (directUrl) {
        return Promise.resolve({ success: true, data: directUrl });
      }

      // 2. 부모 요소들을 순회하면서 링크 찾기
      const parentUrl = this.extractFromParents(context.clickedElement);
      if (parentUrl) {
        return Promise.resolve({ success: true, data: parentUrl });
      }

      // 3. 형제 요소들에서 링크 찾기
      const siblingUrl = this.extractFromSiblings(context.clickedElement);
      if (siblingUrl) {
        return Promise.resolve({ success: true, data: siblingUrl });
      }

      return Promise.resolve({
        success: false,
        error: new ExtractionError(
          'No valid tweet URL found in clicked element or its vicinity',
          ExtractionErrorCode.NO_MEDIA_FOUND,
          context
        ),
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        error: new ExtractionError(
          `Failed to extract URL from clicked element: ${error}`,
          ExtractionErrorCode.PARSE_ERROR,
          context,
          error instanceof Error ? error : new Error(String(error))
        ),
      });
    }
  }

  /**
   * 요소 자체에서 URL 추출
   */
  private extractFromElement(element: HTMLElement): TweetUrl | null {
    // 링크 요소인 경우
    if (element.tagName === 'A') {
      const { href } = element as HTMLAnchorElement;
      return this.parseUrl(href);
    }

    // data-href 속성 확인
    const dataHref = element.getAttribute('data-href');
    if (dataHref !== null && dataHref.length > 0) {
      return this.parseUrl(dataHref);
    }

    // aria-label에서 URL 패턴 찾기
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel !== null && ariaLabel.length > 0) {
      const urlMatch = ariaLabel.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        return this.parseUrl(urlMatch[0]);
      }
    }

    return null;
  }

  /**
   * 부모 요소들에서 URL 추출
   */
  private extractFromParents(element: HTMLElement): TweetUrl | null {
    let current = element.parentElement;
    let depth = 0;
    const maxDepth = 5; // 너무 멀리 올라가지 않도록 제한

    while (current && depth < maxDepth) {
      const url = this.extractFromElement(current);
      if (url) {
        return url;
      }
      current = current.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * 형제 요소들에서 URL 추출
   */
  private extractFromSiblings(element: HTMLElement): TweetUrl | null {
    const parent = element.parentElement;
    if (!parent) return null;

    const siblings = Array.from(parent.children) as HTMLElement[];
    for (const sibling of siblings) {
      if (sibling === element) continue;

      const url = this.extractFromElement(sibling);
      if (url) {
        return url;
      }
    }

    return null;
  }

  /**
   * URL 문자열을 파싱하여 TweetUrl 객체로 변환
   */
  private parseUrl(urlString: string): TweetUrl | null {
    try {
      const url = new URL(urlString);

      // X.com/Twitter URL 패턴 확인
      if (!this.isTwitterUrl(url)) {
        return null;
      }

      // 트윗 ID 추출
      const pathMatch = url.pathname.match(/\/([^/]+)\/status\/(\d+)/);
      if (!pathMatch) {
        return null;
      }

      const userId = pathMatch[1];
      const tweetId = pathMatch[2];

      if (!userId || !tweetId) {
        return null;
      }

      // 미디어 인덱스 추출 (photo/1, video/1 등)
      const mediaIndex = this.extractMediaIndex(url);

      return {
        url: urlString,
        tweetId,
        userId,
        mediaIndex,
        isValid: true,
      };
    } catch {
      return null;
    }
  }

  /**
   * Twitter/X.com URL인지 확인
   */
  private isTwitterUrl(url: URL): boolean {
    return (
      url.hostname === 'twitter.com' ||
      url.hostname === 'x.com' ||
      url.hostname === 'www.twitter.com' ||
      url.hostname === 'www.x.com'
    );
  }

  /**
   * URL에서 미디어 인덱스 추출
   */
  private extractMediaIndex(url: URL): number | undefined {
    const photoMatch = url.pathname.match(/\/photo\/(\d+)/);
    if (photoMatch?.[1]) {
      return safeParseInt(photoMatch[1], 10) - 1; // 0-based index
    }

    const videoMatch = url.pathname.match(/\/video\/(\d+)/);
    if (videoMatch?.[1]) {
      return safeParseInt(videoMatch[1], 10) - 1; // 0-based index
    }

    return undefined;
  }
}
