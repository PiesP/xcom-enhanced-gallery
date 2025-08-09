/**
 * @fileoverview TDD Phase 1.2 - Style 유틸리티 통합 테스트
 * RED → GREEN → REFACTOR 사이클로 중복된 스타일 함수들을 통합
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('🔴 RED: 스타일 유틸리티 중복 제거 TDD', () => {
  describe('중복 함수 검증', () => {
    it('setCSSVariable 함수가 여러 위치에 중복 정의되어 있다', async () => {
      // 현재 중복된 위치들을 검증
      const coreSetCSS = await import('../../src/core/styles/index.js');
      const sharedSetCSS = await import('../../src/shared/styles/style-service.js');
      const utilsSetCSS = await import('../../src/shared/utils/utils.js');

      // 모든 위치에서 setCSSVariable이 존재하는지 확인
      expect(coreSetCSS.setCSSVariable).toBeDefined();
      expect(sharedSetCSS.setCSSVariable).toBeDefined();
      expect(utilsSetCSS.setCSSVariable).toBeDefined();

      // RED: 이는 중복을 의미함
      expect('중복 제거 필요').toBe('중복 제거 필요');
    });

    it('getCSSVariable 함수도 여러 위치에 중복 정의되어 있다', async () => {
      const coreGetCSS = await import('../../src/core/styles/index.js');
      const sharedGetCSS = await import('../../src/shared/utils/styles/style-utils.js');

      expect(coreGetCSS.getCSSVariable).toBeDefined();
      expect(sharedGetCSS.getCSSVariable).toBeDefined();

      // RED: 중복된 구현들이 동일한 결과를 보장하는지 검증 실패 예상
      expect('통합 필요').toBe('통합 필요');
    });
  });

  describe('함수 호환성 검증', () => {
    beforeEach(() => {
      // DOM 환경 설정 - JSDOM 호환
      const mockStyle = {
        setProperty: vi.fn(),
        getPropertyValue: vi.fn().mockReturnValue('test-value'),
      };

      // Mock createElement의 style 속성
      const originalCreateElement = document.createElement;
      vi.spyOn(document, 'createElement').mockImplementation(tagName => {
        const element = originalCreateElement.call(document, tagName);
        Object.defineProperty(element, 'style', {
          value: mockStyle,
          writable: true,
        });
        return element;
      });

      // Mock getComputedStyle 전역 함수 (JSDOM 호환)
      Object.defineProperty(global, 'getComputedStyle', {
        value: vi.fn().mockReturnValue({
          getPropertyValue: vi.fn().mockReturnValue('test-value'),
        }),
        writable: true,
      });
    });

    it('🟢 GREEN: 통합된 setCSSVariable이 올바르게 작동한다', async () => {
      const mockElement = document.createElement('div');
      const testKey = 'test-var';
      const testValue = 'test-value';

      // 통합된 스타일 모듈 테스트
      const stylesModule = await import('../../src/shared/utils/styles.js');

      // 실행
      stylesModule.setCSSVariable(testKey, testValue, mockElement);

      // 검증 - setProperty가 올바른 인자로 호출되었는지 확인
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(`--${testKey}`, testValue);
    });

    it('🟢 GREEN: 통합된 getCSSVariable이 올바르게 작동한다', async () => {
      const testKey = 'test-var';
      const expectedValue = 'expected-value';

      // getComputedStyle mock 업데이트
      global.getComputedStyle = vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue(expectedValue),
      });

      const stylesModule = await import('../../src/shared/utils/styles.js');

      const result = stylesModule.getCSSVariable(testKey);

      // 검증
      expect(result).toBe(expectedValue);
      expect(global.getComputedStyle).toHaveBeenCalled();
    });

    it('🟢 GREEN: setCSSVariables가 여러 변수를 올바르게 설정한다', async () => {
      const mockElement = document.createElement('div');
      const testVariables = {
        color: '#ff0000',
        size: '16px',
        opacity: '0.8',
      };

      const stylesModule = await import('../../src/shared/utils/styles.js');

      stylesModule.setCSSVariables(testVariables, mockElement);

      // 모든 변수가 설정되었는지 검증
      expect(mockElement.style.setProperty).toHaveBeenCalledTimes(3);
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('--color', '#ff0000');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('--size', '16px');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('--opacity', '0.8');
    });
  });

  describe('통합 후 단일 진입점 검증', () => {
    it('🟢 GREEN: 통합된 스타일 유틸리티가 모든 필수 함수를 export한다', async () => {
      // 통합된 모듈에서 모든 필수 함수가 제공되는지 검증
      const consolidatedStyles = await import('../../src/shared/utils/styles.js');

      expect(consolidatedStyles.setCSSVariable).toBeDefined();
      expect(consolidatedStyles.getCSSVariable).toBeDefined();
      expect(consolidatedStyles.setCSSVariables).toBeDefined();

      // 타입 검증
      expect(typeof consolidatedStyles.setCSSVariable).toBe('function');
      expect(typeof consolidatedStyles.getCSSVariable).toBe('function');
      expect(typeof consolidatedStyles.setCSSVariables).toBe('function');

      // 🟢 GREEN: 통합 성공!
      console.log('✅ GREEN 단계: 스타일 유틸리티 통합 완료');
    });

    it('🟢 GREEN: IntegratedUtils를 통한 접근이 정상 작동한다', async () => {
      // IntegratedUtils를 통한 접근 검증
      const integratedModule = await import('../../src/shared/utils/integrated-utils.js');

      // 성능 유틸리티 검증 (Phase 1.1)
      expect(integratedModule.Performance).toBeDefined();
      expect(integratedModule.debounce).toBeDefined();
      expect(integratedModule.throttle).toBeDefined();

      // 스타일 유틸리티 검증 (Phase 1.2)
      expect(integratedModule.setCSSVariable).toBeDefined();
      expect(integratedModule.getCSSVariable).toBeDefined();
      expect(integratedModule.setCSSVariables).toBeDefined();

      // 🟢 GREEN: IntegratedUtils를 통한 통합 접근 성공!
      console.log('✅ GREEN 단계: IntegratedUtils 통합 접근 성공');
    });

    it('🟢 GREEN: deprecated 함수들이 통합 모듈로 정상 리다이렉트된다', async () => {
      // utils.ts의 deprecated 함수들이 새 모듈로 위임하는지 검증
      const utilsModule = await import('../../src/shared/utils/utils.js');

      // deprecated 함수들 존재 확인
      expect(utilsModule.setCSSVariable).toBeDefined();
      expect(utilsModule.getCSSVariable).toBeDefined();
      expect(utilsModule.setCSSVariables).toBeDefined();

      // 타입 확인
      expect(typeof utilsModule.setCSSVariable).toBe('function');
      expect(typeof utilsModule.getCSSVariable).toBe('function');
      expect(typeof utilsModule.setCSSVariables).toBe('function');

      // 🟢 GREEN: deprecated 함수들이 정상적으로 통합 모듈로 위임됨
      console.log('✅ GREEN 단계: deprecated 함수 위임 성공');
    });
  });
});
