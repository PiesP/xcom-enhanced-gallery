/**
 * @fileoverview 미디어 추출 백업 전략
 * @description 모든 fallback 방법을 하나의 클래스로 통합
 * @version 1.0.0 - 단순화 작업
 */

import { logger } from '@shared/logging/logger';
import { MediaValidationUtils } from '@shared/utils/media/MediaValidationUtils';
import { MediaInfoBuilder } from '@shared/utils/media/MediaInfoBuilder';
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

      // 3. 데이터 속성에서 추출
      const dataResult = this.extractFromDataAttributes(tweetContainer, clickedElement, tweetInfo);
      if (dataResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + dataResult.clickedIndex;
      }
      mediaItems.push(...dataResult.items);

      // 4. 배경 이미지에서 추출
      const backgroundResult = this.extractFromBackgroundImages(
        tweetContainer,
        clickedElement,
        tweetInfo
      );
      if (backgroundResult.clickedIndex >= 0 && clickedIndex === 0) {
        clickedIndex = mediaItems.length + backgroundResult.clickedIndex;
      }
      mediaItems.push(...backgroundResult.items);

      return this.createSuccessResult(mediaItems, clickedIndex, tweetInfo);
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

      const src = img.getAttribute('src');
      if (!src || !MediaValidationUtils.isValidMediaUrl(src)) continue;

      // 클릭된 요소 확인
      if (img === clickedElement || clickedElement.contains(img) || img.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = MediaInfoBuilder.createMediaInfo(`img_${i}`, src, 'image', tweetInfo, {
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

      const mediaInfo = MediaInfoBuilder.createMediaInfo(`video_${i}`, src, 'video', tweetInfo, {
        thumbnailUrl: video.getAttribute('poster') || src,
        alt: `Video ${i + 1}`,
        fallbackSource: 'video-element',
      });

      items.push(mediaInfo);
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

      if (!url || !MediaValidationUtils.isValidMediaUrl(url)) continue;

      // 클릭된 요소 확인
      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = MediaInfoBuilder.createMediaInfo(
        `data_${i}`,
        url,
        MediaValidationUtils.detectMediaType(url),
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
    const elements = tweetContainer.querySelectorAll('*');
    const items: MediaInfo[] = [];
    let clickedIndex = -1;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      if (!element) continue;

      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;

      if (!backgroundImage || backgroundImage === 'none') continue;

      const selected = this.selectBestBackgroundImageUrl(backgroundImage);
      if (!selected || !MediaValidationUtils.isValidMediaUrl(selected.url)) continue;

      if (element === clickedElement || element.contains(clickedElement)) {
        clickedIndex = items.length;
      }

      const mediaInfo = MediaInfoBuilder.createMediaInfo(
        `bg_${i}`,
        selected.url,
        'image',
        tweetInfo,
        {
          alt: `Background Image ${i + 1}`,
          fallbackSource: 'background-image',
          additionalMetadata: {
            qualityRank: selected.qualityRank,
            qualityLabel: selected.qualityLabel,
            originalIndex: selected.index,
            candidateCount: selected.total,
            heuristic: 'bg-quality-v1',
          },
        }
      );

      items.push(mediaInfo);
    }

    return { items, clickedIndex };
  }

  /**
   * 배경 이미지에서 URL 추출
   */
  private extractUrls(backgroundImage: string): string[] {
    // url("...") 패턴 모두 추출 (data: 포함 가능) - 큰따옴표/작은따옴표 혼용 지원
    const regex = /url\((?:"([^"]+)"|'([^']+)'|([^'"()]+))\)/g;
    const urls: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(backgroundImage)) !== null) {
      const url = match[1] || match[2] || match[3];
      if (url) urls.push(url.trim());
    }
    return urls;
  }

  private selectBestBackgroundImageUrl(backgroundImage: string): {
    url: string;
    index: number;
    qualityRank: number;
    qualityLabel: string;
    total: number;
  } | null {
    const urls = this.extractUrls(backgroundImage);
    if (!urls.length) return null;

    // 품질 레이블 우선순위 맵
    const QUALITY_ORDER = ['orig', 'large', 'medium', 'small'];
    const QUALITY_SCORE: Record<string, number> = QUALITY_ORDER.reduce(
      (acc, q, idx) => {
        acc[q] = QUALITY_ORDER.length - idx; // orig 가장 높은 점수
        return acc;
      },
      {} as Record<string, number>
    );

    // 파일명에서 치수 추정 (예: IMG_1200x800, 1200x800, 2400x1600)
    const sizeRegex = /(\b|_)(\d{2,5})x(\d{2,5})(\b|_)/i;

    interface Candidate {
      url: string;
      index: number;
      qualityLabel: string;
      qualityRank: number; // 높은 값이 더 좋은 품질
      inferredPixels: number; // 크기 추정값 (w*h)
      dpr: number; // 추론된 디스플레이 배율 (1|2|3)
    }

    const candidates: Candidate[] = urls.map((u, idx) => {
      // name= 파라미터 추출
      let qualityLabel = 'unknown';
      try {
        const urlObj = new URL(u, 'https://dummy.base'); // 상대 방지용 base
        const nameParam = urlObj.searchParams.get('name');
        if (nameParam) qualityLabel = nameParam;
      } catch {
        // 상대 또는 이상한 URL - 그대로 진행
        const nameMatch = /[?&]name=([a-zA-Z0-9_-]+)/.exec(u);
        if (nameMatch) qualityLabel = nameMatch[1];
      }

      const qRank = QUALITY_SCORE[qualityLabel] ?? 0;

      // 사이즈 추정
      let inferredPixels = 0;
      const sizeMatch = sizeRegex.exec(u);
      if (sizeMatch) {
        const w = parseInt(sizeMatch[2], 10);
        const h = parseInt(sizeMatch[3], 10);
        if (!isNaN(w) && !isNaN(h)) {
          inferredPixels = w * h;
        }
      }

      // DPR 추론 (@2x, 2x, dpr=2 / 동일 3x 패턴)
      let dpr = 1;
      if (/([?&])dpr=2\b/.test(u) || /(^|[._-])2x([._-]|\.|$)/i.test(u) || /@2x\b/i.test(u)) {
        dpr = 2;
      } else if (
        /([?&])dpr=3\b/.test(u) ||
        /(^|[._-])3x([._-]|\.|$)/i.test(u) ||
        /@3x\b/i.test(u)
      ) {
        dpr = 3;
      }

      return {
        url: u,
        index: idx,
        qualityLabel,
        qualityRank: qRank,
        inferredPixels,
        dpr,
      };
    });

    // 정렬: 1) qualityRank desc 2) dpr desc 3) inferredPixels desc 4) origIndex asc (안정성)
    candidates.sort((a, b) => {
      if (b.qualityRank !== a.qualityRank) return b.qualityRank - a.qualityRank;
      if (b.dpr !== a.dpr) return b.dpr - a.dpr;
      if (b.inferredPixels !== a.inferredPixels) return b.inferredPixels - a.inferredPixels;
      return a.index - b.index;
    });

    const best = candidates[0];
    return {
      url: best.url,
      index: best.index,
      qualityRank: best.qualityRank,
      qualityLabel: best.qualityLabel,
      total: candidates.length,
    };
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
