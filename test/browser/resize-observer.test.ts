/* global ResizeObserverSize */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';

/**
 * @fileoverview ResizeObserver Browser API Tests
 *
 * 목적: ResizeObserver API를 사용한 반응형 레이아웃 테스트
 * - 요소 크기 변경 감지
 * - 콜백 실행 검증
 * - 관찰 시작/중지
 */

describe('ResizeObserver API', () => {
  setupGlobalTestIsolation();

  let container: HTMLDivElement;
  let resizeObserver: ResizeObserver | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    document.body.removeChild(container);
  });

  it('should observe element size changes', async () => {
    const resizeEntries: Array<{ width: number; height: number }> = [];

    return new Promise<void>(resolve => {
      resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const { width, height } = entry.contentRect;
          resizeEntries.push({ width, height });

          // 두 번째 리사이즈 확인 후 종료
          if (resizeEntries.length === 2) {
            expect(resizeEntries[0]).toEqual({ width: 100, height: 100 });
            expect(resizeEntries[1]).toEqual({ width: 200, height: 150 });
            resolve();
          }
        });
      });

      resizeObserver.observe(container);

      // 크기 변경 트리거
      setTimeout(() => {
        container.style.width = '200px';
        container.style.height = '150px';
      }, 100);
    });
  });

  it('should handle multiple observed elements', async () => {
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    element1.style.width = '50px';
    element2.style.width = '75px';
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    const observations = new Map<Element, number>();

    return new Promise<void>(resolve => {
      resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const count = observations.get(entry.target) || 0;
          observations.set(entry.target, count + 1);
        });

        if (observations.size === 2) {
          expect(observations.get(element1)).toBeGreaterThan(0);
          expect(observations.get(element2)).toBeGreaterThan(0);
          document.body.removeChild(element1);
          document.body.removeChild(element2);
          resolve();
        }
      });

      resizeObserver.observe(element1);
      resizeObserver.observe(element2);
    });
  });

  it('should stop observing after unobserve', async () => {
    let callbackCount = 0;

    resizeObserver = new ResizeObserver(() => {
      callbackCount++;
    });

    resizeObserver.observe(container);

    // 첫 번째 관찰 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    const countAfterObserve = callbackCount;
    expect(countAfterObserve).toBeGreaterThan(0);

    // 관찰 중지
    resizeObserver.unobserve(container);

    // 크기 변경 (관찰되지 않아야 함)
    container.style.width = '300px';
    await new Promise(resolve => setTimeout(resolve, 100));

    // 콜백이 추가로 호출되지 않았는지 확인
    expect(callbackCount).toBe(countAfterObserve);
  });

  it('should disconnect all observations', async () => {
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    let callbackCount = 0;

    resizeObserver = new ResizeObserver(() => {
      callbackCount++;
    });

    resizeObserver.observe(element1);
    resizeObserver.observe(element2);

    // 초기 관찰 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    const countBeforeDisconnect = callbackCount;

    // 모든 관찰 중지
    resizeObserver.disconnect();

    // 크기 변경 (관찰되지 않아야 함)
    element1.style.width = '200px';
    element2.style.width = '200px';
    await new Promise(resolve => setTimeout(resolve, 100));

    // 콜백이 추가로 호출되지 않았는지 확인
    expect(callbackCount).toBe(countBeforeDisconnect);

    document.body.removeChild(element1);
    document.body.removeChild(element2);
  });

  it('should report contentBoxSize and borderBoxSize', async () => {
    return new Promise<void>(resolve => {
      resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
          expect(entry.contentRect).toBeDefined();
          expect(entry.contentRect.width).toBeGreaterThan(0);
          expect(entry.contentRect.height).toBeGreaterThan(0);

          // contentBoxSize와 borderBoxSize는 브라우저에 따라 지원 여부가 다름
          if (entry.contentBoxSize) {
            const size = Array.isArray(entry.contentBoxSize)
              ? entry.contentBoxSize[0]
              : (entry.contentBoxSize as unknown as ResizeObserverSize);
            expect(size).toBeDefined();
            expect(Number.isFinite(size.inlineSize)).toBe(true);
          }

          resolve();
        }
      });

      resizeObserver.observe(container);
    });
  });

  it('should handle rapid size changes', async () => {
    const resizeCount = { value: 0 };

    resizeObserver = new ResizeObserver(() => {
      resizeCount.value++;
    });

    resizeObserver.observe(container);

    // 빠른 연속 크기 변경
    container.style.width = '110px';
    container.style.width = '120px';
    container.style.width = '130px';
    container.style.width = '140px';
    container.style.width = '150px';

    // 디바운싱 대기
    await new Promise(resolve => setTimeout(resolve, 200));

    // ResizeObserver는 연속된 변경을 일괄 처리함
    expect(resizeCount.value).toBeGreaterThan(0);
  });

  it('should work with display:none and visibility:hidden', async () => {
    const observations: string[] = [];

    resizeObserver = new ResizeObserver(() => {
      observations.push(`state:${container.style.display || 'block'}`);
    });

    resizeObserver.observe(container);

    await new Promise(resolve => setTimeout(resolve, 100));

    // display:none으로 변경
    container.style.display = 'none';
    await new Promise(resolve => setTimeout(resolve, 100));

    // 다시 표시
    container.style.display = 'block';
    await new Promise(resolve => setTimeout(resolve, 100));

    // 관찰이 발생했는지 확인
    expect(observations.length).toBeGreaterThan(0);
  });
});
