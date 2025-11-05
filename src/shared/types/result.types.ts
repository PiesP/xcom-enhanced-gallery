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
export type ResultError = BaseResult & { status: 'error' | 'partial' | 'cancelled' };
export type Result<T> = ResultSuccess<T> | ResultError;
