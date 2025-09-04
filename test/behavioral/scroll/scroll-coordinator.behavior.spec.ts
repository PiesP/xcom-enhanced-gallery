/*
 * RED TEST (SR-1): Scroll Coordinator 기본 동작 기대사항 캡처
 * Phase: SR-1 Inventory & RED
 * 이 테스트는 현재 실패할 수 있으며, 파생 상태/idle 로직 확정 후 GREEN 목표
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getScrollCoordinator } from '@/shared/scroll';

function simulateScroll(y: number) {
  // jsdom 환경 가정
  Object.defineProperty(globalThis, 'scrollY', { value: y, writable: true, configurable: true });
  globalThis.dispatchEvent(new Event('scroll'));
}

describe('[RED][SR-1] ScrollCoordinator 기본 스냅샷/방향/idle', () => {
  beforeEach(() => {
    // 재실행 안전 확인용 - 동일 인스턴스 사용
  });

  it('첫 attach 후 초기 position 업데이트가 이루어진다', () => {
    const c = getScrollCoordinator();
    c.attach();
    expect(c.position.value.y).toBe(0);
    expect(c.position.value.atTop).toBe(true);
  });

  it('스크롤 변경 시 direction 이 up/down 으로 반영된다', async () => {
    const c = getScrollCoordinator();
    c.attach();
    simulateScroll(50);
    // rAF tick 대기
    await new Promise(r => globalThis.setTimeout(r, 16));
    expect(['down', 'up']).toContain(c.direction.value);
  });

  it('활동 후 idleDelay 경과 시 idle=true 로 복귀한다', async () => {
    const c = getScrollCoordinator();
    c.attach();
    simulateScroll(30);
    await new Promise(r => globalThis.setTimeout(r, 16));
    expect(c.idle.value).toBe(false);
    await new Promise(r => globalThis.setTimeout(r, 170));
    expect(c.idle.value).toBe(true);
  });

  it('progress 는 0..1 사이 값으로 계산된다', async () => {
    const c = getScrollCoordinator();
    c.attach();
    simulateScroll(0);
    await new Promise(r => globalThis.setTimeout(r, 16));
    expect(c.progress.value).toBe(0);
  });
});
