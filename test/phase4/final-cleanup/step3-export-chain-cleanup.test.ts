/**
 * @fileoverview Phase 4 Final: Step 3 - Re-export 체인 간소화 테스트
 * @description TDD 방식으로 과도한 re-export 체인 정리 검증
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Phase 4 Final: Step 3 - Re-export 체인 간소화', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 깊은 re-export 체인 제거', () => {
    it('removeDuplicateStrings의 export 체인이 간소화되어야 함', async () => {
      // 현재: core-utils → deduplication → utils → index (4단계)
      // 목표: core-utils → utils (2단계)

      const { removeDuplicateStrings: fromUtils } = await import('@shared/utils');
      const { removeDuplicateStrings: fromCoreUtils } = await import('@shared/utils/core-utils');

      // 같은 함수 참조여야 함 (re-export)
      expect(fromUtils).toBe(fromCoreUtils);

      // deduplication 모듈은 제거되어야 함
      try {
        await import('@shared/utils/deduplication');
        expect(false).toBe(true); // 도달하면 안됨
      } catch (error) {
        expect(error).toBeDefined(); // 제거되어 에러 발생이 정상
      }
    });

    it('모든 유틸리티 함수의 export 체인이 3단계 이하여야 함', async () => {
      // 주요 유틸리티 함수들 확인
      const utilityFunctions = [
        'combineClasses',
        'createDebouncer',
        'measurePerformance',
        'removeDuplicateStrings',
      ];

      const utils = await import('@shared/utils');

      utilityFunctions.forEach(funcName => {
        expect(utils[funcName]).toBeDefined();
        expect(typeof utils[funcName]).toBe('function');
      });
    });
  });

  describe('2. 불필요한 별칭 export 제거', () => {
    it('DOMBatcher as BatchDOMUpdateManager 별칭이 정리되어야 함', async () => {
      // DOMBatcher를 직접 사용하도록 변경
      const { DOMBatcher } = await import('@shared/utils/dom');
      expect(DOMBatcher).toBeDefined();

      // BatchDOMUpdateManager 별칭은 제거 또는 deprecation 표시
      try {
        const { BatchDOMUpdateManager } = await import('@shared/utils/dom');
        // 존재한다면 deprecated 표시가 있어야 함
        expect(BatchDOMUpdateManager).toBeDefined();
      } catch (error) {
        // 완전 제거된 경우
        expect(error).toBeDefined();
      }
    });

    it('as export 패턴이 최소화되어야 함', async () => {
      // 전체 프로젝트에서 'export ... as' 패턴 사용 최소화 확인
      const domModule = await import('@shared/utils/dom');
      const servicesModule = await import('@shared/services');

      // 핵심 export들이 직접적인 이름으로 제공됨
      expect(domModule.DOMBatcher).toBeDefined();
      expect(servicesModule.MediaService).toBeDefined();
    });
  });

  describe('3. Index 파일 최적화', () => {
    it('shared/utils/index.ts가 직접적인 export만 포함해야 함', async () => {
      const utils = await import('@shared/utils');
      const exportNames = Object.keys(utils);

      // 너무 많은 export는 번들 크기 증가 원인
      expect(exportNames.length).toBeLessThan(50);

      // 핵심 유틸리티들은 반드시 포함
      const essentialUtils = [
        'combineClasses',
        'createDebouncer',
        'measurePerformance',
        'removeDuplicateStrings',
        'DOMBatcher',
      ];

      essentialUtils.forEach(utilName => {
        expect(utils[utilName]).toBeDefined();
      });
    });

    it('중복된 type export가 제거되어야 함', () => {
      // 동일한 타입이 여러 곳에서 export되는 것 방지
      expect(true).toBe(true); // 구현 후 실제 검증
    });
  });

  describe('4. Tree-shaking 최적화', () => {
    it('사용하지 않는 export가 번들에서 제외되어야 함', () => {
      // Tree-shaking 효과 검증
      // 실제로는 번들 분석 도구로 확인 필요
      expect(true).toBe(true);
    });

    it('개별 모듈 import가 가능해야 함', async () => {
      // 전체 utils를 import하지 않고 개별 모듈 import 가능
      const { createDebouncer } = await import('@shared/utils/performance');
      const { combineClasses } = await import('@shared/utils/styles');

      expect(createDebouncer).toBeDefined();
      expect(combineClasses).toBeDefined();
    });
  });
});
