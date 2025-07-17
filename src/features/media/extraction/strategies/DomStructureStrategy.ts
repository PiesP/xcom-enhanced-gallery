/**
 * @fileoverview DOM 구조를 분석하여 URL을 추출하는 전략
 * @version 2.0.0 - Extraction architecture
 */

import { removeDuplicates } from '@shared/utils/common/deduplication';
import type {
  ExtractionContext,
  Result,
  TweetUrl,
  TweetUrlExtractionStrategy,
} from '../types/extraction.types';
import { ExtractionError, ExtractionErrorCode } from '../types/extraction.types';

/**
 * DOM 구조를 분석하여 트윗 URL을 추출하는 전략
 * 페이지의 DOM 구조를 분석하여 트윗 링크들을 찾습니다.
 */
export class DomStructureStrategy implements TweetUrlExtractionStrategy {
  public readonly name = 'DomStructureStrategy';
  public readonly priority = 800;

  canHandle(): boolean {
    return true; // 항상 사용 가능한 fallback 전략
  }

  async extract(context: ExtractionContext): Promise<Result<TweetUrl>> {
    return this.extractTweetUrl(context);
  }

  extractTweetUrl(context: ExtractionContext): Promise<Result<TweetUrl>> {
    try {
      // 1. 현재 페이지의 모든 트윗 링크 수집
      const tweetLinks = this.collectTweetLinks();

      if (tweetLinks.length === 0) {
        return Promise.resolve({
          success: false,
          error: new ExtractionError(
            'No tweet links found in DOM structure',
            ExtractionErrorCode.NO_MEDIA_FOUND,
            context
          ),
        });
      }

      // 2. 클릭된 요소와 가장 가까운 링크 찾기
      let bestMatch: TweetUrl | null = null;

      if (context.clickedElement) {
        bestMatch = this.findClosestTweetLink(context.clickedElement, tweetLinks);
      }

      // 3. 가장 가까운 링크가 없으면 현재 URL 기반으로 추론
      bestMatch ??= this.inferFromCurrentUrl(context.currentUrl);

      // 4. 그래도 없으면 첫 번째 링크 사용
      if (bestMatch === null && tweetLinks.length > 0) {
        bestMatch = tweetLinks[0] ?? null;
      }

      if (bestMatch) {
        return Promise.resolve({ success: true, data: bestMatch });
      }

      return Promise.resolve({
        success: false,
        error: new ExtractionError(
          'Could not determine tweet URL from DOM structure',
          ExtractionErrorCode.PARSE_ERROR,
          context
        ),
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        error: new ExtractionError(
          `Failed to analyze DOM structure: ${error}`,
          ExtractionErrorCode.PARSE_ERROR,
          context,
          error instanceof Error ? error : new Error(String(error))
        ),
      });
    }
  }

  /**
   * 페이지의 모든 트윗 링크 수집
   */
  private collectTweetLinks(): TweetUrl[] {
    const links: TweetUrl[] = [];

    // 1. href 속성이 있는 모든 링크 검사
    const anchorElements = window.document.querySelectorAll('a[href]');
    for (const anchor of anchorElements) {
      const url = this.parseUrl((anchor as HTMLAnchorElement).href);
      if (url) {
        links.push(url);
      }
    }

    // 2. data-href 속성이 있는 요소들 검사
    const dataHrefElements = window.document.querySelectorAll('[data-href]');
    for (const element of dataHrefElements) {
      const href = element.getAttribute('data-href');
      if (href !== null && href.length > 0) {
        const url = this.parseUrl(href);
        if (url) {
          links.push(url);
        }
      }
    }

    // 3. URL 패턴이 있는 텍스트 검사
    const textNodes = this.findTextNodesWithUrls();
    for (const url of textNodes) {
      links.push(url);
    }

    // 중복 제거
    return this.deduplicateUrls(links);
  }

