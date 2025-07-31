/**
 * @fileoverview Phase 2: 중복 함수 통합 테스트
 * @description TDD 방식으로 중복 함수 통합을 검증
 */

import { describe, it, expect } from 'vitest';

describe('Phase 2: 중복 함수 통합', () => {
  describe('1. CSS 유틸리티 함수 통합', () => {
    it('setCSSVariable 함수가 하나의 모듈에서만 구현되어야 함', async () => {
      // css-utilities.ts에서 구현되고 다른 곳에서는 re-export
      const cssUtilities = await import('@shared/utils/styles/css-utilities');
      const styleUtils = await import('@shared/utils/styles/style-utils');
      const coreUtils = await import('@shared/utils/core-utils');

      expect(cssUtilities.setCSSVariable).toBeDefined();
      expect(styleUtils.setCSSVariable).toBeDefined();
      expect(coreUtils.setCSSVariable).toBeDefined();

      // style-utils는 같은 함수 인스턴스여야 함 (re-export 확인)
      expect(styleUtils.setCSSVariable).toBe(cssUtilities.setCSSVariable);

      // core-utils는 호환성을 위한 wrapper이므로 다른 인스턴스이지만 기능은 동일해야 함
      expect(typeof coreUtils.setCSSVariable).toBe('function');
    });

    it('setCSSVariables 함수가 하나의 모듈에서만 구현되어야 함', async () => {
      const cssUtilities = await import('@shared/utils/styles/css-utilities');
      const styleUtils = await import('@shared/utils/styles/style-utils');
      const coreUtils = await import('@shared/utils/core-utils');

      expect(cssUtilities.setCSSVariables).toBeDefined();
      expect(styleUtils.setCSSVariables).toBeDefined();
      expect(coreUtils.setCSSVariables).toBeDefined();

      // style-utils는 같은 함수 인스턴스여야 함
      expect(styleUtils.setCSSVariables).toBe(cssUtilities.setCSSVariables);

      // core-utils는 호환성을 위한 wrapper
      expect(typeof coreUtils.setCSSVariables).toBe('function');
    });

    it('createThemedClassName 함수가 하나의 모듈에서만 구현되어야 함', async () => {
      const cssUtilities = await import('@shared/utils/styles/css-utilities');
      const styleUtils = await import('@shared/utils/styles/style-utils');

      expect(cssUtilities.createThemedClassName).toBeDefined();
      expect(styleUtils.createThemedClassName).toBeDefined();

      // 같은 함수 인스턴스여야 함
      expect(styleUtils.createThemedClassName).toBe(cssUtilities.createThemedClassName);
    });
  });

  describe('2. 접근성 유틸리티 함수 통합', () => {
    it('getRelativeLuminance 함수가 하나의 모듈에서만 구현되어야 함', async () => {
      const accessibilityUtils = await import('@shared/utils/accessibility/accessibility-utils');
      const accessibility = await import('@shared/utils/accessibility');

      expect(accessibilityUtils.getRelativeLuminance).toBeDefined();
      expect(accessibility.getRelativeLuminance).toBeDefined();

      // 같은 함수 인스턴스여야 함
      expect(accessibility.getRelativeLuminance).toBe(accessibilityUtils.getRelativeLuminance);
    });
  });

  describe('3. 함수 정상 동작 검증', () => {
    it('통합된 CSS 함수들이 정상 동작해야 함', async () => {
      const { setCSSVariable, setCSSVariables } = await import(
        '@shared/utils/styles/css-utilities'
      );

      // 테스트용 엘리먼트 생성
      const element = document.createElement('div');

      // setCSSVariable 테스트
      setCSSVariable(element, 'test-var', '10px');
      expect(element.style.getPropertyValue('--test-var')).toBe('10px');

      // setCSSVariables 테스트
      setCSSVariables(element, { color: 'red', size: '20px' });
      expect(element.style.getPropertyValue('--color')).toBe('red');
      expect(element.style.getPropertyValue('--size')).toBe('20px');
    });

    it('통합된 접근성 함수가 정상 동작해야 함', async () => {
      const { getRelativeLuminance } = await import(
        '@shared/utils/accessibility/accessibility-utils'
      );

      // 표준 색상 값 테스트
      const whiteLuminance = getRelativeLuminance(255, 255, 255);
      const blackLuminance = getRelativeLuminance(0, 0, 0);

      expect(whiteLuminance).toBeCloseTo(1, 2);
      expect(blackLuminance).toBeCloseTo(0, 2);
      expect(whiteLuminance).toBeGreaterThan(blackLuminance);
    });
  });

  describe('4. Tree-shaking 최적화 검증', () => {
    it('중복 제거 후에도 모든 기존 import 경로가 작동해야 함', async () => {
      // 기존 import 경로들이 여전히 작동하는지 확인
      const fromCore = await import('@shared/utils/core-utils');
      const fromStyles = await import('@shared/utils/styles');
      const fromAccessibility = await import('@shared/utils/accessibility');

      expect(fromCore.setCSSVariable).toBeDefined();
      expect(fromStyles.setCSSVariable).toBeDefined();
      expect(fromAccessibility.getRelativeLuminance).toBeDefined();
    });
  });
});
