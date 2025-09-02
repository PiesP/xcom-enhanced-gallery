/**
 * Metrics / Observability 관련 공통 상수
 * 스키마 버전 변경 시 CHANGELOG 및 관련 테스트 업데이트 필요
 */
export const METRICS_VERSION = '1.0.0';

/**
 * ratio 계산 유틸 (NaN 안전)
 */
export function computeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  const v = numerator / denominator;
  return Number.isFinite(v) ? v : 0;
}

/** 전략 캐시 히트 비율 */
export function computeStrategyCacheHitRatio(hits: number, misses: number): number {
  return computeRatio(hits, hits + misses);
}

/** 성공 결과 캐시 히트 비율 (evictions 포함하여 분모 구성) */
export function computeSuccessResultCacheHitRatio(successHits: number, evictions: number): number {
  const denom = successHits + evictions;
  if (denom === 0) return successHits > 0 ? 1 : 0; // 히트만 있고 분모 0인 비정상 상황 대비
  return computeRatio(successHits, denom);
}
