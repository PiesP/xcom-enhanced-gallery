/**
 * @fileoverview 간소화된 미디어 클릭 디바운서
 * @version 3.0.0 - Debouncer에서 간소화
 */

import type { MediaInfo } from '../../../core/types/media.types';
import { Debouncer } from './Debouncer';

/**
 * 미디어 클릭 컨텍스트 정보
 */
export interface MediaClickContext {
  /** 클릭된 미디어 정보 */
  readonly mediaInfo: MediaInfo;
  /** 클릭된 엘리먼트 */
  readonly element: HTMLElement;
  /** 클릭 이벤트 */
  readonly event: MouseEvent;
  /** 트윗 컨테이너 엘리먼트 */
  readonly tweetContainer?: HTMLElement;
  /** 타임스탬프 */
  readonly timestamp: number;
}

/**
 * 미디어 클릭 디바운서 옵션
 */
export interface MediaClickDebouncerOptions {
  /** 지연 시간 (기본: 150ms) */
  delay?: number;
}

/**
 * 간소화된 미디어 클릭 디바운서
 */
export class MediaClickDebouncer {
  private readonly debouncer: Debouncer<[MediaClickContext]>;

  constructor(
    private readonly onMediaClick: (context: MediaClickContext) => void,
    options: MediaClickDebouncerOptions = {}
  ) {
    const { delay = 150 } = options;
    this.debouncer = new Debouncer((context: MediaClickContext) => {
      this.onMediaClick(context);
    }, delay);
  }

  /**
   * 미디어 클릭 처리
   */
  handleClick(context: MediaClickContext): void {
    this.debouncer.execute(context);
  }

  /**
   * 대기 중인 클릭을 즉시 처리
   */
  flush(): void {
    this.debouncer.flush();
  }

  /**
   * 대기 중인 클릭을 취소
   */
  cancel(): void {
    this.debouncer.cancel();
  }

  /**
   * 디바운서 정리
   */
  destroy(): void {
    this.debouncer.cancel();
  }
}

/**
 * 미디어 클릭 디바운서 팩토리 함수
 */
export function createMediaClickDebouncer(
  onMediaClick: (context: MediaClickContext) => void,
  options?: MediaClickDebouncerOptions
): MediaClickDebouncer {
  return new MediaClickDebouncer(onMediaClick, options);
}
