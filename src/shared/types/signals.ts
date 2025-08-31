/**
 * @fileoverview Centralized Signal Type Definitions
 * @description Phase 1 GREEN - 중앙화된 Signal 타입 시스템
 * @version 1.0.0
 */

/**
 * 표준 Signal 인터페이스
 * 모든 상태관리 모듈에서 일관되게 사용
 */
export interface Signal<T> {
  /** 현재 값 */
  value: T;
  /** 상태 변경 구독 (unsubscribe 함수 반환) */
  subscribe: (callback: (value: T) => void) => () => void;
}

/**
 * 구독 함수 타입
 */
export type SubscribeFn<T> = (callback: (value: T) => void) => () => void;

/**
 * 구독 해제 함수 타입
 */
export type UnsubscribeFn = () => void;

/**
 * Signal 상태 접근자 인터페이스
 * getter/setter 패턴을 위한 표준 구조
 */
export interface SignalAccessor<T> {
  /** 현재 값 가져오기 */
  readonly value: T;
  /** 상태 변경 구독 */
  subscribe: SubscribeFn<T>;
}

/**
 * 쓰기 가능한 Signal 상태 접근자
 */
export interface WritableSignalAccessor<T> extends SignalAccessor<T> {
  /** 값 설정 */
  value: T;
}

/**
 * Signal 초기화 옵션
 */
export interface SignalInitOptions {
  /** 지연 초기화 여부 */
  lazy?: boolean;
  /** 초기화 실패 시 폴백 동작 */
  fallbackBehavior?: 'throw' | 'warn' | 'silent';
}

/**
 * Signal 관련 에러 타입
 */
export class SignalError extends Error {
  constructor(
    message: string,
    public readonly code: 'INIT_FAILED' | 'SUBSCRIBE_FAILED' | 'UPDATE_FAILED'
  ) {
    super(message);
    this.name = 'SignalError';
  }
}
