/**
 * @fileoverview Accessibility 모듈 구조 검증 테스트 (Phase 104)
 * @description accessibility-utils.ts를 3개 모듈로 분해한 구조를 검증합니다.
 */

import { describe, it, expect } from 'vitest';

describe('Phase 104: Accessibility 모듈 구조 검증', () => {
  describe('Phase 104.1: Color Contrast 모듈', () => {
    it('color-contrast 모듈이 색상 파싱 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/color-contrast');

      expect(module.parseColor).toBeDefined();
      expect(module.getRelativeLuminance).toBeDefined();
      expect(module.safeParseInt).toBeDefined();
    });

    it('color-contrast 모듈이 대비 비율 계산 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/color-contrast');

      expect(module.calculateContrastRatio).toBeDefined();
      expect(module.calculateLuminance).toBeDefined();
    });

    it('color-contrast 모듈이 WCAG 검증 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/color-contrast');

      expect(module.meetsWCAGAA).toBeDefined();
      expect(module.meetsWCAGAAA).toBeDefined();
      expect(module.isWCAGAACompliant).toBeDefined();
      expect(module.isWCAGAAACompliant).toBeDefined();
      expect(module.isWCAGLargeTextAACompliant).toBeDefined();
      expect(module.isWCAGLargeTextAAACompliant).toBeDefined();
    });

    it('color-contrast 모듈이 색상 감지 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/color-contrast');

      expect(module.detectActualBackgroundColor).toBeDefined();
      expect(module.detectLightBackground).toBeDefined();
    });

    it('color-contrast 모듈이 검증 및 분석 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/color-contrast');

      expect(module.validateContrast).toBeDefined();
      expect(module.validateColorContrast).toBeDefined();
      expect(module.analyzeContrast).toBeDefined();
      expect(module.testContrastRatio).toBeDefined();
    });

    it('parseColor가 RGB 형식을 올바르게 파싱해야 함', async () => {
      const { parseColor } = await import('@shared/utils/accessibility/color-contrast');

      const rgb = parseColor('rgb(255, 0, 0)');
      expect(rgb).toEqual([255, 0, 0]);
    });

    it('getRelativeLuminance가 흰색에 대해 1을 반환해야 함', async () => {
      const { getRelativeLuminance } = await import('@shared/utils/accessibility/color-contrast');

      const luminance = getRelativeLuminance(255, 255, 255);
      expect(luminance).toBeCloseTo(1, 2);
    });

    it('calculateContrastRatio가 흑백 대비 비율을 올바르게 계산해야 함', async () => {
      const { calculateContrastRatio } = await import('@shared/utils/accessibility/color-contrast');

      const ratio = calculateContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });
  });

  describe('Phase 104.2: Keyboard Navigation 모듈', () => {
    it('keyboard-navigation 모듈이 키보드 네비게이션 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/keyboard-navigation');

      expect(module.enableKeyboardNavigation).toBeDefined();
      expect(module.disableKeyboardNavigation).toBeDefined();
      expect(module.enableWCAGKeyboardNavigation).toBeDefined();
    });

    it('keyboard-navigation 모듈이 검증 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/keyboard-navigation');

      expect(module.validateKeyboardAccess).toBeDefined();
      expect(module.validateNavigationStructure).toBeDefined();
      expect(module.isFocusable).toBeDefined();
    });

    it('keyboard-navigation 모듈이 포커스 관리 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/keyboard-navigation');

      expect(module.createFocusTrap).toBeDefined();
      expect(module.releaseKeyboardTrap).toBeDefined();
      expect(module.manageFocus).toBeDefined();
      expect(module.enhanceFocusVisibility).toBeDefined();
    });
  });

  describe('Phase 104.3: ARIA Helpers 모듈', () => {
    it('aria-helpers 모듈이 스크린 리더 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/aria-helpers');

      expect(module.addScreenReaderText).toBeDefined();
      expect(module.notifyScreenReader).toBeDefined();
      expect(module.announceLiveMessage).toBeDefined();
    });

    it('aria-helpers 모듈이 기본 ARIA 속성 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/aria-helpers');

      expect(module.setAriaLabel).toBeDefined();
      expect(module.setAriaRole).toBeDefined();
      expect(module.setAriaLive).toBeDefined();
      expect(module.setAriaAtomic).toBeDefined();
    });

    it('aria-helpers 모듈이 접근 가능한 상태 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/aria-helpers');

      expect(module.setAccessibleExpanded).toBeDefined();
      expect(module.setAccessiblePressed).toBeDefined();
      expect(module.setAccessibleSelected).toBeDefined();
      expect(module.setAccessibleChecked).toBeDefined();
      expect(module.setAccessibleHidden).toBeDefined();
      expect(module.setAccessibleDisabled).toBeDefined();
    });

    it('aria-helpers 모듈이 검증 및 유틸리티 함수를 export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility/aria-helpers');

      expect(module.validateScreenReaderSupport).toBeDefined();
      expect(module.validateAltTextQuality).toBeDefined();
      expect(module.createNavigationLandmark).toBeDefined();
    });
  });

  describe('Barrel Export 통합 검증', () => {
    it('accessibility 인덱스에서 모든 모듈을 re-export 해야 함', async () => {
      const module = await import('@shared/utils/accessibility');

      // Color Contrast
      expect(module.parseColor).toBeDefined();
      expect(module.getRelativeLuminance).toBeDefined();
      expect(module.calculateContrastRatio).toBeDefined();
      expect(module.detectLightBackground).toBeDefined();

      // Keyboard Navigation
      expect(module.enableKeyboardNavigation).toBeDefined();
      expect(module.isFocusable).toBeDefined();

      // ARIA Helpers
      expect(module.setAriaLabel).toBeDefined();
      expect(module.announceLiveMessage).toBeDefined();
    });
  });

  describe('기존 사용처 호환성 검증', () => {
    it('utils.ts에서 re-export하는 7개 함수가 모두 동작해야 함', async () => {
      const module = await import('@shared/utils/utils');

      expect(module.getRelativeLuminance).toBeDefined();
      expect(module.parseColor).toBeDefined();
      expect(module.calculateContrastRatio).toBeDefined();
      expect(module.meetsWCAGAA).toBeDefined();
      expect(module.meetsWCAGAAA).toBeDefined();
      expect(module.detectActualBackgroundColor).toBeDefined();
      expect(module.detectLightBackground).toBeDefined();
    });
  });
});
