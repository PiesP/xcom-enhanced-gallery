/**
 * @fileoverview 디자인 토큰 검증 유틸리티 테스트
 * @description TDD 기반 디자인 토큰 검증 시스템
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('디자인 토큰 검증 유틸리티', () => {
  let mockDocument;
  let mockWindow;

  beforeEach(() => {
    mockDocument = {
      documentElement: {
        style: {
          getPropertyValue: vi.fn(),
        },
      },
      createElement: vi.fn(() => ({
        style: {},
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      })),
    };

    mockWindow = {
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn(prop => {
          // Mock OKLCH colors
          if (prop === '--xeg-color-primary-500') {
            return 'oklch(0.678 0.182 252.2)';
          }
          // Mock glass properties
          if (prop === '--xeg-glass-bg-light') {
            return 'rgba(255, 255, 255, 0.85)';
          }
          if (prop === '--xeg-glass-blur-medium') {
            return 'blur(16px)';
          }
          return '';
        }),
      })),
    };

    Object.assign(globalThis, { document: mockDocument, window: mockWindow });
  });

  describe('OKLCH 색상 검증', () => {
    it('OKLCH 색상 형식을 올바르게 검증해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      const validOKLCH = 'oklch(0.678 0.182 252.2)';
      const invalidOKLCH = 'rgb(255, 0, 0)';

      expect(DesignTokenValidator.validateOKLCH(validOKLCH)).toBe(true);
      expect(DesignTokenValidator.validateOKLCH(invalidOKLCH)).toBe(false);
    });

    it('CSS 커스텀 프로퍼티에서 OKLCH 색상을 추출해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      const color = DesignTokenValidator.getCSSCustomProperty('--xeg-color-primary-500');
      expect(color).toBe('oklch(0.678 0.182 252.2)');
      expect(DesignTokenValidator.validateOKLCH(color)).toBe(true);
    });
  });

  describe('글래스모피즘 속성 검증', () => {
    it('요소의 글래스모피즘 속성을 검증해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      const mockElement = mockDocument.createElement('div');

      // Mock computed style
      vi.mocked(mockWindow.getComputedStyle).mockReturnValue({
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        getPropertyValue: vi.fn(),
      });

      const hasGlass = DesignTokenValidator.validateGlassProperties(mockElement);
      expect(hasGlass).toBe(true);
    });

    it('글래스모피즘 속성이 없는 요소를 올바르게 식별해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      const mockElement = mockDocument.createElement('div');

      // Mock non-glass computed style
      vi.mocked(mockWindow.getComputedStyle).mockReturnValue({
        backdropFilter: 'none',
        backgroundColor: 'rgb(255, 255, 255)',
        getPropertyValue: vi.fn(),
      });

      const hasGlass = DesignTokenValidator.validateGlassProperties(mockElement);
      expect(hasGlass).toBe(false);
    });
  });

  describe('디자인 토큰 일관성 검증', () => {
    it('모든 필수 디자인 토큰이 정의되어야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      const requiredTokens = [
        '--xeg-color-primary-500',
        '--xeg-glass-bg-light',
        '--xeg-glass-blur-medium',
      ];

      const missingTokens = DesignTokenValidator.validateRequiredTokens(requiredTokens);
      expect(missingTokens).toEqual([]);
    });

    it('누락된 토큰을 올바르게 식별해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      // Mock missing token
      vi.mocked(mockWindow.getComputedStyle).mockReturnValue({
        getPropertyValue: vi.fn(prop => {
          if (prop === '--missing-token') return '';
          return 'some-value';
        }),
      });

      const tokensToCheck = ['--existing-token', '--missing-token'];
      const missingTokens = DesignTokenValidator.validateRequiredTokens(tokensToCheck);
      expect(missingTokens).toContain('--missing-token');
    });
  });

  describe('브라우저 호환성 검증', () => {
    it('OKLCH 지원 여부를 검증해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      // Mock CSS.supports
      Object.assign(globalThis, {
        CSS: {
          supports: vi.fn((property, value) => {
            return value.includes('oklch');
          }),
        },
      });

      const supportsOKLCH = DesignTokenValidator.checkOKLCHSupport();
      expect(supportsOKLCH).toBe(true);
    });

    it('backdrop-filter 지원 여부를 검증해야 함', async () => {
      const { DesignTokenValidator } = await import(
        '../../../../src/shared/utils/design-system/DesignTokenValidator'
      );

      // Mock CSS.supports
      Object.assign(globalThis, {
        CSS: {
          supports: vi.fn(property => {
            return property === 'backdrop-filter';
          }),
        },
      });

      const supportsBackdrop = DesignTokenValidator.checkBackdropFilterSupport();
      expect(supportsBackdrop).toBe(true);
    });
  });
});
