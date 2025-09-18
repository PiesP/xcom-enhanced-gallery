/**
 * keyboard-scroll-isolation-flag.integration.test.ts
 * FLAG(xeg_scrollIsolationV1) 경계 기반 소비 정책 계약 (순수 함수 기반)
 * 이벤트 디스패치/JSDOM scrollTop 동기화 변동성을 피하고, wheel 경로 계약 테스트 스타일과 정렬.
 */
import { describe, it, expect } from 'vitest';
import { shouldConsumeKeyboardAtBoundary } from '@shared/utils/scroll/boundary-keyboard-guard';

function simulate(scrollTop: number, scrollHeight: number, clientHeight: number, key: string) {
  return shouldConsumeKeyboardAtBoundary({ scrollTop, scrollHeight, clientHeight, key });
}

describe('keyboard scroll isolation flag path (boundary contract)', () => {
  it('중간 위치 PageDown -> 소비 안함', () => {
    expect(simulate(600, 2000, 400, 'PageDown')).toBe(false);
  });
  it('top boundary + Home/PageUp -> 소비', () => {
    expect(simulate(0, 2000, 400, 'Home')).toBe(true);
    expect(simulate(0, 2000, 400, 'PageUp')).toBe(true);
  });
  it('bottom boundary + PageDown/End/Space -> 소비', () => {
    expect(simulate(1600, 2000, 400, 'PageDown')).toBe(true);
    expect(simulate(1600, 2000, 400, 'End')).toBe(true);
    expect(simulate(1600, 2000, 400, ' ')).toBe(true);
  });
  it('non-scrollable -> 소비', () => {
    expect(simulate(0, 200, 400, 'PageDown')).toBe(true);
  });
});
