/**
 * @fileoverview ScrollCoordinator 품질 게이트 테스트 (SR-6)
 * 목적: 플래그 기본값 true 전환 전 품질 기준 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupVendorMocks, cleanupVendorMocks } from '../../utils/mocks/vendor-mocks-clean';

describe('ScrollCoordinator Quality Gates', () => {
  beforeEach(() => {
    setupVendorMocks();

    // 환경 설정
    if (typeof globalThis.window === 'undefined') {
      (globalThis as any).window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        scrollX: 0,
        scrollY: 0,
        innerHeight: 600,
        dispatchEvent: vi.fn(),
      };
    }

    if (typeof globalThis.document === 'undefined') {
      (globalThis as any).document = {
        documentElement: {
          scrollHeight: 1000,
        },
      };
    }

    if (typeof globalThis.requestAnimationFrame === 'undefined') {
      (globalThis as any).requestAnimationFrame = vi.fn(cb => {
        globalThis.setTimeout(cb, 16); // ~60fps 시뮬레이션
        return 1;
      });
    }

    if (typeof globalThis.setTimeout === 'undefined') {
      (globalThis as any).setTimeout = vi.fn(cb => {
        Promise.resolve().then(cb);
        return 1;
      });
    }

    if (typeof globalThis.performance === 'undefined') {
      let now = 0;
      (globalThis as any).performance = {
        now: () => {
          now += 16; // 60fps 기준 16ms씩 증가
          return now;
        },
      };
    }
  });

  afterEach(() => {
    cleanupVendorMocks();
  });

  describe('Event Listener Leak Detection', () => {
    it('coordinator 사용 후 리스너 누수 없음', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      let addCount = 0;
      let removeCount = 0;

      const originalAdd = globalThis.window.addEventListener;
      const originalRemove = globalThis.window.removeEventListener;

      globalThis.window.addEventListener = vi.fn((...args) => {
        if (args[0] === 'scroll') addCount++;
        return originalAdd?.call(globalThis.window, ...args);
      });

      globalThis.window.removeEventListener = vi.fn((...args) => {
        if (args[0] === 'scroll') removeCount++;
        return originalRemove?.call(globalThis.window, ...args);
      });

      // 사용 패턴 시뮬레이션
      const coord = getScrollCoordinator();
      coord.attach();

      const unsub1 = coord.subscribe(() => {});
      const unsub2 = coord.subscribe(() => {});

      unsub1();
      unsub2();
      coord.detach();

      // 추가된 만큼 제거되어야 함
      expect(addCount).toBe(removeCount);
      expect(addCount).toBeGreaterThan(0); // 실제로 리스너가 추가되었는지 확인
    });

    it('여러 컴포넌트 사용 시나리오에서 리스너 정리', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      let scrollListenerCount = 0;
      const originalAdd = globalThis.window.addEventListener;
      const originalRemove = globalThis.window.removeEventListener;

      globalThis.window.addEventListener = vi.fn((...args) => {
        if (args[0] === 'scroll') scrollListenerCount++;
        return originalAdd?.call(globalThis.window, ...args);
      });

      globalThis.window.removeEventListener = vi.fn((...args) => {
        if (args[0] === 'scroll') scrollListenerCount--;
        return originalRemove?.call(globalThis.window, ...args);
      });

      // 여러 컴포넌트가 순차적으로 사용하는 시나리오
      const coords = [];
      const unsubs = [];

      for (let i = 0; i < 5; i++) {
        const coord = getScrollCoordinator();
        coord.attach();
        const unsub = coord.subscribe(() => {});
        coords.push(coord);
        unsubs.push(unsub);
      }

      // singleton이므로 리스너는 1개만 있어야 함
      expect(scrollListenerCount).toBe(1);

      // 모든 구독 해제
      unsubs.forEach(unsub => unsub());
      coords[0].detach(); // singleton이므로 하나만 detach

      // 모든 리스너가 정리되었어야 함
      expect(scrollListenerCount).toBe(0);
    });
  });

  describe('Idle Detection Accuracy', () => {
    it('idle 감지 타이밍이 ±10ms 허용 범위 내', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator({ idleDelay: 150 });
      coord.attach();

      let idleStartTime = 0;
      let idleDetectedTime = 0;

      const unsub = coord.idle.subscribe(isIdle => {
        if (isIdle && idleStartTime > 0) {
          idleDetectedTime = globalThis.performance.now();
        }
      });

      // 스크롤 이벤트 발생
      idleStartTime = globalThis.performance.now();
      const scrollEvent = new Event('scroll');
      globalThis.window.dispatchEvent(scrollEvent);

      // idle 감지될 때까지 대기
      await new Promise(resolve => {
        const check = () => {
          if (coord.idle.value) {
            resolve(undefined);
          } else {
            globalThis.setTimeout(check, 10);
          }
        };
        globalThis.setTimeout(check, 160); // 150ms + 여유
      });

      const actualDelay = idleDetectedTime - idleStartTime;
      const expectedDelay = 150;
      const tolerance = 10;

      expect(Math.abs(actualDelay - expectedDelay)).toBeLessThanOrEqual(tolerance);

      unsub();
      coord.detach();
    });
  });

  describe('Signal Update Frequency', () => {
    it('120fps 1초 스크롤 시뮬레이션에서 파생 업데이트 < 65회', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      let positionUpdates = 0;
      let directionUpdates = 0;
      let progressUpdates = 0;

      const unsubPos = coord.position.subscribe(() => positionUpdates++);
      const unsubDir = coord.direction.subscribe(() => directionUpdates++);
      const unsubProg = coord.progress.subscribe(() => progressUpdates++);

      // 120fps로 1초간 스크롤 이벤트 시뮬레이션
      const fps = 120;
      const totalFrames = fps;

      // scrollY 값을 점진적으로 변경하면서 이벤트 발생
      for (let frame = 0; frame < totalFrames; frame++) {
        (globalThis.window as any).scrollY = frame * 2; // 매 프레임마다 2px씩 증가

        const scrollEvent = new Event('scroll');
        globalThis.window.dispatchEvent(scrollEvent);

        // rAF 처리 대기
        await new Promise(resolve => globalThis.requestAnimationFrame(resolve));
      }

      // 최대 허용 업데이트 수
      const maxAllowedUpdates = 65;

      expect(positionUpdates).toBeLessThan(maxAllowedUpdates);
      expect(directionUpdates).toBeLessThan(maxAllowedUpdates);
      expect(progressUpdates).toBeLessThan(maxAllowedUpdates);

      // 실제로 업데이트가 발생했는지 확인 (0이면 안됨)
      expect(positionUpdates).toBeGreaterThan(0);
      expect(directionUpdates).toBeGreaterThan(0);
      expect(progressUpdates).toBeGreaterThan(0);

      unsubPos();
      unsubDir();
      unsubProg();
      coord.detach();
    });

    it('rAF 배치로 인한 업데이트 최적화 확인', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      let updateCount = 0;
      const unsub = coord.position.subscribe(() => updateCount++);

      // 동일 프레임 내 여러 스크롤 이벤트 발생
      (globalThis.window as any).scrollY = 100;
      globalThis.window.dispatchEvent(new Event('scroll'));

      (globalThis.window as any).scrollY = 200;
      globalThis.window.dispatchEvent(new Event('scroll'));

      (globalThis.window as any).scrollY = 300;
      globalThis.window.dispatchEvent(new Event('scroll'));

      // rAF 처리 대기
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      // 여러 이벤트가 하나의 업데이트로 배치되어야 함
      expect(updateCount).toBeLessThanOrEqual(2); // 최대 2번 (초기값 + 배치된 업데이트)

      unsub();
      coord.detach();
    });
  });

  describe('Performance Characteristics', () => {
    it('대량 구독자 환경에서도 성능 유지', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      // 100개 구독자 생성
      const subscribers = [];
      for (let i = 0; i < 100; i++) {
        const unsub = coord.subscribe(() => {
          // 가벼운 작업
          Math.random();
        });
        subscribers.push(unsub);
      }

      const startTime = globalThis.performance.now();

      // 스크롤 이벤트 발생
      (globalThis.window as any).scrollY = 500;
      globalThis.window.dispatchEvent(new Event('scroll'));

      // 처리 완료 대기
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      const endTime = globalThis.performance.now();
      const processingTime = endTime - startTime;

      // 100개 구독자 처리가 50ms 이내 완료되어야 함
      expect(processingTime).toBeLessThan(50);

      // 정리
      subscribers.forEach(unsub => unsub());
      coord.detach();
    });

    it('메모리 사용량 최적화 확인', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      // 반복적인 생성/삭제 사이클
      for (let cycle = 0; cycle < 10; cycle++) {
        const coord = getScrollCoordinator();
        coord.attach();

        const unsubs = [];
        for (let i = 0; i < 10; i++) {
          unsubs.push(coord.subscribe(() => {}));
        }

        // 모든 구독 해제
        unsubs.forEach(unsub => unsub());
        coord.detach();
      }

      // 마지막 사이클 후에도 정상 동작 확인
      const coord = getScrollCoordinator();
      coord.attach();

      let called = false;
      const unsub = coord.subscribe(() => {
        called = true;
      });

      (globalThis.window as any).scrollY = 100;
      globalThis.window.dispatchEvent(new Event('scroll'));
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      expect(called).toBe(true);

      unsub();
      coord.detach();
    });
  });

  describe('Correctness Verification', () => {
    it('스크롤 위치 계산 정확성', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      // 다양한 스크롤 위치에서 정확성 검증
      const testPositions = [0, 100, 500, 999, 1000];

      for (const y of testPositions) {
        (globalThis.window as any).scrollY = y;
        (globalThis.document.documentElement as any).scrollHeight = 1000;
        (globalThis.window as any).innerHeight = 600;

        globalThis.window.dispatchEvent(new Event('scroll'));
        await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

        const snapshot = coord.position.value;
        expect(snapshot.y).toBe(y);
        expect(snapshot.maxY).toBe(400); // 1000 - 600
        expect(snapshot.atTop).toBe(y === 0);
        expect(snapshot.atBottom).toBe(y >= 400);

        const expectedProgress = y / 400;
        const actualProgress = coord.progress.value;
        expect(Math.abs(actualProgress - expectedProgress)).toBeLessThan(0.01);
      }

      coord.detach();
    });

    it('방향 감지 정확성', async () => {
      const { getScrollCoordinator } = await import('@shared/scroll');

      const coord = getScrollCoordinator();
      coord.attach();

      let detectedDirection = 'none';
      const unsub = coord.direction.subscribe(dir => {
        detectedDirection = dir;
      });

      // 초기 상태
      expect(coord.direction.value).toBe('none');

      // 아래로 스크롤
      (globalThis.window as any).scrollY = 0;
      globalThis.window.dispatchEvent(new Event('scroll'));
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      (globalThis.window as any).scrollY = 100;
      globalThis.window.dispatchEvent(new Event('scroll'));
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      expect(detectedDirection).toBe('down');

      // 위로 스크롤
      (globalThis.window as any).scrollY = 50;
      globalThis.window.dispatchEvent(new Event('scroll'));
      await new Promise(resolve => globalThis.requestAnimationFrame(resolve));

      expect(detectedDirection).toBe('up');

      unsub();
      coord.detach();
    });
  });
});
