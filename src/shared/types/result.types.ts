/**
 * 공통 Result 패턴 (Phase: Result Unification)
 */
export type BaseResultStatus = 'success' | 'partial' | 'error' | 'cancelled';

// Phase 2 Cycle: Extended error code enumeration (RED -> GREEN target for services)
export enum ErrorCode {
  NONE = 'NONE',
  CANCELLED = 'CANCELLED',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  EMPTY_INPUT = 'EMPTY_INPUT',
  ALL_FAILED = 'ALL_FAILED',
  PARTIAL_FAILED = 'PARTIAL_FAILED',
  UNKNOWN = 'UNKNOWN',
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
