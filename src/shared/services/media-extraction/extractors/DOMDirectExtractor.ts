/**
 * @fileoverview DOM 추출기 (백업 전략용)
 * @description 기본적인 DOM 파싱을 수행하는 백업 추출기
 * @version 3.0.0 - Clean Architecture
 */

import { logger } from '@shared/logging/logger';
import type { MediaExtractionOptions, TweetInfo } from '@shared/types/media.types';
import type { MediaExtractionResult, MediaInfo } from '@shared/types/media.types';

/**
 * DOM 추출기 (백업 전략용)
 * 기본적인 DOM 파싱 수행
 */
export class DOMDirectExtractor {
  /**
   * DOM에서 직접 미디어 추출
   */
  async extract(
    element: HTMLElement,
    _options: MediaExtractionOptions,
    extractionId: string,
    tweetInfo?: TweetInfo
  ): Promise<MediaExtractionResult> {
    logger.debug(`[DOMDirectExtractor] ${extractionId}: DOM 직접 추출 시작`);

    const container = this.findMediaContainer(element);
    if (!container) {
      return this.createFailureResult('컨테이너를 찾을 수 없음');
    }

    // 1차 시도
    let mediaItems = this.extractMediaFromContainer(container, tweetInfo);
    let clickedIndex = this.findClickedIndex(element, mediaItems);

    // Phase 11: micro-retry (lazy data-src -> src 전환 / 지연된 background-image 적용) - 단 1회
    if (mediaItems.length === 0 && this.shouldMicroRetry(container)) {
      await this.waitNextFrame();
      mediaItems = this.extractMediaFromContainer(container, tweetInfo, true);
      clickedIndex = this.findClickedIndex(element, mediaItems);
    }

    if (mediaItems.length === 0) {
      return this.createFailureResult('미디어를 찾을 수 없음');
    }

    logger.info(
      `[DOMDirectExtractor] ${extractionId}: ✅ DOM 추출 성공 - ${mediaItems.length}개 미디어`
    );

    return {
      success: true,
      mediaItems,
      clickedIndex,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-fallback',
      },
      tweetInfo: tweetInfo ?? null,
    };
  }

  /**
   * 미디어 컨테이너 찾기 (단순화된 로직)
   */
  private findMediaContainer(element: HTMLElement): HTMLElement | null {
    const selectors = ['[data-testid*="tweet"]', '[role="article"]', '.tweet', 'article'];

    for (const selector of selectors) {
      const container = element.closest(selector);
      if (container) return container as HTMLElement;
    }

    // 컨테이너를 찾지 못하면 요소 자체 반환
    return element;
  }

  /**
   * 컨테이너에서 미디어 추출
   */
  private extractMediaFromContainer(
    container: HTMLElement,
    tweetInfo?: TweetInfo,
    isRetry = false
  ): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];
    const seen = new Set<string>();

    const pushImage = (url: string) => {
      if (!url) return;
      if (!this.isValidImageUrl(url)) return;
      const originalUrl = this.getOriginalImageUrl(url);
      const key = `img|${originalUrl}`;
      if (seen.has(key)) return;
      seen.add(key);
      mediaItems.push(this.createImageMediaInfo(originalUrl, mediaItems.length, tweetInfo));
    };

    const pushVideo = (url: string) => {
      if (!url) return;
      if (!url.includes('video.twimg.com')) return;
      const key = `vid|${url}`;
      if (seen.has(key)) return;
      seen.add(key);
      mediaItems.push(this.createVideoMediaInfo(url, mediaItems.length, tweetInfo));
    };

    // 1) 기본 img + lazy data-src (retry 시 src가 채워졌을 가능성)
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      const el = img as HTMLImageElement;
      const src = el.getAttribute('src') || '';
      const dataSrc = el.getAttribute('data-src') || el.getAttribute('data-image-url') || '';
      // 우선 순위: src > data-src
      const candidate = src || (isRetry ? dataSrc : ''); // 첫 패스에서는 data-src 무시 (lazy), retry 시 반영
      if (candidate.includes('pbs.twimg.com')) pushImage(candidate);
    });

    // 2) picture > source (srcset 또는 src)
    const pictureSources = container.querySelectorAll(
      'picture source[srcset], picture source[src]'
    );
    pictureSources.forEach(source => {
      const el = source as HTMLSourceElement;
      const raw = el.getAttribute('srcset') || el.getAttribute('src') || '';
      // srcset인 경우 첫 URL만 사용 (공백 구분)
      const firstUrl = raw.split(/\s+/)[0] || '';
      if (firstUrl.includes('pbs.twimg.com')) pushImage(firstUrl);
    });

    // 3) data-image-url 속성
    const dataAttrElems = container.querySelectorAll('[data-image-url]');
    dataAttrElems.forEach(elem => {
      const url = (elem as HTMLElement).getAttribute('data-image-url') || '';
      if (url.includes('pbs.twimg.com')) pushImage(url);
    });

    // 4) background-image 스타일 (inline) - 다중 url() 지원
    const bgElems = container.querySelectorAll<HTMLElement>('[style*="background-image"]');
    bgElems.forEach(elem => {
      const bg = elem.style.backgroundImage; // 예: url("a"), url("b")
      if (!bg) return;
      const urls: string[] = [];
      const regex = /url\(["']?(.*?)["']?\)/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(bg)) !== null) {
        if (m[1]) urls.push(m[1]);
      }
      if (urls.length > 0) {
        const selected = this.selectBestBackgroundImageUrl(urls);
        if (selected?.includes('pbs.twimg.com')) {
          pushImage(selected);
        }
      }
    });

    // 5) video[src]
    const videos = container.querySelectorAll('video[src*="video.twimg.com"]');
    videos.forEach(video => pushVideo((video as HTMLVideoElement).src));

    // 6) video > source (src, srcset)
    const videoSources = container.querySelectorAll('video source[src], video source[srcset]');
    videoSources.forEach(source => {
      const el = source as HTMLSourceElement;
      const url = el.getAttribute('src') || (el.getAttribute('srcset') || '').split(/\s+/)[0] || '';
      if (url.includes('video.twimg.com')) pushVideo(url);
    });

    return mediaItems;
  }

  /**
   * background-image 다중 URL 중 가장 고품질 후보 선택 (Phase 11 개선)
   * 휴리스틱:
   * 1) name=orig 포함
   * 2) 파일명에 'large' | 'big' | 'orig' 포함
   * 3) 그 외에는 마지막 URL (일반적으로 가장 고해상도)
   */
  private selectBestBackgroundImageUrl(urls: string[]): string | undefined {
    if (urls.length === 0) return undefined;
    // Phase 11 advanced: WxH 해상도 패턴 및 name 파라미터/파일명 기반 종합 스코어
    // 추가 목표: 기존 점수 동률 시 더 큰 면적(W*H) 우선, 그래도 동률이면 원본 인덱스 안정성
    interface Candidate {
      url: string;
      score: number;
      pixels: number;
      index: number;
    }
    const sizeRegex = /(?:^|_|\b)(\d{2,5})x(\d{2,5})(?:\b|_|\.|$)/i;
    // v2: 저해상도/축소 힌트 단어 패널티 (small, thumb, tiny, crop, fit, medium)
    const downgradeRegex = /(^|[._-])(small|thumb|tiny|crop|fit|medium)([._-]|\.|$)/i;
    const baseScore = (u: string): number => {
      let s = 0;
      if (/name=orig/.test(u)) s += 50; // 원본 가중치 강화
      if (/(^|[._-])(orig)([._-]|\.|$)/.test(u)) s += 30;
      if (/name=large/.test(u)) s += 20;
      if (/(^|[._-])(large|big)([._-]|\.|$)/.test(u)) s += 10;
      if (/\b(2048|4096)\b/.test(u)) s += 5;
      if (downgradeRegex.test(u)) s -= 15; // v2 패널티
      return s;
    };
    const candidates: Candidate[] = urls.map((u, idx) => {
      let pixels = 0;
      const m = sizeRegex.exec(u);
      if (m) {
        const w = parseInt(m[1]!, 10);
        const h = parseInt(m[2]!, 10);
        if (!isNaN(w) && !isNaN(h)) {
          pixels = w * h;
        }
      }
      return { url: u, score: baseScore(u), pixels, index: idx };
    });
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.pixels !== a.pixels) return b.pixels - a.pixels; // 더 큰 해상도 우선
      return a.index - b.index; // 안정성
    });
    return candidates[0]?.url;
  }

  /**
   * micro-retry 필요 여부 판단: lazy data-src 존재 또는 background-image 스타일 지연 가능성
   */
  private shouldMicroRetry(container: HTMLElement): boolean {
    // data-src 있는 img 존재하지만 src 미존재
    const lazyImg = container.querySelector('img[data-src]:not([src])');
    if (lazyImg) return true;
    // background-image 스타일 요소가 있지만 아직 다른 미디어 없음
    const bg = container.querySelector('[style*="background-image"]');
    if (bg) return true;
    return false;
  }

  /**
   * rAF 혹은 0ms 타이머 대기 (환경에 따라)
   */
  private waitNextFrame(): Promise<void> {
    return new Promise(resolve => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * 이미지 MediaInfo 생성
   */
  private createImageMediaInfo(url: string, index: number, tweetInfo?: TweetInfo): MediaInfo {
    return {
      id: `img_${Date.now()}_${index}`,
      url,
      type: 'image',
      originalUrl: url,
      filename: this.generateFilename('image', index, tweetInfo),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
    };
  }

  /**
   * 비디오 MediaInfo 생성
   */
  private createVideoMediaInfo(url: string, index: number, tweetInfo?: TweetInfo): MediaInfo {
    return {
      id: `vid_${Date.now()}_${index}`,
      url,
      type: 'video',
      originalUrl: url,
      filename: this.generateFilename('video', index, tweetInfo),
      thumbnailUrl: this.generateVideoThumbnail(url),
      tweetId: tweetInfo?.tweetId,
      tweetUsername: tweetInfo?.username,
    };
  }

  /**
   * 파일명 생성
   */
  private generateFilename(type: string, index: number, tweetInfo?: TweetInfo): string {
    const extension = type === 'image' ? 'jpg' : 'mp4';
    const prefix = tweetInfo?.username ? `${tweetInfo.username}_` : '';
    const tweetSuffix = tweetInfo?.tweetId ? `_${tweetInfo.tweetId}` : '';
    return `${prefix}media_${index + 1}${tweetSuffix}.${extension}`;
  }

  /**
   * 비디오 썸네일 생성
   */
  private generateVideoThumbnail(videoUrl: string): string {
    return videoUrl.replace(/\.mp4.*$/, '.jpg');
  }

  /**
   * 원본 이미지 URL 생성
   */
  private getOriginalImageUrl(url: string): string {
    // format=jpg&name=orig로 변경하여 원본 이미지 URL 생성
    return url.replace(/format=\w+&name=\w+/, 'format=jpg&name=orig');
  }

  /**
   * 유효한 이미지 URL 검사
   */
  private isValidImageUrl(url: string): boolean {
    return (
      url.startsWith('http') && url.includes('pbs.twimg.com') && !url.includes('profile_images')
    );
  }

  /**
   * 클릭된 미디어 인덱스 찾기
   */
  private findClickedIndex(clickedElement: HTMLElement, mediaItems: MediaInfo[]): number {
    if (clickedElement.tagName === 'IMG') {
      const imgSrc = (clickedElement as HTMLImageElement).src;
      const index = mediaItems.findIndex(
        item => item.url.includes(imgSrc.split('?')[0]!) || imgSrc.includes(item.url.split('?')[0]!)
      );
      return Math.max(0, index);
    }

    if (clickedElement.tagName === 'VIDEO') {
      const videoSrc = (clickedElement as HTMLVideoElement).src;
      const index = mediaItems.findIndex(item => item.url.includes(videoSrc));
      return Math.max(0, index);
    }

    // 기본적으로 첫 번째 미디어 반환
    return 0;
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(reason: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'dom-direct',
        strategy: 'dom-fallback-failed',
        error: reason,
      },
      tweetInfo: null,
    };
  }
}
