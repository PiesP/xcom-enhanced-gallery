/**
 * @fileoverview Architecture Core Types
 * @version 1.0.0
 *
 * Clean Architecture 패턴의 핵심 아키텍처 타입들을 정의합니다.
 * 모든 레이어에서 사용되는 기본 아키텍처 인터페이스들을 포함합니다.
 */

// ================================
// Domain Entity Interfaces
// ================================

/**
 * 도메인 엔티티의 기본 인터페이스
 * 모든 비즈니스 엔티티는 이 인터페이스를 구현해야 합니다.
 */
export interface DomainEntity {
  /** 엔티티의 고유 식별자 */
  readonly id: string;

  /** 엔티티 생성 시간 */
  readonly createdAt: Date;

  /** 엔티티 수정 시간 */
  readonly updatedAt: Date;

  /** 엔티티 검증 */
  isValid(): boolean;

  /** 엔티티를 JSON으로 직렬화 */
  toJSON(): Record<string, unknown>;
}

/**
 * 값 객체의 기본 인터페이스
 * 변경 불가능한 값들을 표현하는 데 사용됩니다.
 */
export interface ValueObject<T> {
  /** 값 객체의 실제 값 */
  readonly value: T;

  /** 다른 값 객체와의 동등성 비교 */
  equals(other: ValueObject<T>): boolean;

  /** 값 객체 검증 */
  isValid(): boolean;

  /** 문자열 표현 */
  toString(): string;
}

// ================================
// Utility Types
// ================================

/**
 * 읽기 전용 딥 타입
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 부분적 딥 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 타입 가드 함수 타입
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * 결과 타입 (성공/실패를 명시적으로 표현)
 */
export type Result<TSuccess, TFailure = Error> =
  | { success: true; data: TSuccess }
  | { success: false; error: TFailure };
