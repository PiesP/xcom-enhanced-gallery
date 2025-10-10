/* eslint-env browser */
/**
 * @file animations.tokens.test.ts
 * 모션 정책: inline transition/animation도 토큰만 사용해야 한다.
 * animateCustom이 CSS 변수 토큰(var(--xeg-duration-*), var(--xeg-ease-*)))을 사용하도록 가드한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { animateCustom } from '@shared/utils/animations';

describe('animations.tokens policy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('animateCustom should set transition using CSS token variables (duration/easing)', async () => {
    const el = globalThis.document.createElement('div');

    // 실행: 토큰 기반 옵션으로 실행
    const p = animateCustom(
      el,
      { opacity: 0.5 },
      { durationToken: 'normal', easingToken: 'standard' }
    );

    // 스타일 검증: transition 문자열에 토큰이 포함되어야 함
    const transition = el.style.transition;
    expect(transition).toContain('var(--xeg-duration-normal)');
    expect(transition).toContain('var(--xeg-ease-standard)');

    // 금지: 하드코딩 ms 숫자나 키워드 이징(ease, ease-in, ease-out, ease-in-out)이 var() 밖에 등장하면 안 됨
    expect(transition).not.toMatch(/\b\d{2,4}ms\b/);
    const forbiddenEaseOutsideVar = /(?:^|[\s,])(ease|ease-in|ease-out|ease-in-out)(?:[\s,]|$)/;
    expect(transition).not.toMatch(forbiddenEaseOutsideVar);
    // 토큰화된 이징이 사용되어야 함
    expect(transition).toMatch(/var\(--xeg-ease-(standard|decelerate|accelerate)\)/);

    // 타이머 진행 후 Promise가 resolve 되어야 함(내부 대기 시간은 매핑된 숫자 사용)
    vi.runAllTimers();
    await expect(p).resolves.toBeUndefined();
  });
});
