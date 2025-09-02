/**
 * Fractional wheel delta accumulator
 * - 누적된 소수 delta 를 1px (정수) 단위 소비로 변환
 * - 방향 전환 시 누적량 초기화 (반대 부호 등장)
 */
export interface WheelDeltaAccumulator {
  push(raw: number): number; // 이번 입력으로 소비된 정수 delta (없으면 0)
  peekResidual(): number;
  reset(): void;
}

export function createWheelDeltaAccumulator(): WheelDeltaAccumulator {
  let residual = 0;
  return {
    push(raw: number): number {
      if (typeof raw !== 'number' || !Number.isFinite(raw) || raw === 0) return 0;
      // 방향 전환 감지 (부호 반대 && 누적 존재)
      if (residual !== 0 && Math.sign(raw) !== Math.sign(residual)) {
        residual = 0; // reset on direction change
      }
      residual += raw;
      // 정수 부분 소비
      if (Math.abs(residual) >= 1) {
        const consume = residual > 0 ? Math.floor(residual) : Math.ceil(residual);
        residual -= consume;
        return consume;
      }
      return 0;
    },
    peekResidual(): number {
      return residual;
    },
    reset(): void {
      residual = 0;
    },
  };
}
