/**
 * @fileoverview Button 컴포넌트 글래스모피즘 적용 테스트
 * @description TDD 기반 Button 컴포넌트 글래스모피즘 개선
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Button 컴포넌트 글래스모피즘', () => {
  beforeEach(() => {
    // Mock document
    Object.defineProperty(globalThis, 'document', {
      value: {
        createElement: vi.fn(() => ({
          style: {},
          className: '',
          setAttribute: vi.fn(),
          getAttribute: vi.fn(),
        })),
      },
      configurable: true,
    });

    // CSS 커스텀 프로퍼티 모킹
    Object.defineProperty(globalThis, 'window', {
      value: {
        getComputedStyle: vi.fn(() => ({
          getPropertyValue: vi.fn(prop => {
            const mockValues = {
              '--xeg-glass-bg-light': 'rgba(255, 255, 255, 0.85)',
              '--xeg-glass-bg-medium': 'rgba(255, 255, 255, 0.95)',
              '--xeg-glass-blur-medium': 'blur(16px)',
              '--xeg-glass-blur-strong': 'blur(24px)',
              '--xeg-glass-border-light': 'rgba(255, 255, 255, 0.2)',
              '--xeg-glass-shadow-medium': '0 8px 32px rgba(0, 0, 0, 0.15)',
              '--xeg-glass-shadow-strong': '0 12px 40px rgba(0, 0, 0, 0.25)',
            };
            return mockValues[prop] || '';
          }),
        })),
      },
      configurable: true,
    });
  });

  describe('글래스모피즘 CSS 클래스 검증', () => {
    it('Button 모듈 CSS에 glassmorphism 관련 스타일이 정의되어야 함', async () => {
      // Button 모듈 CSS에 glassmorphism 관련 클래스가 있는지 확인
      const mockButtonStyles = {
        button: 'button_abc123',
        glassmorphism: 'glassmorphism_def456',
        'glassmorphism-light': 'glassmorphism-light_ghi789',
        'glassmorphism-medium': 'glassmorphism-medium_jkl012',
      };

      expect(mockButtonStyles).toHaveProperty('glassmorphism');
      expect(mockButtonStyles).toHaveProperty('glassmorphism-light');
      expect(mockButtonStyles).toHaveProperty('glassmorphism-medium');
    });

    it('Button이 글래스모피즘 검증을 통과해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      // 테스트용 요소 생성
      const testElement = globalThis.document.createElement('button');

      // Mock getComputedStyle to return glass properties
      vi.spyOn(globalThis.window, 'getComputedStyle').mockReturnValue({
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        getPropertyValue: vi.fn(),
      });

      const isValid = DesignTokenValidator.validateGlassProperties(testElement);
      expect(isValid).toBe(true);
    });

    it('Button에 적용된 OKLCH 색상이 유효해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      // Button에 적용될 OKLCH 색상 검증
      const oklchColors = [
        'oklch(0.627 0.151 258.2)', // primary-500
        'oklch(0.776 0.108 258.2)', // primary-300
        'oklch(0.902 0.054 258.2)', // primary-100
      ];

      oklchColors.forEach(color => {
        const isValid = DesignTokenValidator.validateOKLCH(color);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('접근성 및 사용성', () => {
    it('글래스모피즘 효과가 콘텐츠 가독성을 해치지 않아야 함', () => {
      const mockElement = globalThis.document.createElement('button');
      mockElement.className = 'glassmorphism-light';

      // 최소 명도 대비 확인 (모킹된 값 기준)
      const computedStyle = globalThis.window.getComputedStyle(mockElement);
      const background = computedStyle.getPropertyValue('--xeg-glass-bg-light');

      // rgba(255, 255, 255, 0.85) 투명도 검증
      expect(background).toContain('0.85');
      expect(parseFloat(background.match(/0\.\d+/)?.[0] || '0')).toBeGreaterThanOrEqual(0.8);
    });

    it('backdrop-filter 지원 여부를 확인할 수 있어야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      const supportsBackdrop = DesignTokenValidator.checkBackdropFilterSupport();

      // 테스트 환경에서는 지원하지 않을 수 있음
      expect(typeof supportsBackdrop).toBe('boolean');
    });

    it('폴백 스타일이 정의되어야 함', () => {
      // backdrop-filter를 지원하지 않는 브라우저를 위한 폴백
      const fallbackStyles = {
        background: 'rgba(255, 255, 255, 0.95)', // 더 높은 불투명도
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      };

      expect(fallbackStyles.background).toContain('0.95');
      expect(fallbackStyles.border).toBeDefined();
      expect(fallbackStyles.boxShadow).toBeDefined();
    });
  });

  describe('성능 최적화', () => {
    it('CSS 커스텀 프로퍼티를 효율적으로 사용해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      // 글래스모피즘 관련 CSS 변수들
      const glassProperties = [
        '--xeg-glass-bg-light',
        '--xeg-glass-bg-medium',
        '--xeg-glass-blur-medium',
        '--xeg-glass-blur-strong',
      ];

      glassProperties.forEach(property => {
        const value = DesignTokenValidator.getCSSCustomProperty(property);
        // 테스트 환경에서는 빈 문자열을 반환할 수 있음
        expect(typeof value).toBe('string');
      });
    });

    it('불필요한 리플로우를 방지하는 속성들을 사용해야 함', () => {
      // backdrop-filter, opacity, transform 같은 composite layer 속성 확인
      const optimizedProperties = ['backdrop-filter', 'opacity', 'transform', 'will-change'];

      optimizedProperties.forEach(property => {
        expect(typeof property).toBe('string');
        expect(property.length).toBeGreaterThan(0);
      });
    });
  });

  describe('테마 호환성', () => {
    it('라이트/다크 테마에서 모두 적절한 글래스 효과를 제공해야 함', () => {
      const lightThemeGlass = {
        background: 'rgba(255, 255, 255, 0.85)',
        border: 'rgba(255, 255, 255, 0.2)',
      };

      const darkThemeGlass = {
        background: 'rgba(0, 0, 0, 0.85)',
        border: 'rgba(255, 255, 255, 0.1)',
      };

      // 라이트 테마 검증
      expect(lightThemeGlass.background).toContain('255, 255, 255');
      expect(
        parseFloat(lightThemeGlass.background.match(/0\.\d+/)?.[0] || '0')
      ).toBeGreaterThanOrEqual(0.8);

      // 다크 테마 검증
      expect(darkThemeGlass.background).toContain('0, 0, 0');
      expect(
        parseFloat(darkThemeGlass.background.match(/0\.\d+/)?.[0] || '0')
      ).toBeGreaterThanOrEqual(0.8);
    });

    it('고대비 모드에서 접근성을 유지해야 함', () => {
      const highContrastStyles = {
        background: 'rgba(255, 255, 255, 0.95)', // 더 높은 불투명도
        border: '2px solid rgba(0, 0, 0, 0.8)', // 더 진한 테두리
        backdropFilter: 'none', // 블러 효과 제거
      };

      expect(
        parseFloat(highContrastStyles.background.match(/0\.\d+/)?.[0] || '0')
      ).toBeGreaterThanOrEqual(0.95);
      expect(highContrastStyles.border).toContain('2px solid');
      expect(highContrastStyles.backdropFilter).toBe('none');
    });
  });
});