  /**
   * 클릭된 요소와 가장 가까운 트윗 링크 찾기
   */
  private findClosestTweetLink(
    clickedElement: HTMLElement,
    tweetLinks: TweetUrl[]
  ): TweetUrl | null {
    let closestLink: TweetUrl | null = null;
    let minDistance = Infinity;

    for (const tweetUrl of tweetLinks) {
      // 해당 URL을 가진 요소 찾기
      const linkElement = this.findElementByUrl(tweetUrl.url);
      if (!linkElement) continue;

      // 거리 계산
      const distance = this.calculateElementDistance(clickedElement, linkElement);
      if (distance < minDistance) {
        minDistance = distance;
        closestLink = tweetUrl;
      }
    }

    return closestLink;
  }

  /**
   * 현재 URL에서 트윗 URL 추론
   */
  private inferFromCurrentUrl(currentUrl: string): TweetUrl | null {
    try {
      const url = new URL(currentUrl);

      // 이미 트윗 페이지인 경우
      const directMatch = this.parseUrl(currentUrl);
      if (directMatch) {
        return directMatch;
      }

      // 미디어 URL 패턴에서 원본 트윗 URL 추론
      const mediaMatch = url.pathname.match(/\/([^/]+)\/status\/(\d+)\/(?:photo|video)\/\d+/);
      if (mediaMatch && mediaMatch.length >= 3) {
        const userId = mediaMatch[1];
        const tweetId = mediaMatch[2];

        if (userId != null && userId.length > 0 && tweetId != null && tweetId.length > 0) {
          return {
            url: `https://${url.hostname}/${userId}/status/${tweetId}`,
            tweetId,
            userId,
            mediaIndex: undefined,
            isValid: true,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * URL을 가진 텍스트 노드들에서 트윗 URL 찾기
   */
  private findTextNodesWithUrls(): TweetUrl[] {
    const urls: TweetUrl[] = [];
    const walker = window.document.createTreeWalker(
      window.document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent ?? '';
      const urlMatches = text.match(/https:\/\/(?:twitter\.com|x\.com)\/[^\s]+/g);

      if (urlMatches) {
        for (const urlText of urlMatches) {
          const url = this.parseUrl(urlText);
          if (url) {
            urls.push(url);
          }
        }
      }
    }

    return urls;
  }

  /**
   * URL로 해당 요소 찾기
   */
  private findElementByUrl(url: string): HTMLElement | null {
    // href 속성으로 찾기
    const anchorElement = window.document.querySelector(`a[href="${url}"]`) as HTMLElement;
    if (anchorElement) return anchorElement;

    // data-href 속성으로 찾기
    const dataHrefElement = window.document.querySelector(`[data-href="${url}"]`) as HTMLElement;
    if (dataHrefElement) return dataHrefElement;

    return null;
  }

  /**
   * 두 요소 간의 거리 계산 (DOM 트리상의 거리)
   */
  private calculateElementDistance(element1: HTMLElement, element2: HTMLElement): number {
    // 공통 조상 찾기
    const getPath = (el: HTMLElement): HTMLElement[] => {
      const path: HTMLElement[] = [];
      let current: HTMLElement | null = el;
      while (current) {
        path.push(current);
        current = current.parentElement;
      }
      return path;
    };

    const path1 = getPath(element1);
    const path2 = getPath(element2);

    // 공통 조상까지의 거리 계산
    let i = path1.length - 1;
    let j = path2.length - 1;

    while (i >= 0 && j >= 0 && path1[i] === path2[j]) {
      i--;
      j--;
    }

    return i + 1 + (j + 1); // 각각의 공통 조상까지의 거리
  }

  /**
   * URL 중복 제거
   */
  private deduplicateUrls(urls: TweetUrl[]): TweetUrl[] {
    return removeDuplicates(urls, url => `${url.userId}-${url.tweetId}`);
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

      // 미디어 인덱스 추출
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
      return parseInt(photoMatch[1], 10) - 1; // 0-based index
    }

    const videoMatch = url.pathname.match(/\/video\/(\d+)/);
    if (videoMatch?.[1]) {
      return parseInt(videoMatch[1], 10) - 1; // 0-based index
    }

    return undefined;
  }
}
