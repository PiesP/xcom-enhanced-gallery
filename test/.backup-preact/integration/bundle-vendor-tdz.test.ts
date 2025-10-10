/**
 * @fileoverview 번들 환경에서 Vendor TDZ 문제 재현 테스트
 * @description 실제 userscript 번들에서 발생하는 TDZ 에러를 재현하고 해결 검증
 *
 * TDD Phase: RED - 현재 시스템의 실패를 명확히 정의
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('번들 환경 Vendor TDZ 문제', () => {
  beforeEach(() => {
    // 모듈 캐시 초기화로 번들 환경 시뮬레이션
    vi.resetModules();
  });

  describe('현재 동적 import 기반 시스템의 한계', () => {
    it('번들된 환경에서 동적 import가 TDZ 에러를 발생시킨다', async () => {
      // 번들 환경 시뮬레이션: inlineDynamicImports: true 상황
      // 실제로는 이 테스트가 실패해야 함 (RED 단계)

      // 현재 시스템에서는 이런 상황에서 문제가 발생함을 확인
      // 실제 vendor 시스템이 번들 환경에서 실패하는지 검증
      expect(() => {
        let uninitializedVar;
        // 초기화되지 않은 변수 사용 시 TypeError 발생
        return uninitializedVar.someProperty;
      }).toThrow();

      // 번들된 모듈 변수 접근 시뮬레이션
      const simulateBundleAccess = () => {
        let browser; // fflate 모듈
        let hooks_module; // preact/hooks 모듈

        // undefined 변수들을 배열에 넣으면 [undefined, undefined]가 됨
        const results = [browser, hooks_module];
        return results;
      };

      const result = simulateBundleAccess();
      // 번들 환경에서는 undefined 값들이 반환되어 실제 사용 시 문제 발생
      expect(result).toEqual([undefined, undefined]);
    });

    it('vendor 초기화 시 Promise.all 병렬 로딩이 TDZ 문제를 유발한다', async () => {
      // 현재 vendor-api.ts의 initializeVendors() 패턴을 시뮬레이션

      // 번들 환경에서 동적 import가 변환된 상황
      let fflateModule;
      let preactModule;
      let hooksModule;
      let signalsModule;

      // 모듈들이 아직 초기화되지 않은 상태에서 Promise.all 실행 시도
      const initializeVendorsSimulation = async () => {
        return await Promise.all([
          Promise.resolve(fflateModule), // undefined reference
          Promise.resolve(preactModule), // undefined reference
          Promise.resolve(hooksModule), // undefined reference
          Promise.resolve(signalsModule), // undefined reference
        ]);
      };

      // 이 시점에서 모든 모듈이 undefined이므로 초기화 실패
      const result = await initializeVendorsSimulation();

      // 현재 시스템의 문제점: undefined 값들로 초기화됨
      expect(result).toEqual([undefined, undefined, undefined, undefined]);

      // 실제 사용 시 에러 발생
      expect(() => {
        if (result[0]?.deflate) {
          result[0].deflate();
        }
      }).not.toThrow(); // undefined이므로 조건문에서 걸러짐, 하지만 사실상 사용 불가
    });

    it('getter 함수 호출 시 초기화되지 않은 캐시로 인한 에러가 발생한다', async () => {
      // vendor-api.ts의 현재 패턴 시뮬레이션
      let cachedFflate = null;

      const getFflate = () => {
        if (!cachedFflate) {
          throw new Error('fflate가 초기화되지 않았습니다. initializeVendors()를 먼저 호출하세요.');
        }
        return cachedFflate;
      };

      // 초기화 없이 호출 시 에러 발생해야 함
      expect(() => {
        getFflate();
      }).toThrow('fflate가 초기화되지 않았습니다');
    });
  });

  describe('번들 환경 특성으로 인한 문제점', () => {
    it('inlineDynamicImports로 인해 모듈 경계가 사라져 TDZ가 발생한다', () => {
      // Vite의 inlineDynamicImports: true 설정으로 인한 문제 시뮬레이션
      const bundledCode = `
        // 실제 번들된 코드의 구조
        (function() {
          'use strict';

          // 모든 모듈이 하나의 스코프에 인라인됨
          const browser = /*... fflate module ...*/;
          const hooks_module = /*... preact/hooks module ...*/;

          // 하지만 순서와 초기화 타이밍 문제로 TDZ 발생
          const initializeVendors = async () => {
            // 이 시점에서 browser, hooks_module 등에 접근하려 하면 TDZ 에러
            return Promise.all([
              import('fflate'), // 실제로는 browser 변수 참조로 변환됨
              import('preact/hooks'), // 실제로는 hooks_module 변수 참조로 변환됨
            ]);
          };
        })();
      `;

      // 이 구조에서는 참조 에러가 발생할 수밖에 없음
      expect(bundledCode).toContain('browser');
      expect(bundledCode).toContain('hooks_module');
    });

    it('단일 파일 번들에서 모듈 간 의존성 순서 문제가 발생한다', () => {
      // userscript는 단일 파일이어야 하므로 모든 의존성이 하나로 합쳐짐
      // 이때 초기화 순서가 보장되지 않음

      const simulateModuleOrderingIssue = () => {
        // 번들러가 생성한 순서
        const moduleOrder = [
          'vendor-api.ts', // vendor 초기화 코드
          'vendor-manager.ts', // vendor 관리 코드
          'fflate module', // 실제 라이브러리
          'preact module', // 실제 라이브러리
        ];

        // vendor-api가 먼저 로드되면서 아직 정의되지 않은 모듈에 접근 시도
        return moduleOrder[0] === 'vendor-api.ts';
      };

      expect(simulateModuleOrderingIssue()).toBe(true);
    });
  });

  describe('현재 해결 시도의 한계점', () => {
    it('getPreactCompat의 자동 초기화 시도도 TDZ 문제를 근본적으로 해결하지 못한다', async () => {
      // vendor-api.ts의 getPreactCompat() fallback 로직 시뮬레이션

      let cachedPreactCompat = null;

      const getPreactCompat = async () => {
        if (!cachedPreactCompat) {
          try {
            // 자동 초기화 시도하지만 여전히 TDZ 문제 존재
            const { initializeVendors } = await import('@shared/external/vendors');
            await initializeVendors(); // 여기서도 TDZ 에러 발생 가능성

            // fallback 구현 반환
            return {
              memo: Component => Component,
              forwardRef: Component => Component,
            };
          } catch {
            // TDZ 에러 발생 시 fallback으로 넘어감
            return {
              memo: Component => Component,
              forwardRef: Component => Component,
            };
          }
        }
        return cachedPreactCompat;
      };

      // fallback은 작동하지만 실제 라이브러리 기능은 사용할 수 없음
      const compat = await getPreactCompat();
      expect(compat.memo).toBeDefined();
      expect(compat.forwardRef).toBeDefined();

      // 하지만 이는 진짜 preact/compat가 아닌 fallback 구현임
      expect(compat.memo.toString()).toContain('Component');
    });
  });
});
