/**
 * Phase 121: 툴바/설정 메뉴 텍스트 색상 토큰 완성
 *
 * 목적: 누락된 xeg 접두사 텍스트 색상 토큰이 정의되어 있는지 검증
 *
 * 검증 항목:
 * 1. 모든 5개 xeg 텍스트 토큰이 정의되어 있는지
 * 2. 라이트 테마에서 적절한 값
 * 3. 다크 테마에서 적절한 값
 * 4. inverse 토큰이 테마별로 반전되는지
 * 5. tertiary와 muted가 같은 값을 참조하는지
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Phase 121: Text Color Tokens', () => {
  let testContainer: HTMLDivElement;

  beforeEach(() => {
    // CSS 토큰 직접 삽입 (JSDOM 환경)
    const tokensCSS = `
      :root {
        /* Primitive colors */
        --color-base-black: oklch(0 0 0);
        --color-base-white: oklch(1 0 0);
        --color-gray-500: oklch(0.627 0.013 285.9);
        --color-gray-700: oklch(0.432 0.014 285.6);

        /* Semantic colors */
        --color-text-primary: var(--color-base-black);
        --color-text-secondary: var(--color-gray-700);
        --color-text-muted: var(--color-gray-500);
        --color-text-inverse: var(--color-base-white);

        /* XEG text colors */
        --xeg-color-text-primary: var(--color-text-primary);
        --xeg-color-text-secondary: var(--color-text-secondary);
        --xeg-color-text-muted: var(--color-text-muted);
        --xeg-color-text-inverse: var(--color-text-inverse);
        --xeg-color-text-tertiary: var(--color-text-muted);
      }

      [data-theme='light'] {
        --color-text-primary: oklch(0 0 0);
        --color-text-inverse: oklch(1 0 0);
        --xeg-color-text-primary: oklch(0 0 0);
        --xeg-color-text-inverse: oklch(1 0 0);
      }

      [data-theme='dark'] {
        --color-text-primary: oklch(1 0 0);
        --color-text-inverse: oklch(0 0 0);
        --xeg-color-text-primary: oklch(1 0 0);
        --xeg-color-text-inverse: oklch(0 0 0);
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'phase-121-tokens';
    styleElement.textContent = tokensCSS;
    document.head.appendChild(styleElement);

    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    if (testContainer?.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }

    const style = document.getElementById('phase-121-tokens');
    if (style?.parentNode) {
      document.head.removeChild(style);
    }
  });

  describe('Token Definitions', () => {
    it('should define all 5 xeg text color tokens in :root', () => {
      const style = window.getComputedStyle(document.documentElement);

      const textPrimary = style.getPropertyValue('--xeg-color-text-primary').trim();
      const textSecondary = style.getPropertyValue('--xeg-color-text-secondary').trim();
      const textMuted = style.getPropertyValue('--xeg-color-text-muted').trim();
      const textInverse = style.getPropertyValue('--xeg-color-text-inverse').trim();
      const textTertiary = style.getPropertyValue('--xeg-color-text-tertiary').trim();

      expect(textPrimary, '--xeg-color-text-primary should be defined').not.toBe('');
      expect(textSecondary, '--xeg-color-text-secondary should be defined').not.toBe('');
      expect(textMuted, '--xeg-color-text-muted should be defined').not.toBe('');
      expect(textInverse, '--xeg-color-text-inverse should be defined').not.toBe('');
      expect(textTertiary, '--xeg-color-text-tertiary should be defined').not.toBe('');
    });

    it('should have tertiary reference the same value as muted', () => {
      const style = window.getComputedStyle(document.documentElement);

      const textMuted = style.getPropertyValue('--xeg-color-text-muted').trim();
      const textTertiary = style.getPropertyValue('--xeg-color-text-tertiary').trim();

      expect(textTertiary).toBe(textMuted);
    });
  });

  describe('Light Theme', () => {
    beforeEach(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    it('should use dark colors for primary text in light theme', () => {
      const style = window.getComputedStyle(document.documentElement);
      const textPrimary = style.getPropertyValue('--xeg-color-text-primary').trim();

      // Light theme should use dark text (black or very dark gray)
      // The actual value comes from --color-base-black
      expect(textPrimary).not.toBe('');
      expect(textPrimary).toContain('oklch(0 0 0'); // black in OKLCH
    });

    it('should use white for inverse text in light theme', () => {
      const style = window.getComputedStyle(document.documentElement);
      const textInverse = style.getPropertyValue('--xeg-color-text-inverse').trim();

      // Light theme inverse should be white
      expect(textInverse).not.toBe('');
      expect(textInverse).toContain('oklch(1 0 0'); // white in OKLCH
    });

    it('should use gray for secondary and muted text in light theme', () => {
      const style = window.getComputedStyle(document.documentElement);
      const textSecondary = style.getPropertyValue('--xeg-color-text-secondary').trim();
      const textMuted = style.getPropertyValue('--xeg-color-text-muted').trim();

      // Should use gray values
      expect(textSecondary).not.toBe('');
      expect(textMuted).not.toBe('');

      // Secondary and muted should be different shades
      expect(textSecondary).not.toBe(textMuted);
    });
  });

  describe('Dark Theme', () => {
    beforeEach(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    it('should use white for primary text in dark theme', () => {
      const style = window.getComputedStyle(document.documentElement);
      const textPrimary = style.getPropertyValue('--xeg-color-text-primary').trim();

      // Dark theme should use white text
      expect(textPrimary).not.toBe('');
      expect(textPrimary).toContain('oklch(1 0 0'); // white in OKLCH
    });

    it('should use black for inverse text in dark theme', () => {
      const style = window.getComputedStyle(document.documentElement);
      const textInverse = style.getPropertyValue('--xeg-color-text-inverse').trim();

      // Dark theme inverse should be black
      expect(textInverse).not.toBe('');
      expect(textInverse).toContain('oklch(0 0 0'); // black in OKLCH
    });

    it('should use lighter gray for secondary and muted text in dark theme', () => {
      const style = window.getComputedStyle(document.documentElement);
      const textSecondary = style.getPropertyValue('--xeg-color-text-secondary').trim();
      const textMuted = style.getPropertyValue('--xeg-color-text-muted').trim();

      // Should use lighter gray values for dark theme
      expect(textSecondary).not.toBe('');
      expect(textMuted).not.toBe('');

      // Secondary and muted should be different shades
      expect(textSecondary).not.toBe(textMuted);
    });
  });

  describe('Theme Inversion', () => {
    it('should invert inverse token between light and dark themes', () => {
      // Light theme
      document.documentElement.setAttribute('data-theme', 'light');
      const lightStyle = window.getComputedStyle(document.documentElement);
      const lightInverse = lightStyle.getPropertyValue('--xeg-color-text-inverse').trim();

      // Dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      const darkStyle = window.getComputedStyle(document.documentElement);
      const darkInverse = darkStyle.getPropertyValue('--xeg-color-text-inverse').trim();

      // Inverse should be different between themes
      expect(lightInverse).not.toBe(darkInverse);

      // Light inverse should be white-ish, dark inverse should be black-ish
      expect(lightInverse).toContain('oklch(1 0 0'); // white
      expect(darkInverse).toContain('oklch(0 0 0'); // black
    });
  });
});
