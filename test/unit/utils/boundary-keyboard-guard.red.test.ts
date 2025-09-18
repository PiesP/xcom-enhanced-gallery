/**
 * boundary-keyboard-guard.red.test.ts
 * RED: shouldConsumeKeyboardAtBoundary 미구현 상태 — 키보드 네비게이션 경계 정책 명세
 */
import { describe, it, expect } from 'vitest';
import { shouldConsumeKeyboardAtBoundary } from '@shared/utils/scroll/boundary-keyboard-guard';

// 키보드 네비게이션 키: Home / End / PageUp / PageDown / Space(' ')
// 정책 개요:
// - 스크롤 여유(중간 지점)에서는 기본 동작 허용 → false (소비하지 않음)
// - top boundary에서 위로 이동 성격(Home/PageUp) 또는 PageUp => true (상위 body 스크롤 방지)
// - bottom boundary에서 아래로 이동 성격(End/PageDown/Space) => true
// - non-scrollable(내용 높이 <= clientHeight) => true (항상 체인 차단)

function base(
  overrides: Partial<{ scrollTop: number; scrollHeight: number; clientHeight: number; key: string }>
) {
  return {
    scrollTop: 600,
    scrollHeight: 2000,
    clientHeight: 400,
    key: 'PageDown',
    ...overrides,
  };
}

describe('shouldConsumeKeyboardAtBoundary (RED)', () => {
  it('중간 위치 PageDown -> false 기대 (pass-through)', () => {
    expect(shouldConsumeKeyboardAtBoundary(base({ key: 'PageDown' }))).toBe(false);
  });
  it('top boundary + PageUp -> true', () => {
    expect(shouldConsumeKeyboardAtBoundary(base({ scrollTop: 0, key: 'PageUp' }))).toBe(true);
  });
  it('top boundary + Home -> true', () => {
    expect(shouldConsumeKeyboardAtBoundary(base({ scrollTop: 0, key: 'Home' }))).toBe(true);
  });
  it('bottom boundary + PageDown -> true', () => {
    expect(
      shouldConsumeKeyboardAtBoundary(
        base({ scrollTop: 1600 /* scrollHeight-clientHeight */, key: 'PageDown' })
      )
    ).toBe(true);
  });
  it('bottom boundary + End -> true', () => {
    expect(
      shouldConsumeKeyboardAtBoundary(
        base({ scrollTop: 1600 /* scrollHeight-clientHeight */, key: 'End' })
      )
    ).toBe(true);
  });
  it('bottom boundary + Space -> true', () => {
    expect(
      shouldConsumeKeyboardAtBoundary(
        base({ scrollTop: 1600 /* scrollHeight-clientHeight */, key: ' ' })
      )
    ).toBe(true);
  });
  it('non-scrollable -> true', () => {
    expect(
      shouldConsumeKeyboardAtBoundary(
        base({ scrollHeight: 200, clientHeight: 400, scrollTop: 0, key: 'PageDown' })
      )
    ).toBe(true);
  });
});
