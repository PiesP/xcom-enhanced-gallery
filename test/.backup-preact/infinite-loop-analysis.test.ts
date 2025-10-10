/**
 * 무한 루프 시뮬레이션 테스트
 * Vitest 타임아웃이 왜 작동하지 않는지 보여주는 예제
 */

import { describe, it, expect, vi } from 'vitest';

describe('Vitest 타임아웃 vs 무한 루프', () => {
  // ❌ 이 테스트는 타임아웃이 설정되어도 무한히 실행됨
  it.skip('동기적 무한 루프 - 타임아웃 무효', () => {
    console.log('테스트 시작');

    // 동기적 무한 루프 - JavaScript 엔진이 멈춤
    while (true) {
      // 이 루프는 이벤트 루프를 차단함
      // Vitest의 타임아웃 체크가 실행될 수 없음
      Math.random(); // 의미없는 동기적 작업
    }

    console.log('이 로그는 절대 출력되지 않음');
  });

  // ✅ 이 테스트는 타임아웃이 정상 작동함
  it('비동기 무한 루프 - 타임아웃 정상 작동', async () => {
    console.log('비동기 테스트 시작');

    // Promise 기반으로 타임아웃 테스트 구현
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Test timed out as expected'));
      }, 2000); // 2초 후 타임아웃
    });

    // 무한 루프 Promise (실제로는 타임아웃에 걸림)
    const infinitePromise = new Promise(resolve => {
      const loop = async () => {
        while (true) {
          await new Promise(r => setTimeout(r, 10)); // 10ms 대기
        }
      };
      loop();
    });

    // 타임아웃이 먼저 발생해야 함
    try {
      await Promise.race([infinitePromise, timeoutPromise]);
      throw new Error('Should not reach here');
    } catch (error) {
      expect(error.message).toBe('Test timed out as expected');
    }
  }, 10000); // 10초 타임아웃

  // 🔍 IntersectionObserver 무한 루프 시뮬레이션
  it('IntersectionObserver 즉시 콜백의 문제', () => {
    let renderCount = 0;
    const MAX_RENDERS = 5; // 안전장치

    // 문제가 되는 모킹 패턴
    const BadIntersectionObserver = class {
      constructor(callback) {
        this.callback = callback;
      }

      observe(element) {
        // ❌ 즉시 콜백 실행 - 동기적 루프 유발
        this.callback([
          {
            target: element,
            isIntersecting: true,
          },
        ]);
      }

      disconnect() {}
    };

    // 컴포넌트 렌더링 시뮬레이션
    const simulateComponentRender = () => {
      renderCount++;
      console.log(`렌더링 #${renderCount}`);

      if (renderCount > MAX_RENDERS) {
        throw new Error('무한 렌더링 감지 - 안전장치 작동');
      }

      // useEffect 시뮬레이션
      const observer = new BadIntersectionObserver(() => {
        // 콜백에서 상태 변경 → 리렌더링 유발
        simulateComponentRender(); // 재귀적 렌더링
      });

      // DOM 요소 관찰 시작
      observer.observe(document.createElement('div'));
    };

    // 무한 루프 시작 (안전장치로 제한됨)
    expect(() => simulateComponentRender()).toThrow('무한 렌더링 감지');
    expect(renderCount).toBe(MAX_RENDERS + 1);
  });

  // ✅ 개선된 IntersectionObserver 모킹
  it('개선된 IntersectionObserver - 안전한 비동기 콜백', async () => {
    let renderCount = 0;

    // 개선된 모킹 패턴
    const SafeIntersectionObserver = class {
      constructor(callback) {
        this.callback = callback;
        this._isDisconnected = false;
      }

      observe(element) {
        if (this._isDisconnected) return;

        // ✅ 비동기 콜백 실행 - 무한 루프 방지
        setTimeout(() => {
          if (!this._isDisconnected) {
            this.callback([
              {
                target: element,
                isIntersecting: true,
              },
            ]);
          }
        }, 0);
      }

      disconnect() {
        this._isDisconnected = true;
      }
    };

    // Promise 기반으로 변경
    return new Promise(resolve => {
      // 컴포넌트 렌더링 시뮬레이션
      const simulateComponentRender = () => {
        renderCount++;
        console.log(`안전한 렌더링 #${renderCount}`);

        // useEffect 시뮬레이션
        const observer = new SafeIntersectionObserver(() => {
          if (renderCount < 3) {
            // 제한된 리렌더링만 허용
            simulateComponentRender();
          } else {
            // 테스트 완료
            expect(renderCount).toBe(3);
            resolve();
          }
        });

        // DOM 요소 관찰 시작
        observer.observe(document.createElement('div'));
      };

      simulateComponentRender();
    });
  });
});
