/**
 * @fileoverview Result 타입 패턴 - Shared Layer
 * @version 1.0.0
 *
 * 명시적 에러 처리를 위한 Result 타입
 * Rust의 Result 타입을 TypeScript로 구현
 */

/**
 * Result 타입 - 성공 또는 실패를 명시적으로 표현
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * 비동기 Result 타입
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * 성공 결과 생성 헬퍼
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * 실패 결과 생성 헬퍼
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Result 타입 가드
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Result 타입 가드
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Result를 언래핑 (성공값만 반환)
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(`Failed to unwrap Result: ${result.error}`);
}

/**
 * Result를 언래핑 (실패시 기본값 반환)
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isSuccess(result) ? result.data : defaultValue;
}
