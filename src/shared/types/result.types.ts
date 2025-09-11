/**
 * 공통 Result 패턴 (Phase: Result Unification)
 */
export type BaseResultStatus = 'success' | 'partial' | 'error' | 'cancelled';

export interface BaseResult {
  status: BaseResultStatus;
  error?: string;
  failures?: Array<{ url: string; error: string }>; // 부분 실패 요약
}
