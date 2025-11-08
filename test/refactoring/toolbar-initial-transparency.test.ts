/**
 * TDD Red Test: Toolbar Initial Transparency
 * @description 툴바 초기 렌더링 시 투명도 문제 해결을 위한 테스트
 *
 * Phase 35 Step 1-A: RED 단계
 *
 * 목표:
 * - 갤러리 초기화 시 data-theme 속성이 즉시 설정됨
 * - 툴바가 렌더링될 때 올바른 배경색이 적용됨
 * - 라이트/다크 모드 모두에서 투명도 문제 없음
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import {
  initializeTheme,
  setupThemeChangeListener,
  detectSystemTheme,
  applyThemeToDOM,
  getSavedThemeSetting,
  resolveAndApplyTheme,
  type ThemeMode,
  type ThemeSetting,
} from '../../src/features/gallery/services/theme-initialization';

describe('Toolbar Initial Transparency', () => {
  setupGlobalTestIsolation();

  let originalDataTheme: string | null = null;

  beforeEach(() => {
    // 초기 상태 저장
    if (typeof document !== 'undefined') {
      originalDataTheme = document.documentElement.getAttribute('data-theme');
      // 테스트를 위해 data-theme 제거 (초기 상태 시뮬레이션)
      document.documentElement.removeAttribute('data-theme');
    }
  });

  afterEach(() => {
    // 원래 상태 복원
    if (typeof document !== 'undefined' && originalDataTheme !== null) {
      document.documentElement.setAttribute('data-theme', originalDataTheme);
    }
  });

  describe('Theme Initialization', () => {
    it('should set data-theme attribute immediately on initialization', () => {
      // GIVEN: 초기 상태 (data-theme 없음)
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

      // WHEN: 테마 초기화
      initializeTheme();

      // THEN: data-theme 속성이 설정되어야 함
      expect(
        document.documentElement.hasAttribute('data-theme'),
        'data-theme attribute should be set after initialization'
      ).toBe(true);
    });

    it('should detect system theme and apply it', () => {
      // GIVEN: 시스템 다크 모드 설정
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      // WHEN: 테마 초기화
      const appliedTheme = initializeTheme();

      // THEN: 시스템 테마에 맞는 data-theme이 설정되어야 함
      const expectedTheme = prefersDark ? 'dark' : 'light';
      expect(
        document.documentElement.getAttribute('data-theme'),
        `data-theme should be ${expectedTheme} based on system preference`
      ).toBe(expectedTheme);
      expect(appliedTheme).toBe(expectedTheme);
    });

    it('should restore saved theme preference from storage', async () => {
      // GIVEN: 저장된 테마 설정이 있음
      const savedTheme = 'dark';
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('xeg-theme', savedTheme);
      }

      // WHEN: 테마 초기화
      const appliedTheme = initializeTheme();

      // THEN: 저장된 테마가 적용되어야 함
      expect(
        document.documentElement.getAttribute('data-theme'),
        'data-theme should match saved preference'
      ).toBe(savedTheme);
      expect(appliedTheme).toBe(savedTheme);

      // CLEANUP
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('xeg-theme');
      }
    });

    it('should normalize JSON encoded theme values from storage', () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('xeg-theme', '"dark"');
      }

      const appliedTheme = initializeTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(appliedTheme).toBe('dark');

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('xeg-theme');
      }
    });
  });

  describe('Toolbar Background Color', () => {
    it('should have opaque background color in light mode', () => {
      // GIVEN: 라이트 모드 설정
      document.documentElement.setAttribute('data-theme', 'light');

      // WHEN: CSS 변수 값 확인
      const toolbarBg = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-bg-toolbar');

      // THEN: 투명하지 않은 배경색이어야 함
      expect(toolbarBg, '--xeg-bg-toolbar should have a value in light mode').toBeTruthy();
      expect(
        toolbarBg.includes('rgba') && toolbarBg.includes(', 0)'),
        '--xeg-bg-toolbar should not be fully transparent'
      ).toBe(false);
    });

    it('should have opaque background color in dark mode', () => {
      // GIVEN: 다크 모드 설정
      document.documentElement.setAttribute('data-theme', 'dark');

      // WHEN: CSS 변수 값 확인
      const toolbarBg = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-bg-toolbar');

      // THEN: 투명하지 않은 배경색이어야 함
      expect(toolbarBg, '--xeg-bg-toolbar should have a value in dark mode').toBeTruthy();
      expect(
        toolbarBg.includes('rgba') && toolbarBg.includes(', 0)'),
        '--xeg-bg-toolbar should not be fully transparent'
      ).toBe(false);
    });

    it('should have fallback background color when data-theme is not set', () => {
      // GIVEN: data-theme 속성이 없음 (초기 상태)
      document.documentElement.removeAttribute('data-theme');

      // WHEN: CSS 변수 값 확인
      const toolbarBg = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-bg-toolbar');

      // THEN: 폴백 배경색이 있어야 함 (투명하지 않음)
      expect(
        toolbarBg,
        '--xeg-bg-toolbar should have a fallback value even without data-theme'
      ).toBeTruthy();
      expect(
        toolbarBg.includes('rgba') && toolbarBg.includes(', 0)'),
        'Fallback --xeg-bg-toolbar should not be fully transparent'
      ).toBe(false);
    });
  });

  describe('CSS Token Resolution', () => {
    it('should resolve --color-bg-surface correctly in light mode', () => {
      // GIVEN: 라이트 모드
      document.documentElement.setAttribute('data-theme', 'light');

      // WHEN: CSS 변수 해석
      const bgSurface = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg-surface');

      // THEN: 유효한 색상 값이어야 함
      expect(bgSurface, '--color-bg-surface should have a value').toBeTruthy();
    });

    it('should resolve --color-gray-800 correctly in dark mode', () => {
      // GIVEN: 다크 모드
      document.documentElement.setAttribute('data-theme', 'dark');

      // WHEN: CSS 변수 해석
      const gray800 = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--color-gray-800');

      // THEN: 유효한 색상 값이어야 함
      expect(gray800, '--color-gray-800 should have a value').toBeTruthy();
    });

    it('should maintain color consistency across theme changes', () => {
      // GIVEN: 초기 라이트 모드
      document.documentElement.setAttribute('data-theme', 'light');
      const lightBg = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-bg-toolbar');

      // WHEN: 다크 모드로 변경
      document.documentElement.setAttribute('data-theme', 'dark');
      const darkBg = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--xeg-bg-toolbar');

      // THEN: 두 테마 모두 유효한 배경색을 가져야 함
      expect(lightBg, 'Light mode toolbar bg should be set').toBeTruthy();
      expect(darkBg, 'Dark mode toolbar bg should be set').toBeTruthy();
      expect(
        lightBg !== darkBg,
        'Toolbar background should differ between light and dark modes'
      ).toBe(true);
    });
  });

  describe('Performance and Timing', () => {
    it('should apply theme synchronously before first paint', () => {
      // GIVEN: 초기 상태
      const startTime = performance.now();

      // WHEN: 테마 초기화
      initializeTheme();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // THEN: 동기적으로 빠르게 완료되어야 함 (< 10ms)
      expect(
        duration,
        'Theme initialization should complete synchronously within 10ms'
      ).toBeLessThan(10);

      // 그리고 즉시 적용되어야 함
      expect(
        document.documentElement.hasAttribute('data-theme'),
        'data-theme should be set synchronously'
      ).toBe(true);
    });

    it('should not cause layout thrashing', () => {
      // GIVEN: 반복적인 테마 초기화
      const iterations = 5;
      const startTime = performance.now();

      // WHEN: 여러 번 초기화
      for (let i = 0; i < iterations; i++) {
        initializeTheme();
      }

      const endTime = performance.now();
      const avgDuration = (endTime - startTime) / iterations;

      // THEN: 평균 실행 시간이 합리적이어야 함 (< 5ms)
      expect(
        avgDuration,
        'Average theme initialization should not cause layout thrashing'
      ).toBeLessThan(5);
    });
  });
});
