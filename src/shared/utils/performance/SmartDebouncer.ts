/**
 * @fileoverview Smart Debouncing System for Enhanced User Experience
 * @license MIT
 * @version 1.0.0
 * @author X.com Enhanced Gallery Team
 *
 * @description
 * 의도 기반 스마트 디바운싱 시스템. 사용자의 실제 의도를 분석하여
 * 불필요한 호출은 차단하고 중요한 호출은 즉시 처리합니다.
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 디바운싱 전략 타입
 */
export type DebounceStrategy =
  | 'leading' // 첫 번째 호출만 즉시 실행
  | 'trailing' // 마지막 호출만 지연 실행
  | 'both' // 첫 번째는 즉시, 마지막은 지연 실행
  | 'smart'; // 컨텍스트 기반 스마트 실행

/**
 * 디바운싱 컨텍스트 정보
 */
export interface DebounceContext {
  /** 호출 횟수 */
  readonly callCount: number;
  /** 첫 번째 호출 시간 */
  readonly firstCallTime: number;
  /** 마지막 호출 시간 */
  readonly lastCallTime: number;
  /** 호출 간격들 */
  readonly intervals: readonly number[];
  /** 추가 컨텍스트 데이터 */
  readonly data?: Record<string, unknown>;
}

/**
 * 스마트 디바운서 옵션
 */
export interface SmartDebouncerOptions<T extends unknown[] = unknown[]> {
  /** 지연 시간 (milliseconds) */
  delay: number;
  /** 디바운싱 전략 */
  strategy?: DebounceStrategy;
  /** 최대 대기 시간 (trailing 전략에서 강제 실행) */
  maxWait?: number;
  /** 컨텍스트 기반 실행 여부 결정 함수 */
  shouldExecute?: (context: DebounceContext, args: T) => boolean;
  /** 실행 전 조건 검사 함수 */
  canExecute?: (...args: T) => boolean;
  /** 디버그 로깅 활성화 */
  debug?: boolean;
}

/**
 * 스마트 디바운서 클래스
 */
