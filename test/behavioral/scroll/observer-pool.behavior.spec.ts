/* SR-3: Intersection Observer Pool Behavior Tests */
import { describe, it, expect, beforeEach } from 'vitest';
import { registerIntersection, __debugGetIntersectionObserverStats } from '@/shared/scroll';

// jsdom 은 IntersectionObserver 기본 미구현 가능 → 간단한 폴리필 주입
beforeEach(() => {
  if (!(globalThis as any).IntersectionObserver) {
    class IO {
      private _cb: (entries: unknown[]) => void;
      constructor(cb: (_entries: unknown[]) => void) {
        this._cb = cb;
      }
      observe(el: Element) {
        // 즉시 한 번 콜백 (isIntersecting=true) 시뮬레이션
        this._cb([{ target: el, isIntersecting: true }]);
      }
      unobserve() {
        /* noop */
      }
      disconnect() {
        /* noop */
      }
    }
    (globalThis as any).IntersectionObserver = IO;
  }
});

describe('ObserverPool - Intersection', () => {
  it('같은 옵션 여러 요소 등록 시 풀 1개 유지', () => {
    const el1 = globalThis.document.createElement('div');
    const el2 = globalThis.document.createElement('div');
    globalThis.document.body.append(el1, el2);
    const un1 = registerIntersection(el1, () => {});
    const un2 = registerIntersection(el2, () => {});
    const stats = __debugGetIntersectionObserverStats();
    expect(stats.total).toBe(1);
    expect(stats.counts[0]).toBe(2);
    un1();
    un2();
  });

  it('마지막 요소 해제 시 버킷 제거', () => {
    const el = globalThis.document.createElement('div');
    globalThis.document.body.append(el);
    const un = registerIntersection(el, () => {});
    expect(__debugGetIntersectionObserverStats().total).toBe(1);
    un();
    expect(__debugGetIntersectionObserverStats().total).toBe(0);
  });
});
