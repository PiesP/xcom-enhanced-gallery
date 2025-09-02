import { describe, it, expect } from 'vitest';

// DEPRECATED RED PLACEHOLDER
// 원래 목적: normalizeWheelDelta + 대량 wheel 처리 구현 전 강제 RED.
// 현재: 실제 스트레스/성능 검증은 `wheel-scroll-stress.test.ts` 와
// `wheel-scroll-throughput.test.ts` 로 대체되었으며, 본 파일은 역사적 레코드만 유지.
// 정책(RED 파일명 제거)에 따라 추후 삭제 가능. 지금은 전체 스위트 GREEN 보장을 위해 skip.

describe.skip('DEPRECATED: wheel scroll stress (legacy RED placeholder)', () => {
  it('replaced by wheel-scroll-stress.test.ts', () => {
    expect(true).toBe(true);
  });
});
