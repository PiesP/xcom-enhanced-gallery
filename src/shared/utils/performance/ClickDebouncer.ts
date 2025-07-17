/**
 * @fileoverview 간소화된 클릭 디바운서
 * @version 3.0.0 - Debouncer에서 간소화
 */

import type { MediaInfo } from '../../../core/types/media.types';
import { Debouncer } from './Debouncer';

/**
 * 클릭 컨텍스트 정보
 */
export interface ClickContext {
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
 * 클릭 디바운서 옵션
 */
export interface ClickDebouncerOptions {
  /** 지연 시간 (기본: 150ms) */
  delay?: number;
}

/**
 * 간소화된 클릭 디바운서
 */
export class ClickDebouncer {
  private readonly debouncer: Debouncer<[ClickContext]>;

  constructor(
    private readonly onMediaClick: (context: ClickContext) => void,
    options: ClickDebouncerOptions = {}
  ) {
    const { delay = 150 } = options;
    this.debouncer = new Debouncer((context: ClickContext) => {
      this.onMediaClick(context);
    }, delay);
  }

  /**
   * 클릭 처리
   */
  handleClick(context: ClickContext): void {
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
 * 클릭 디바운서 팩토리 함수
 */
export function createClickDebouncer(
  onMediaClick: (context: ClickContext) => void,
  options?: ClickDebouncerOptions
): ClickDebouncer {
  return new ClickDebouncer(onMediaClick, options);
}
