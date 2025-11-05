/**
 * 공통 Result 패턴 (Phase: Result Unification)
 * @version 2.1.0 - Phase 353: ExtractionErrorCode 별칭 제거
 */
export type BaseResultStatus = 'success' | 'partial' | 'error' | 'cancelled';

/**
 * 통합 에러 코드 (범용 + 미디어 추출 포함)
 *
 * 범용 에러 코드:
 *   - NONE: 에러 없음
 *   - CANCELLED: 작업 취소됨
 *   - EMPTY_INPUT: 입력값 없음
 *   - ALL_FAILED: 모든 작업 실패
 *   - PARTIAL_FAILED: 일부 작업 실패
 *   - UNKNOWN: 알 수 없는 에러
 *
 * 네트워크/타임아웃:
 *   - NETWORK: 네트워크 에러
 *   - TIMEOUT: 타임아웃
 *
 * 미디어 추출 전용 (Phase 195에서 ExtractionErrorCode 통합):
 *   - ELEMENT_NOT_FOUND: 요소를 찾을 수 없음
 *   - INVALID_ELEMENT: 유효하지 않은 요소
 *   - NO_MEDIA_FOUND: 미디어를 찾을 수 없음
 *   - INVALID_URL: 유효하지 않은 URL
 *   - PERMISSION_DENIED: 권한 거부
 */
export enum ErrorCode {
  // 범용 에러 코드
  NONE = 'NONE',
  CANCELLED = 'CANCELLED',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  EMPTY_INPUT = 'EMPTY_INPUT',
  ALL_FAILED = 'ALL_FAILED',
  PARTIAL_FAILED = 'PARTIAL_FAILED',
  UNKNOWN = 'UNKNOWN',

  // 미디어 추출 전용 에러 코드 (이전 ExtractionErrorCode 통합)
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  INVALID_ELEMENT = 'INVALID_ELEMENT',
  NO_MEDIA_FOUND = 'NO_MEDIA_FOUND',
  INVALID_URL = 'INVALID_URL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export interface BaseResult {
  status: BaseResultStatus;
  error?: string;
  /** Machine readable code */
  code?: ErrorCode; // RED test will require this when status !== 'success'
  /** Optional original error message or object serialized */
  cause?: unknown;
  /** Arbitrary diagnostic metadata (timings, counts, etc.) */
  meta?: Record<string, unknown>;
  failures?: Array<{ url: string; error: string }>; // 부분 실패 요약
}

export type ResultSuccess<T> = BaseResult & { status: 'success'; data: T; code?: ErrorCode.NONE };
export type ResultPartial<T> = BaseResult & {
  status: 'partial';
  data: T;
  error: string;
  code: ErrorCode.PARTIAL_FAILED;
  failures: Array<{ url: string; error: string }>;
};
export type ResultError = BaseResult & { status: 'error' | 'cancelled' };
export type Result<T> = ResultSuccess<T> | ResultPartial<T> | ResultError;

// ============================================================================
// Result Utility Functions (Phase 355.2)
// ============================================================================

/**
 * 성공 Result 생성
 *
 * @param data - 성공 데이터
 * @param meta - 선택적 메타데이터
 * @returns Enhanced Result (success)
 *
 * @example
 * ```typescript
 * const result = success({ id: 1, name: 'test' });
 * // { status: 'success', data: { id: 1, name: 'test' }, code: ErrorCode.NONE }
 * ```
 */
export function success<T>(data: T, meta?: Record<string, unknown>): Result<T> {
  return {
    status: 'success',
    data,
    code: ErrorCode.NONE,
    ...(meta && { meta }),
  };
}

/**
 * 실패 Result 생성
 *
 * @param error - 에러 메시지
 * @param code - ErrorCode (기본값: UNKNOWN)
 * @param options - 추가 옵션 (cause, meta, failures)
 * @returns Enhanced Result (error)
 *
 * @example
 * ```typescript
 * const result = failure('Task not found', ErrorCode.ELEMENT_NOT_FOUND);
 * // { status: 'error', error: 'Task not found', code: ErrorCode.ELEMENT_NOT_FOUND }
 * ```
 */
export function failure<T = never>(
  error: string,
  code: ErrorCode = ErrorCode.UNKNOWN,
  options?: {
    cause?: unknown;
    meta?: Record<string, unknown>;
    failures?: Array<{ url: string; error: string }>;
  }
): Result<T> {
  return {
    status: 'error',
    error,
    code,
    ...options,
  };
}

/**
 * 부분 실패 Result 생성
 *
 * @param data - 부분 성공 데이터
 * @param error - 에러 메시지
 * @param failures - 실패 항목 목록
 * @param meta - 선택적 메타데이터
 * @returns Enhanced Result (partial)
 *
 * @example
 * ```typescript
 * const result = partial([item1, item2], '1 failed', [{ url: 'bad.jpg', error: '404' }]);
 * // { status: 'partial', data: [...], code: ErrorCode.PARTIAL_FAILED, failures: [...] }
 * ```
 */
