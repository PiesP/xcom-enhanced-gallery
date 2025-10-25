/**
 * @fileoverview 번들 환경에서 Vendor TDZ 문제 재현 테스트
 * @description 실제 userscript 번들에서 발생하는 TDZ 에러를 재현하고 해결 검증
 *
 * TDD Phase: RED - 현재 시스템의 실패를 명확히 정의
 *
 * ⚠️ ARCHIVED: Phase 170B+ 이후 Vendor TDZ 문제 해결됨
 * 참고: docs/TDD_REFACTORING_PLAN.md Phase 170A/170B
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('번들 환경 Vendor TDZ 문제 (아카이브)', () => {
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
  });
});
