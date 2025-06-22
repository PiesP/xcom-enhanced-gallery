/**
 * @fileoverview Media Click Smart Debouncer for Enhanced Gallery
 * @license MIT
 * @version 2.0.0 - Enhanced Clean Architecture
 * @author X.com Enhanced Gallery Team
 *
 * @description
 * 미디어 클릭 이벤트를 위한 특화된 스마트 디바운서.
 * 사용자의 실제 의도를 분석하여 갤러리 열기를 최적화합니다.
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import type { DebounceContext } from './SmartDebouncer';
import { SmartDebouncer, createSmartDebouncer } from './SmartDebouncer';

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
  /** 최대 대기 시간 (기본: 500ms) */
  maxWait?: number;
  /** 같은 미디어 연속 클릭 허용 여부 (기본: false) */
  allowConsecutiveSameMedia?: boolean;
  /** 빠른 클릭 임계값 (기본: 100ms) */
  rapidClickThreshold?: number;
  /** 디버그 모드 (기본: false) */
  debug?: boolean;
}

/**
 * 미디어 클릭 스마트 디바운서
 */
export class MediaClickDebouncer {
  private readonly debouncer: SmartDebouncer<[MediaClickContext]>;
  private lastMediaUrl: string | null = null;
  private rapidClickCount = 0;
  private lastClickTime = 0;

  constructor(
    private readonly onMediaClick: (context: MediaClickContext) => void,
    private readonly options: MediaClickDebouncerOptions = {}
  ) {
    const { delay = 150, maxWait = 500, debug = false } = options;

    this.debouncer = createSmartDebouncer(
      (context: MediaClickContext) => {
        this.executeMediaClick(context);
      },
      {
        delay,
        maxWait,
        strategy: 'smart',
        shouldExecute: (debounceContext: DebounceContext, [mediaContext]: [MediaClickContext]) =>
          this.shouldExecuteImmediately(debounceContext, mediaContext),
        canExecute: (mediaContext: MediaClickContext) => this.canExecuteClick(mediaContext),
        debug,
      }
    );
  }

  /**
   * 미디어 클릭 처리
   */
  handleClick(context: MediaClickContext): void {
    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime;

    // 빠른 클릭 감지
    const rapidThreshold = this.options.rapidClickThreshold ?? 100;
    if (timeSinceLastClick < rapidThreshold) {
      this.rapidClickCount++;
    } else {
      this.rapidClickCount = 1;
    }

    this.lastClickTime = now;

    this.log('Handling media click', {
      mediaUrl: context.mediaInfo.url,
      rapidClickCount: this.rapidClickCount,
      timeSinceLastClick,
    });

    this.debouncer.execute(context);
  }

  /**
   * 즉시 실행 여부 결정
   */
  private shouldExecuteImmediately(
    debounceContext: DebounceContext,
    mediaContext: MediaClickContext
  ): boolean {
    // 첫 번째 클릭은 즉시 실행
    if (debounceContext.callCount === 1) {
      this.log('Immediate execution: First click');
      return true;
    }

    // 다른 미디어로의 클릭은 즉시 실행
    if (this.lastMediaUrl && this.lastMediaUrl !== mediaContext.mediaInfo.url) {
      this.log('Immediate execution: Different media');
      return true;
    }

    // 긴 간격 후의 클릭은 새로운 의도로 간주
    const timeSinceLastCall = Date.now() - debounceContext.lastCallTime;
    if (timeSinceLastCall > (this.options.delay ?? 150) * 3) {
      this.log('Immediate execution: Long interval');
      return true;
    }

    // 특정 엘리먼트 타입은 즉시 실행 (예: 버튼, 링크)
    if (this.isHighPriorityElement(mediaContext.element)) {
      this.log('Immediate execution: High priority element');
      return true;
    }

    return false;
  }

  /**
   * 클릭 실행 가능 여부 확인
   */
  private canExecuteClick(context: MediaClickContext): boolean {
    // 같은 미디어 연속 클릭 허용하지 않는 경우
    const allowConsecutive = this.options.allowConsecutiveSameMedia ?? false;
    if (!allowConsecutive) {
      if (this.lastMediaUrl === context.mediaInfo.url && this.rapidClickCount > 1) {
        this.log('Click blocked: Consecutive same media click');
        return false;
      }
    }

    // 미디어 정보 유효성 검사
    if (!context.mediaInfo.url || !context.mediaInfo.type) {
      this.log('Click blocked: Invalid media info');
      return false;
    }

    // 엘리먼트가 여전히 DOM에 존재하는지 확인
    if (!document.contains(context.element)) {
      this.log('Click blocked: Element no longer in DOM');
      return false;
    }

    return true;
  }

  /**
   * 높은 우선순위 엘리먼트인지 확인
   */
  private isHighPriorityElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const { className } = element;

    // 명시적인 버튼이나 링크
    if (tagName === 'button' || tagName === 'a' || role === 'button') {
      return true;
    }

    // 갤러리 관련 클래스명
    if (
      className.includes('gallery') ||
      className.includes('media-viewer') ||
      className.includes('image-viewer')
    ) {
      return true;
    }

    return false;
  }

  /**
   * 미디어 클릭 실행
   */
  private executeMediaClick(context: MediaClickContext): void {
    try {
      this.lastMediaUrl = context.mediaInfo.url;
      this.log('Executing media click', {
        mediaUrl: context.mediaInfo.url,
        mediaType: context.mediaInfo.type,
      });

      this.onMediaClick(context);
    } catch (error) {
      logger.error('MediaClickDebouncer: Failed to execute media click:', error);
    }
  }

  /**
   * 디버그 로깅
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.options.debug) {
      logger.debug(`MediaClickDebouncer: ${message}`, data);
    }
  }

  /**
   * 즉시 실행 (디바운싱 무시)
   */
  flush(): void {
    this.debouncer.flush();
  }

  /**
   * 모든 대기 중인 실행 취소
   */
  cancel(): void {
    this.debouncer.cancel();
    this.rapidClickCount = 0;
    this.lastClickTime = 0;
  }

  /**
   * 현재 대기 중인 실행이 있는지 확인
   */
  isPending(): boolean {
    return this.debouncer.isPending();
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

/**
 * 미디어 클릭 컨텍스트 생성 헬퍼
 */
export function createMediaClickContext(
  mediaInfo: MediaInfo,
  element: HTMLElement,
  event: MouseEvent,
  tweetContainer?: HTMLElement
): MediaClickContext {
  return {
    mediaInfo,
    element,
    event,
    ...(tweetContainer && { tweetContainer }),
    timestamp: Date.now(),
  };
}