export function partial<T>(
  data: T,
  error: string,
  failures: Array<{ url: string; error: string }>,
  meta?: Record<string, unknown>
): ResultPartial<T> {
  return {
    status: 'partial',
    data,
    error,
    code: ErrorCode.PARTIAL_FAILED,
    failures,
    ...(meta && { meta }),
  };
}

/**
 * 취소 Result 생성
 *
 * @param error - 에러 메시지 (기본값: 'Operation cancelled')
 * @param meta - 선택적 메타데이터
 * @returns Enhanced Result (cancelled)
 *
 * @example
 * ```typescript
 * const result = cancelled('User cancelled download');
 * // { status: 'cancelled', error: 'User cancelled download', code: ErrorCode.CANCELLED }
 * ```
 */
export function cancelled<T = never>(
  error = 'Operation cancelled',
  meta?: Record<string, unknown>
): Result<T> {
  return {
    status: 'cancelled',
    error,
    code: ErrorCode.CANCELLED,
    ...(meta && { meta }),
  };
}

/**
 * Result가 성공인지 확인 (타입 가드)
 *
 * @param result - 확인할 Result
 * @returns result가 ResultSuccess인지 여부
 */
export function isSuccess<T>(result: Result<T>): result is ResultSuccess<T> {
  return result.status === 'success';
}

/**
 * Result가 실패인지 확인 (타입 가드)
 *
 * @param result - 확인할 Result
 * @returns result가 error 또는 cancelled인지 여부
 */
export function isFailure<T>(result: Result<T>): result is ResultError {
  return result.status === 'error' || result.status === 'cancelled';
}

/**
 * Result가 부분 실패인지 확인 (타입 가드)
 *
 * @param result - 확인할 Result
 * @returns result가 partial인지 여부
 */
export function isPartial<T>(result: Result<T>): result is ResultPartial<T> {
  return result.status === 'partial';
}

/**
 * Result에서 값을 추출 (기본값 제공)
 *
 * @param result - 추출할 Result
 * @param defaultValue - 실패 시 반환할 기본값
 * @returns 성공 시 data, 실패 시 defaultValue
 *
 * @example
 * ```typescript
 * const value = unwrapOr(result, 'fallback');
 * ```
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return isSuccess(result) ? result.data : defaultValue;
}

/**
 * 비동기 함수를 안전하게 실행하고 Result 반환
 *
 * @param fn - 실행할 비동기 함수
 * @param options - ErrorCode 및 meta 옵션
 * @returns Promise<Result<T>>
 *
 * @example
 * ```typescript
 * const result = await safeAsync(
 *   async () => fetchData(),
 *   { code: ErrorCode.NETWORK }
 * );
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options?: {
    code?: ErrorCode;
    meta?: Record<string, unknown>;
  }
): Promise<Result<T>> {
  try {
    const data = await fn();
    return success(data, options?.meta);
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : String(error),
      options?.code ?? ErrorCode.UNKNOWN,
      {
        cause: error,
        ...(options?.meta && { meta: options.meta }),
      }
    );
  }
}

/**
 * 동기 함수를 안전하게 실행하고 Result 반환
 *
 * @param fn - 실행할 동기 함수
 * @param options - ErrorCode 및 meta 옵션
 * @returns Result<T>
 *
 * @example
 * ```typescript
 * const result = safe(
 *   () => JSON.parse(data),
 *   { code: ErrorCode.INVALID_ELEMENT }
 * );
 * ```
 */
export function safe<T>(
  fn: () => T,
  options?: {
    code?: ErrorCode;
    meta?: Record<string, unknown>;
  }
): Result<T> {
  try {
    const data = fn();
    return success(data, options?.meta);
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : String(error),
      options?.code ?? ErrorCode.UNKNOWN,
      {
        cause: error,
        ...(options?.meta && { meta: options.meta }),
      }
    );
  }
}

/**
 * Result 체이닝 (flatMap)
 *
 * @param result - 입력 Result
 * @param fn - 변환 함수 (Result 반환)
 * @returns 체이닝된 Result
 *
 * @example
 * ```typescript
 * const result2 = chain(result1, (data) => processData(data));
 * ```
 */
export function chain<T, U>(result: Result<T>, fn: (value: T) => Result<U>): Result<U> {
  if (!isSuccess(result)) {
    return result as unknown as Result<U>;
  }
  return fn(result.data);
}

/**
 * Result 매핑 (map)
 *
 * @param result - 입력 Result
 * @param fn - 변환 함수 (값 반환)
 * @returns 매핑된 Result
 *
 * @example
 * ```typescript
 * const result2 = map(result1, (data) => data.id);
 * ```
 */
export function map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  if (!isSuccess(result)) {
    return result as unknown as Result<U>;
  }
  return success(fn(result.data), result.meta);
}