export class SmartDebouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private maxWaitTimerId: number | null = null;
  private callCount = 0;
  private firstCallTime = 0;
  private lastCallTime = 0;
  private intervals: number[] = [];
  private lastArgs: T | null = null;
  private hasExecutedLeading = false;

  constructor(
    private readonly fn: (...args: T) => void,
    private readonly options: SmartDebouncerOptions<T>
  ) {}

  /**
   * 디바운스된 함수 실행
   */
  execute(...args: T): void {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    // 호출 통계 업데이트
    this.updateCallStats(now, timeSinceLastCall);
    this.lastArgs = args;

    // 실행 전 조건 검사
    if (this.options.canExecute && !this.options.canExecute(...args)) {
      this.log('Execution blocked by canExecute condition');
      return;
    }

    // 전략별 처리
    switch (this.options.strategy) {
      case 'leading':
        this.handleLeadingStrategy(args);
        break;
      case 'trailing':
        this.handleTrailingStrategy(args);
        break;
      case 'both':
        this.handleBothStrategy(args);
        break;
      case 'smart':
      default:
        this.handleSmartStrategy(args);
        break;
    }
  }

  /**
   * Leading 전략: 첫 번째 호출만 즉시 실행
   */
  private handleLeadingStrategy(args: T): void {
    if (!this.hasExecutedLeading) {
      this.executeFunction(args, 'leading');
      this.hasExecutedLeading = true;
    }
    this.scheduleTrailingExecution(args);
  }

  /**
   * Trailing 전략: 마지막 호출만 지연 실행
   */
  private handleTrailingStrategy(args: T): void {
    this.scheduleTrailingExecution(args);
  }

  /**
   * Both 전략: 첫 번째는 즉시, 마지막은 지연 실행
   */
  private handleBothStrategy(args: T): void {
    if (!this.hasExecutedLeading) {
      this.executeFunction(args, 'leading');
      this.hasExecutedLeading = true;
    }
    this.scheduleTrailingExecution(args);
  }

  /**
   * Smart 전략: 컨텍스트 기반 지능적 실행
   */
  private handleSmartStrategy(args: T): void {
    const context = this.getContext();

    // 사용자 정의 실행 조건 확인
    if (this.options.shouldExecute) {
      if (this.options.shouldExecute(context, args)) {
        this.executeFunction(args, 'smart-immediate');
        return;
      }
    } else {
      // 기본 스마트 로직
      if (this.shouldExecuteImmediately(context)) {
        this.executeFunction(args, 'smart-immediate');
        return;
      }
    }

    // 지연 실행 스케줄링
    this.scheduleTrailingExecution(args);
  }

  /**
   * 즉시 실행 여부 결정 (기본 스마트 로직)
   */
  private shouldExecuteImmediately(context: DebounceContext): boolean {
    // 첫 번째 호출은 즉시 실행
    if (context.callCount === 1) {
      return true;
    }

    // 긴 간격 후의 호출은 새로운 의도로 간주
    const timeSinceLastCall = Date.now() - context.lastCallTime;
    if (timeSinceLastCall > this.options.delay * 2) {
      return true;
    }

    // 급격한 호출 패턴 변화 감지
    if (context.intervals.length >= 2) {
      const recentIntervals = context.intervals.slice(-2);
      const avgRecentInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;

      if (avgRecentInterval > this.options.delay * 1.5) {
        return true;
      }
    }

    return false;
  }

  /**
   * 지연 실행 스케줄링
   */
  private scheduleTrailingExecution(args: T): void {
    this.clearTimers();

    this.timerId = window.setTimeout(() => {
      this.executeFunction(args, 'trailing');
      this.reset();
    }, this.options.delay);

    // maxWait 처리
    if (this.options.maxWait && !this.maxWaitTimerId) {
      this.maxWaitTimerId = window.setTimeout(() => {
        this.executeFunction(args, 'maxWait');
        this.reset();
      }, this.options.maxWait);
    }
  }

  /**
   * 함수 실행
   */
  private executeFunction(args: T, trigger: string): void {
    try {
      this.log(`Executing function (trigger: ${trigger})`);
      this.fn(...args);
    } catch (error) {
      logger.error('SmartDebouncer: Function execution failed:', error);
    }
  }

  /**
   * 호출 통계 업데이트
   */
  private updateCallStats(now: number, timeSinceLastCall: number): void {
    this.callCount++;

    if (this.callCount === 1) {
      this.firstCallTime = now;
    } else {
      this.intervals.push(timeSinceLastCall);
      // 최근 10개 간격만 유지
      if (this.intervals.length > 10) {
        this.intervals.shift();
      }
    }

    this.lastCallTime = now;
  }

  /**
   * 현재 컨텍스트 정보 반환
   */
  private getContext(): DebounceContext {
    return {
      callCount: this.callCount,
      firstCallTime: this.firstCallTime,
      lastCallTime: this.lastCallTime,
      intervals: [...this.intervals],
    };
  }

  /**
   * 타이머 정리
   */
  private clearTimers(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.maxWaitTimerId) {
      clearTimeout(this.maxWaitTimerId);
      this.maxWaitTimerId = null;
    }
  }

  /**
   * 상태 초기화
   */
  private reset(): void {
    this.clearTimers();
    this.callCount = 0;
    this.firstCallTime = 0;
    this.lastCallTime = 0;
    this.intervals = [];
    this.lastArgs = null;
    this.hasExecutedLeading = false;
  }

  /**
   * 디버그 로깅
   */
  private log(message: string): void {
    if (this.options.debug) {
      logger.debug(`SmartDebouncer: ${message}`, this.getContext());
    }
  }

  /**
   * 즉시 실행 (디바운싱 무시)
   */
  flush(): void {
    if (this.lastArgs) {
      this.executeFunction(this.lastArgs, 'flush');
    }
    this.reset();
  }

  /**
   * 모든 대기 중인 실행 취소
   */
  cancel(): void {
    this.clearTimers();
    this.reset();
  }

  /**
   * 현재 대기 중인 실행이 있는지 확인
   */
  isPending(): boolean {
    return this.timerId !== null;
  }
}

/**
 * 스마트 디바운서 팩토리 함수
 */
export function createSmartDebouncer<T extends unknown[] = unknown[]>(
  fn: (...args: T) => void,
  options: SmartDebouncerOptions<T>
): SmartDebouncer<T> {
  return new SmartDebouncer(fn, options);
}
