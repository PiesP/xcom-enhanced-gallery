/**
 * @fileoverview Solid.js 유틸리티 헬퍼 함수
 * @description Phase 141.3: Accessor 타입 변환 헬퍼, 타입 단언 제거
 */

import type { Accessor } from 'solid-js';

/**
 * 값을 Accessor로 변환
 * Phase 141.3: 타입 단언 제거를 위한 공통 헬퍼
 *
 * @param value 일반 값 또는 Accessor
 * @returns Accessor 함수
 *
 * @example
 * ```typescript
 * const accessor = toAccessor(5); // () => 5
 * const alreadyAccessor = toAccessor(() => 10); // () => 10
 * ```
 */
export function toAccessor<T>(value: T | Accessor<T>): Accessor<T> {
  return typeof value === 'function' ? (value as Accessor<T>) : () => value;
}

/**
 * Type Guard: Accessor 타입 검증
 * Phase 141.3: 타입 안전성 개선
 *
 * @param value 검증할 값
 * @returns Accessor 타입 여부
 */
export function isAccessor<T>(value: unknown): value is Accessor<T> {
  return typeof value === 'function';
}

/**
 * Type Guard: HTMLElement 타입 검증
 * Phase 141.3: event.target 타입 단언 제거
 *
 * @param value 검증할 값
 * @returns HTMLElement 타입 여부
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}
