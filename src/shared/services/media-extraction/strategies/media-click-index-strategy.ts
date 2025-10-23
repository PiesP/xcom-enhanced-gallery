/**
 * @fileoverview 클릭된 미디어 인덱스 계산을 위한 Strategy 패턴
 * @description 다양한 매칭 전략을 캡슐화하여 유지보수성 및 확장성 향상
 * @version 1.0.0
 */

import type { TweetMediaEntry } from '../../media/twitter-video-extractor';
import type { MediaInfo } from '@shared/types/media.types';

/**
 * 클릭된 미디어 인덱스 계산 전략 인터페이스
 */
export interface MediaClickIndexStrategy {
  /**
   * 주어진 매개변수로 미디어 인덱스 계산 시도
   * @returns 계산된 인덱스 (0-based), 실패 시 -1
   */
  calculate(
    clickedElement: HTMLElement,
    apiMedias: TweetMediaEntry[],
    mediaItems: MediaInfo[]
  ): number | Promise<number>;

  /**
   * 이 전략의 신뢰도 등급 (1-100)
   */
  readonly confidence: number;

  /**
   * 전략 이름 (로깅/디버깅용)
   */
  readonly name: string;
}

/**
 * 직접 미디어 URL 매칭 전략 (신뢰도 99%+)
 *
 * 클릭된 미디어 요소의 URL을 추출하여 API 미디어와 1:1 비교
 * - 정확한 URL 비교
 * - 파일명 기반 비교 (정규화)
 * - 쿼리스트링 무시
 */
export class DirectMediaMatchingStrategy implements MediaClickIndexStrategy {
  readonly name = 'DirectMediaMatching';
  readonly confidence = 99;

  constructor(
    private readonly findMediaElement: (el: HTMLElement) => HTMLElement | null,
    private readonly extractMediaUrl: (el: HTMLElement) => string,
    private readonly normalizeMediaUrl: (url: string) => string | null
  ) {}

  calculate(
    clickedElement: HTMLElement,
    apiMedias: TweetMediaEntry[],
    _mediaItems: MediaInfo[]
  ): number {
    // 1. 미디어 요소 찾기
    const mediaElement = this.findMediaElement(clickedElement);
    if (!mediaElement) {
      return -1;
    }

    // 2. URL 추출
    const clickedUrl = this.extractMediaUrl(mediaElement);
    if (!clickedUrl) {
      return -1;
    }

    // 3. 정확한 URL 비교
    for (let i = 0; i < apiMedias.length; i++) {
      const media = apiMedias[i];
      if (!media) continue;

      if (media.download_url === clickedUrl || media.preview_url === clickedUrl) {
        return i;
      }
    }

    // 4. 파일명 기반 비교 (쿼리스트링 무시)
    const clickedFilename = this.normalizeMediaUrl(clickedUrl);
    if (!clickedFilename) return -1;

    for (let i = 0; i < apiMedias.length; i++) {
      const media = apiMedias[i];
      if (!media) continue;

      const apiFilename = this.normalizeMediaUrl(media.download_url);
      if (apiFilename && clickedFilename === apiFilename) {
        return i;
      }
    }

    return -1;
  }
}

/**
 * DOM 순서 기반 추정 전략 (신뢰도 80-90%)
 *
 * 클릭된 요소가 속한 트윗 컨테이너 내 미디어 요소들의 DOM 순서로 추정
 * - 직접 매칭 실패 시 폴백
 * - 한정된 스코프 내에서만 계산 (성능 최적화)
 */
export class DOMOrderEstimationStrategy implements MediaClickIndexStrategy {
  readonly name = 'DOMOrderEstimation';
  readonly confidence = 85;

  constructor(
    private readonly findMediaElementsInContainer: (container: HTMLElement) => HTMLElement[],
    private readonly isDirectMediaChild: (parent: HTMLElement, child: HTMLElement) => boolean
  ) {}

  calculate(
    clickedElement: HTMLElement,
    _apiMedias: TweetMediaEntry[],
    mediaItems: MediaInfo[]
  ): number {
    const maxIndex = mediaItems.length - 1;

    // 1. 클릭된 요소가 이미 미디어라면 형제 관계 확인
    const parentElement = clickedElement.parentElement;
    if (!parentElement) return -1;

    const mediaElements = this.findMediaElementsInContainer(parentElement);
    const clickedMediaIndex = mediaElements.indexOf(clickedElement);
    if (clickedMediaIndex !== -1) {
      return Math.min(clickedMediaIndex, maxIndex);
    }

    // 2. 부모에서 미디어 찾기
    let current: HTMLElement | null = parentElement;
    for (let i = 0; i < 10 && current; i++) {
      const container = current;
      const siblings = this.findMediaElementsInContainer(container);

      for (const sibling of siblings) {
        if (!sibling) continue;
        if (sibling.contains(clickedElement) || this.isDirectMediaChild(clickedElement, sibling)) {
          return Math.min(siblings.indexOf(sibling), maxIndex);
        }
      }

      current = current.parentElement;
    }

    return -1;
  }
}

/**
 * 폴백 전략 (신뢰도 50%)
 *
 * 모든 시도 실패 시 첫 번째 미디어(index 0) 반환
 * 사용자 경험 저하를 막기 위한 안전장치
 */
export class FallbackStrategy implements MediaClickIndexStrategy {
  readonly name = 'Fallback';
  readonly confidence = 50;

  calculate(
    _clickedElement: HTMLElement,
    _apiMedias: TweetMediaEntry[],
    mediaItems: MediaInfo[]
  ): number {
    // 미디어가 있으면 0, 없으면 -1
    return mediaItems.length > 0 ? 0 : -1;
  }
}
