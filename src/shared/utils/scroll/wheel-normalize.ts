/**
 * 휠 delta 정규화 헬퍼
 * 장치/브라우저별 deltaY 편차를 줄이고 극단값/노이즈를 처리한다.
 * 목표:
 *  - 절대값 240 초과 → 240 으로 clamp (트랙패드 가속 과도값 억제)
 *  - 절대값 1 미만 → 0 (미세 노이즈 제거)
 *  - NaN → 0, Infinity → clamp 값
 *  - 정수 반환 (Math.trunc)
 */
export const WHEEL_DELTA_MAX = 240;
export const WHEEL_DELTA_MIN_THRESHOLD = 1; // 1px 미만은 노이즈로 간주

export function normalizeWheelDelta(raw: number): number {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return 0;
  if (!Number.isFinite(raw)) return WHEEL_DELTA_MAX;
  const sign = raw === 0 ? 0 : raw > 0 ? 1 : -1;
  const abs = Math.abs(raw);
  if (abs < WHEEL_DELTA_MIN_THRESHOLD) return 0;
  const clamped = abs > WHEEL_DELTA_MAX ? WHEEL_DELTA_MAX : abs;
  // 정수화 (브라우저 기본 scrollBy 는 소수 허용하지만 안정성 위해 절삭)
  return sign * Math.trunc(clamped);
}

/** 여러 delta 를 합성(normalize 후 합) */
export function accumulateNormalizedDeltas(deltas: number[]): number {
  let total = 0;
  for (const d of deltas) total += normalizeWheelDelta(d);
  return total;
}

export type NormalizeWheelDeltaFn = (raw: number) => number;
