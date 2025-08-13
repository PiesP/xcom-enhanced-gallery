/**
 * @fileoverview 미디어 추출 백업 전략
 * @description 모든 fallback 방법을 하나의 클래스로 통합
 * @version 1.0.0 - 단순화 작업
 */

import { logger } from '@shared/logging';
import { parseUsernameFast } from '@shared/services/media/UsernameExtractionService';
import type { MediaInfo, MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, FallbackExtractionStrategy } from '@shared/types/media.types';

/**
 * 백업 추출 전략
 * 이미지, 비디오, 데이터 속성, 배경 이미지 추출을 모두 처리
 */
export class FallbackStrategy implements FallbackExtractionStrategy {
  readonly name = 'fallback';

  async extract(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    try {
      const mediaItems: MediaInfo[] = [];
      let clickedIndex = 0;

      // 1. 이미지 요소에서 추출
      const imageResult = this.extractFromImages(tweetContainer, clickedElement, tweetInfo);
      if (imageResult.clickedIndex >= 0) {
        clickedIndex = mediaItems.length + imageResult.clickedIndex;
      }
      mediaItems.push(...imageResult.items);

      // 2. 비디오 요소에서 추출
      const videoResult = this.extractFromVideos(tweetContainer, clickedElement, tweetInfo);
      if (videoResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + videoResult.clickedIndex;
      }
      mediaItems.push(...videoResult.items);

      // 3. 앵커 href에서 추출 (직접 미디어 링크)
      const anchorResult = this.extractFromAnchors(tweetContainer, clickedElement, tweetInfo);
      if (anchorResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + anchorResult.clickedIndex;
      }
      mediaItems.push(...anchorResult.items);

      // 4. 데이터 속성에서 추출
      const dataResult = this.extractFromDataAttributes(tweetContainer, clickedElement, tweetInfo);
      if (dataResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + dataResult.clickedIndex;
      }
      mediaItems.push(...dataResult.items);

      // 5. 배경 이미지에서 추출
      const backgroundResult = this.extractFromBackgroundImages(
        tweetContainer,
        clickedElement,
        tweetInfo
      );
      if (backgroundResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + backgroundResult.clickedIndex;
      }
      mediaItems.push(...backgroundResult.items);

      // 6. 중복 제거 및 URL 정규화 (pbs.twimg.com -> name=orig)
      const deduped: MediaInfo[] = [];
      const seen = new Set<string>();
      for (const item of mediaItems) {
        const normalized = this.upgradeTwitterImageUrl(item.url);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          deduped.push({ ...item, url: normalized });
        }
      }

      return this.createSuccessResult(deduped, clickedIndex, tweetInfo);
    } catch (error) {
      logger.error('[FallbackStrategy] 추출 오류:', error);
      return this.createFailureResult(
        error instanceof Error ? error.message : 'Unknown error',
        tweetInfo
      );
    }
  }

  /**
   * 이미지 요소에서 미디어 추출
   */
  private extractFromImages(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const images = tweetContainer.querySelectorAll('img');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img) continue;

      // srcset이 있으면 가장 큰 width 선택
      const srcset = img.getAttribute('srcset') || '';
      let chosen: string | null = null;
      if (srcset) {
        const largest = this.pickLargestFromSrcset(srcset);
        if (largest) chosen = largest;
      }
      const src = chosen || img.getAttribute('src');
      if (!src || !this.isValidMediaUrl(src)) continue;

      // 클릭된 요소 확인
      if (img === clickedElement || clickedElement.contains(img) || img.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`img_${i}`, src, 'image', tweetInfo, {
        alt: img.getAttribute('alt') || `Image ${i + 1}`,
        fallbackSource: 'img-element',
      });

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 비디오 요소에서 미디어 추출
   */
  private extractFromVideos(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const videos = tweetContainer.querySelectorAll('video');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      if (!video) continue;

      // <source> 요소들 우선 수집 (mp4 타입 우선)
      const sources = Array.from(video.querySelectorAll('source')) as HTMLSourceElement[];
      const mp4Sources = sources.filter(s => (s.getAttribute('type') || '').includes('mp4'));
      for (const s of mp4Sources) {
        const sUrl = s.getAttribute('src');
        if (sUrl && this.isValidMediaUrl(sUrl)) {
          if (
            video === clickedElement ||
            clickedElement.contains(video) ||
            video.contains(clickedElement)
          ) {
            if (clickedIndex < 0) clickedIndex = items.length;
          }
          items.push(
            this.createMediaInfo(`video_${i}_source`, sUrl, 'video', tweetInfo, {
              thumbnailUrl: video.getAttribute('poster') || sUrl,
              alt: `Video ${i + 1}`,
              fallbackSource: 'video-source',
            })
          );
        }
      }

      const src = video.getAttribute('src') || video.getAttribute('poster');
      if (!src) continue;

      // 클릭된 요소 확인
      if (
        video === clickedElement ||
        clickedElement.contains(video) ||
        video.contains(clickedElement)
      ) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`video_${i}`, src, 'video', tweetInfo, {
        thumbnailUrl: video.getAttribute('poster') || src,
        alt: `Video ${i + 1}`,
        fallbackSource: 'video-element',
      });

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 앵커 요소에서 미디어 추출 (href 직접 링크)
   */
  private extractFromAnchors(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const anchors = tweetContainer.querySelectorAll('a[href]');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i] as HTMLAnchorElement;
      const href = a.getAttribute('href');
      if (!href || !this.isValidMediaUrl(href)) continue;

      if (a === clickedElement || a.contains(clickedElement) || clickedElement.contains(a)) {
        clickedIndex = items.length;
      }

      items.push(
        this.createMediaInfo(`a_${i}`, href, this.detectMediaType(href), tweetInfo, {
          alt: `Link Media ${i + 1}`,
          fallbackSource: 'anchor-href',
        })
      );
    }

    return { items, clickedIndex };
  }

  /**
   * 데이터 속성에서 미디어 추출
   */
  private extractFromDataAttributes(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    const elementsWithData = tweetContainer.querySelectorAll(
      '[data-src], [data-background-image], [data-url]'
    );
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < elementsWithData.length; i++) {
      const element = elementsWithData[i];
      if (!element) continue;

      const dataSrc = element.getAttribute('data-src');
      const dataBg = element.getAttribute('data-background-image');
      const dataUrl = element.getAttribute('data-url');
      const url = dataSrc || dataBg || dataUrl;

      if (!url || !this.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(
        `data_${i}`,
        url,
        this.detectMediaType(url),
        tweetInfo,
        {
          alt: `Data Media ${i + 1}`,
          fallbackSource: 'data-attribute',
        }
      );

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 배경 이미지에서 미디어 추출
   */
  private extractFromBackgroundImages(
    tweetContainer: HTMLElement,
    clickedElement: HTMLElement,
    tweetInfo?: TweetInfo
  ): { items: MediaInfo[]; clickedIndex: number } {
    // 성능을 위해 inline style로 background-image가 지정된 요소만 탐색
    const elements = tweetContainer.querySelectorAll('[style*="background-image"]');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      if (!element) continue;
      // inline style만 확인 (대규모 DOM에서의 성능 이슈 방지)
      const inlineStyle = element.getAttribute('style') || '';
      const inlineMatch = inlineStyle.match(/background-image\s*:\s*([^;]+)/i);
      const backgroundImage = inlineMatch ? (inlineMatch[1] ?? '') : '';

      if (!backgroundImage || backgroundImage === 'none') continue;

      const url = this.extractUrlFromBackgroundImage(backgroundImage);
      if (!url || !this.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = this.createMediaInfo(`bg_${i}`, url, 'image', tweetInfo, {
        alt: `Background Image ${i + 1}`,
        fallbackSource: 'background-image',
      });

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * MediaInfo 객체 생성
   */
  private createMediaInfo(
    id: string,
    url: string,
    type: 'image' | 'video',
    tweetInfo?: TweetInfo,
    options: {
      thumbnailUrl?: string;
      alt?: string;
      fallbackSource?: string;
    } = {}
  ): MediaInfo {
    return {
      id,
      url,
      type,
      filename: '',
      tweetUsername: tweetInfo?.username || parseUsernameFast() || '',
      tweetId: tweetInfo?.tweetId || '',
      tweetUrl: tweetInfo?.tweetUrl || '',
      originalUrl: url,
      thumbnailUrl: options.thumbnailUrl || url,
      alt: options.alt || `${type} item`,
      metadata: {
        fallbackSource: options.fallbackSource || this.name,
      },
    };
  }

  /**
   * URL 검증
   */
  private isValidMediaUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    if (!/^https?:\/\//i.test(url)) return false;
    if (url.includes('profile_images')) return false;
    const isTwimg = /(?:^|\.)twimg\.com\//i.test(url);
    const hasExt = /(\.(jpg|jpeg|png|webp|gif|mp4|mov|m4v|webm|m3u8))(\?|#|$)/i.test(url);
    return isTwimg || hasExt;
  }

  /**
   * 미디어 타입 감지
   */
  private detectMediaType(url: string): 'image' | 'video' {
    return url.includes('video') || url.includes('.mp4') || url.includes('.webm')
      ? 'video'
      : 'image';
  }

  /**
   * 배경 이미지에서 URL 추출
   */
  private extractUrlFromBackgroundImage(backgroundImage: string): string | null {
    const match = backgroundImage.match(/url\(['"]?([^"']+)['"]?\)/);
    return match ? (match[1] ?? null) : null;
  }

  /** srcset에서 가장 큰 width 선택 */
  private pickLargestFromSrcset(srcset: string): string | null {
    const parts = srcset
      .split(',')
      .map(s => s.trim())
      .map(entry => {
        const m = entry.match(/^(\S+)\s+(\d+)w$/);
        if (!m) return null;
        return { url: m[1] as string, w: Number(m[2]) };
      })
      .filter(Boolean) as Array<{ url: string; w: number }>;
    if (parts.length === 0) return null;
    parts.sort((a, b) => b.w - a.w);
    return parts[0]!.url;
  }

  /** pbs.twimg.com 이미지 name 파라미터를 orig로 승격 */
  private upgradeTwitterImageUrl(url: string): string {
    try {
      const u = new URL(
        url,
        typeof window !== 'undefined' ? window.location.href : 'https://x.com/'
      );
      if (/pbs\.twimg\.com$/i.test(u.hostname)) {
        u.searchParams.set('name', 'orig');
        return u.toString();
      }
      return u.toString();
    } catch {
      if (url.includes('pbs.twimg.com')) {
        // Fallback: try to use a basic URL pattern manipulation safely
        const hasQuery = url.includes('?');
        const replaced = url.replace(/([?&])name=[^&]*/i, '$1name=orig');
        if (replaced !== url) return replaced;
        return `${url}${hasQuery ? '&' : '?'}name=orig`;
      }
      return url;
    }
  }

  /**
   * 성공 결과 생성
   */
  private createSuccessResult(
    mediaItems: MediaInfo[],
    clickedIndex: number,
    tweetInfo?: TweetInfo
  ): MediaExtractionResult {
    return {
      success: mediaItems.length > 0,
      mediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'fallback',
        strategy: this.name,
      },
      tweetInfo: tweetInfo ?? null,
    };
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(error: string, tweetInfo?: TweetInfo): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'fallback',
        strategy: `${this.name}-failed`,
        error,
      },
      tweetInfo: tweetInfo ?? null,
    };
  }
}
