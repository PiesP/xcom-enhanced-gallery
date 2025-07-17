/**
 * @fileoverview Result 타입 패턴
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
 * Option 타입 - 값이 있거나 없음을 명시적으로 표현
 */
export type Option<T> = T | null;

/**
 * 성공 Result 생성
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * 실패 Result 생성
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * 비동기 함수를 안전하게 실행하고 Result 반환
 */
export async function safeAsync<T>(fn: () => Promise<T>): AsyncResult<T> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 동기 함수를 안전하게 실행하고 Result 반환
 */
export function safe<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Result 체이닝을 위한 map 함수
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.success) {
    try {
      return success(fn(result.data));
    } catch (error) {
      return failure(error as E);
    }
  }
  return result;
}

/**
 * Result 체이닝을 위한 flatMap 함수
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    try {
      return fn(result.data);
    } catch (error) {
      return failure(error as E);
    }
  }
  return result;
}

/**
 * Result에서 값 추출 (기본값과 함께)
 */
export function unwrapOr<T>(result: Result<T, unknown>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Result에서 값 추출 (에러 시 throw)
 */
export function unwrap<T>(result: Result<T, unknown>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Result가 성공인지 확인하는 타입 가드
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Result가 실패인지 확인하는 타입 가드
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * 여러 Result를 결합하여 모든 것이 성공인 경우에만 성공 반환
 */
export function combine<T extends readonly unknown[]>(
  ...results: { [K in keyof T]: Result<T[K], unknown> }
): Result<T, unknown> {
  const data: unknown[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    data.push(result.data);
  }

  return success(data as unknown as T);
}

/**
 * Result 배열을 처리하여 모든 성공값의 배열 또는 첫 번째 에러 반환
 */
export function collectResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    data.push(result.data);
  }

  return success(data);
}

/**
 * Result 배열을 처리하여 성공한 값들만 수집
 */
export function collectSuccesses<T>(results: Result<T, unknown>[]): T[] {
  return results.filter(isSuccess).map(result => result.data);
}

/**
 * Result 배열을 처리하여 실패한 에러들만 수집
 */
export function collectFailures<E>(results: Result<unknown, E>[]): E[] {
  return results.filter(isFailure).map(result => result.error);
}

/**
 * 조건부 Result 생성
 */
export function fromPredicate<T>(
  value: T,
  predicate: (value: T) => boolean,
  errorFn: (value: T) => Error
): Result<T> {
  return predicate(value) ? success(value) : failure(errorFn(value));
}

/**
 * null/undefined를 Result로 변환
 */
export function fromNullable<T>(
  value: T | null | undefined,
  error: Error = new Error('Value is null or undefined')
): Result<T> {
  return value != null ? success(value) : failure(error);
}

/**
 * Promise를 AsyncResult로 변환
 */
export function fromPromise<T>(promise: Promise<T>): AsyncResult<T> {
  return safeAsync(() => promise);
}

/**
 * 유틸리티 객체 - 함수형 스타일로 사용 가능
 */
export const ResultUtils = {
  success,
  failure,
  safe,
  safeAsync,
  map,
  flatMap,
  unwrap,
  unwrapOr,
  isSuccess,
  isFailure,
  combine,
  collectResults,
  collectSuccesses,
  collectFailures,
  fromPredicate,
  fromNullable,
  fromPromise,
} as const;

/**
 * 사용 예시
 *
 * @example
 * ```typescript
 * // ✅ 기본 사용법
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) {
 *     return failure(new Error('Division by zero'));
 *   }
 *   return success(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.success) {
 *   console.log('결과:', result.data); // 5
 * } else {
 *   console.error('에러:', result.error.message);
 * }
 *
 * // ✅ 체이닝
 * const finalResult = map(
 *   divide(10, 2),
 *   x => x * 2
 * ); // Result<number>
 *
 * // ✅ 비동기 처리
 * async function fetchUserData(id: string): AsyncResult<User> {
 *   return safeAsync(async () => {
 *     const response = await fetch(`/api/users/${id}`);
 *     if (!response.ok) {
 *       throw new Error('Failed to fetch user');
 *     }
 *     return response.json();
 *   });
 * }
 *
 * // ✅ 여러 Result 결합
 * const user1 = divide(10, 2);
 * const user2 = divide(20, 4);
 * const combined = combine(user1, user2); // Result<[number, number]>
 * ```
 */
