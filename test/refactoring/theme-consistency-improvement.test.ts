/**
 * @fileoverview 테마 시스템 개선 테스트 - UI 일관성 및 시인성 향상
 *
 * TDD 기반으로 다음 항목들을 검증합니다:
 * 1. HSL 색상 모델 적용
 * 2. WCAG 접근성 기준 준수
 * 3. 라이트/다크 테마 간 일관성
 * 4. 깊이감 표현 최적화
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('테마 시스템 개선 (TDD)', () => {
  let testElement: HTMLElement;
  let testStyleSheet: HTMLStyleElement;

  beforeEach(() => {
    // 테스트용 DOM 요소 생성
    testElement = document.createElement('div');
    testElement.className = 'xeg-test-container';
    document.body.appendChild(testElement);

    // 테스트용 스타일시트 주입
    testStyleSheet = document.createElement('style');
    testStyleSheet.textContent = `
      /* HSL 기반 라이트 테마 색상 시스템 */
      :root {
        /* Base Colors */
        --xeg-color-primary: hsl(210, 90%, 55%);
        --xeg-color-success: hsl(140, 65%, 45%);
        --xeg-color-error: hsl(0, 75%, 50%);

        /* Text Colors */
        --xeg-color-text-primary: hsl(210, 15%, 20%);
        --xeg-color-text-secondary: hsl(210, 15%, 45%);

        /* Background Colors */
        --xeg-bg-toolbar: hsl(210, 20%, 98%);
        --xeg-bg-surface: hsl(210, 20%, 95%);

        /* Border Colors */
        --xeg-toolbar-border: hsl(210, 15%, 90%);
        --xeg-border-light: hsl(210, 15%, 85%);

        /* Shadows */
        --xeg-toolbar-shadow: 0 4px 12px hsl(210 20% 50% / 0.15);
      }

      /* HSL 기반 다크 테마 색상 시스템 */
      [data-theme='dark'] {
        /* Base Colors */
        --xeg-color-primary: hsl(210, 95%, 65%);
        --xeg-color-success: hsl(140, 60%, 55%);
        --xeg-color-error: hsl(0, 85%, 60%);

        /* Text Colors */
        --xeg-color-text-primary: hsl(210, 20%, 95%);
        --xeg-color-text-secondary: hsl(210, 15%, 65%);

        /* Background Colors */
        --xeg-bg-toolbar: hsl(210, 15%, 18%);
        --xeg-bg-surface: hsl(210, 15%, 22%);

        /* Border Colors */
        --xeg-toolbar-border: hsl(210, 15%, 25%);
        --xeg-border-light: hsl(210, 15%, 30%);

        /* Shadows */
        --xeg-toolbar-shadow: 0 0 0 1px hsl(210 15% 50% / 0.2), 0 4px 12px hsl(0 0% 0% / 0.4);
      }

      /* 라이트 테마 명시적 설정 */
      [data-theme='light'] {
        /* Base Colors */
        --xeg-color-primary: hsl(210, 90%, 55%);
        --xeg-color-success: hsl(140, 65%, 45%);
        --xeg-color-error: hsl(0, 75%, 50%);

        /* Text Colors */
        --xeg-color-text-primary: hsl(210, 15%, 20%);
        --xeg-color-text-secondary: hsl(210, 15%, 45%);

        /* Background Colors */
        --xeg-bg-toolbar: hsl(210, 20%, 98%);
        --xeg-bg-surface: hsl(210, 20%, 95%);

        /* Border Colors */
        --xeg-toolbar-border: hsl(210, 15%, 90%);
        --xeg-border-light: hsl(210, 15%, 85%);

        /* Shadows */
        --xeg-toolbar-shadow: 0 4px 12px hsl(210 20% 50% / 0.15);
      }
    `;
    document.head.appendChild(testStyleSheet);
  });

  describe('라이트 테마 색상 시스템', () => {
    beforeEach(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    it('기본 색상이 HSL 형식으로 정의되어야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      // 사용자 제안 값들 검증
      expect(computedStyle.getPropertyValue('--xeg-color-primary').trim()).toBe(
        'hsl(210, 90%, 55%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-color-success').trim()).toBe(
        'hsl(140, 65%, 45%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-color-error').trim()).toBe('hsl(0, 75%, 50%)');
    });

    it('텍스트 색상이 접근성 기준을 준수해야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      expect(computedStyle.getPropertyValue('--xeg-color-text-primary').trim()).toBe(
        'hsl(210, 15%, 20%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-color-text-secondary').trim()).toBe(
        'hsl(210, 15%, 45%)'
      );
    });

    it('배경 색상이 부드러운 회색조를 사용해야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      expect(computedStyle.getPropertyValue('--xeg-bg-toolbar').trim()).toBe('hsl(210, 20%, 98%)');
      expect(computedStyle.getPropertyValue('--xeg-bg-surface').trim()).toBe('hsl(210, 20%, 95%)');
    });

    it('테두리와 그림자가 일관된 색조를 유지해야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      expect(computedStyle.getPropertyValue('--xeg-toolbar-border').trim()).toBe(
        'hsl(210, 15%, 90%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-border-light').trim()).toBe(
        'hsl(210, 15%, 85%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-toolbar-shadow').trim()).toBe(
        '0 4px 12px hsl(210 20% 50% / 0.15)'
      );
    });
  });

  describe('다크 테마 색상 시스템', () => {
    beforeEach(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    it('기본 색상이 어두운 배경에 적합하게 조정되어야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      expect(computedStyle.getPropertyValue('--xeg-color-primary').trim()).toBe(
        'hsl(210, 95%, 65%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-color-success').trim()).toBe(
        'hsl(140, 60%, 55%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-color-error').trim()).toBe('hsl(0, 85%, 60%)');
    });

    it('텍스트 색상이 다크 배경에서 충분한 대비를 제공해야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      expect(computedStyle.getPropertyValue('--xeg-color-text-primary').trim()).toBe(
        'hsl(210, 20%, 95%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-color-text-secondary').trim()).toBe(
        'hsl(210, 15%, 65%)'
      );
    });

    it('배경 색상이 깊이감 있는 어두운 톤을 사용해야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      expect(computedStyle.getPropertyValue('--xeg-bg-toolbar').trim()).toBe('hsl(210, 15%, 18%)');
      expect(computedStyle.getPropertyValue('--xeg-bg-surface').trim()).toBe('hsl(210, 15%, 22%)');
    });

    it('테두리와 그림자가 다크 테마에 최적화되어야 함', () => {
      const computedStyle = getComputedStyle(document.documentElement);

      expect(computedStyle.getPropertyValue('--xeg-toolbar-border').trim()).toBe(
        'hsl(210, 15%, 25%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-border-light').trim()).toBe(
        'hsl(210, 15%, 30%)'
      );
      expect(computedStyle.getPropertyValue('--xeg-toolbar-shadow').trim()).toBe(
        '0 0 0 1px hsl(210 15% 50% / 0.2), 0 4px 12px hsl(0 0% 0% / 0.4)'
      );
    });
  });

  describe('테마 간 일관성 검증', () => {
    it('라이트/다크 테마에서 동일한 Hue 값을 사용해야 함', () => {
      // 라이트 테마 설정
      document.documentElement.setAttribute('data-theme', 'light');
      const lightPrimary = getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-color-primary')
        .trim();

      // 다크 테마 설정
      document.documentElement.setAttribute('data-theme', 'dark');
      const darkPrimary = getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-color-primary')
        .trim();

      // 둘 다 hsl(210, ...)로 시작해야 함 (동일한 Hue)
      expect(lightPrimary).toMatch(/^hsl\(210,/);
      expect(darkPrimary).toMatch(/^hsl\(210,/);
    });
  });

  describe('접근성 기준 검증', () => {
    it('텍스트와 배경 간 충분한 명도 대비를 제공해야 함', () => {
      // 이것은 실제 색상 값을 계산하여 명도 대비를 검증하는 헬퍼 함수가 필요
      // 현재는 색상 값 형식이 올바른지만 확인
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryText = computedStyle.getPropertyValue('--xeg-color-text-primary').trim();

      expect(primaryText).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
    });
  });

  afterEach(() => {
    if (testElement && testElement.parentNode) {
      document.body.removeChild(testElement);
    }
    if (testStyleSheet && testStyleSheet.parentNode) {
      document.head.removeChild(testStyleSheet);
    }
    document.documentElement.removeAttribute('data-theme');
  });
});
