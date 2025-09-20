import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { LeakGuard } from '@/shared/utils/lifecycle/leak-guard';

/**
 * RED: 리스너/타이머/옵저버 누수 가드 테스트
 */

describe('[RED] lifecycle leak guard', () => {
  let guard: LeakGuard;

  beforeEach(() => {
    guard = new LeakGuard();
  });

  afterEach(() => {
    guard.cleanup();
  });

  it('타이머/이벤트/옵저버가 cleanup 후 0이어야 한다', () => {
    // 타이머 등록
    const t1 = guard.setTimeout(() => {}, 10);
    const i1 = guard.setInterval(() => {}, 1000);

    // 이벤트 리스너 등록
    const handler = () => {};
    const unsub = guard.addEventListener(document, 'keydown', handler);

    // 옵저버 등록
    const obs = guard.observe(document.body, { childList: true }, () => {});

    // 사전 카운트 확인
    expect(guard.getStats()).toEqual(
      expect.objectContaining({ timeouts: 1, intervals: 1, observers: 1, eventListeners: 1 })
    );

    // 일부 수동 해제
    guard.clearTimeout(t1);
    guard.clearInterval(i1);
    unsub();
    guard.disconnectObserver(obs);

    // cleanup 호출 후 모두 0
    guard.cleanup();
    expect(guard.getStats()).toEqual(
      expect.objectContaining({ timeouts: 0, intervals: 0, observers: 0, eventListeners: 0 })
    );
  });
});
