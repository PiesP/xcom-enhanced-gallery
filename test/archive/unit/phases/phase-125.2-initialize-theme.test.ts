/**
 * @fileoverview Phase 125.2-A: initialize-theme.ts 커버리지 개선
 * @description 테마 초기화 유틸리티 테스트
 *
 * 목표: 7.36% → 40%
 * 핵심 함수: detectSystemTheme, getSavedThemeSetting, applyThemeToDOM,
 *           resolveAndApplyTheme, initializeTheme, setupThemeChangeListener
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  detectSystemTheme,
  getSavedThemeSetting,
  applyThemeToDOM,
  resolveAndApplyTheme,
  initializeTheme,
  setupThemeChangeListener,
  type ThemeMode,
  type ThemeSetting,
} from '@/features/gallery/services/theme-initialization';

describe('Phase 125.2-A: initialize-theme.ts', () => {
  beforeEach(() => {
    // Reset document state
    document.documentElement.removeAttribute('data-theme');

    // Clear localStorage
    globalThis.localStorage.clear();

    // Reset window.matchMedia mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    globalThis.localStorage.clear();
  });

  describe('detectSystemTheme', () => {
    it('should detect dark theme when system prefers dark', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: true,
          media: '(prefers-color-scheme: dark)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      );

      const theme = detectSystemTheme();
      expect(theme).toBe('dark');

      vi.unstubAllGlobals();
    });

    it('should detect light theme when system prefers light', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      );

      const theme = detectSystemTheme();
      expect(theme).toBe('light');

      vi.unstubAllGlobals();
    });

    it('should fallback to light when matchMedia fails', () => {
      vi.stubGlobal('matchMedia', () => {
        throw new Error('matchMedia not supported');
      });

      const theme = detectSystemTheme();
      expect(theme).toBe('light');

      vi.unstubAllGlobals();
    });
  });

  describe('getSavedThemeSetting', () => {
    it('should return null when no theme is saved', () => {
      const saved = getSavedThemeSetting();
      expect(saved).toBeNull();
    });

    it('should return saved theme setting when valid', () => {
      globalThis.localStorage.setItem('xeg-theme', 'dark');
      const saved = getSavedThemeSetting();
      expect(saved).toBe('dark');
    });

    it('should return auto setting when saved', () => {
      globalThis.localStorage.setItem('xeg-theme', 'auto');
      const saved = getSavedThemeSetting();
      expect(saved).toBe('auto');
    });

    it('should return null for invalid theme values', () => {
      globalThis.localStorage.setItem('xeg-theme', 'invalid');
      const saved = getSavedThemeSetting();
      expect(saved).toBeNull();
    });

    it('should return null when localStorage throws', () => {
      vi.spyOn(globalThis.Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const saved = getSavedThemeSetting();
      expect(saved).toBeNull();

      vi.restoreAllMocks();
    });
  });

  describe('applyThemeToDOM', () => {
    it('should set data-theme attribute to light', () => {
      applyThemeToDOM('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should set data-theme attribute to dark', () => {
      applyThemeToDOM('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should update existing theme attribute', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      applyThemeToDOM('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('resolveAndApplyTheme', () => {
    it('should use explicit light theme', () => {
      const resolved = resolveAndApplyTheme('light');
      expect(resolved).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should use explicit dark theme', () => {
      const resolved = resolveAndApplyTheme('dark');
      expect(resolved).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should resolve auto to system theme (dark)', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: true,
          media: '(prefers-color-scheme: dark)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      );

      const resolved = resolveAndApplyTheme('auto');
      expect(resolved).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      vi.unstubAllGlobals();
    });

    it('should resolve auto to system theme (light)', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      );

      const resolved = resolveAndApplyTheme('auto');
      expect(resolved).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      vi.unstubAllGlobals();
    });
  });

  describe('initializeTheme', () => {
    it('should initialize with auto theme when no saved setting', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      );

      const theme = initializeTheme();
      expect(theme).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      vi.unstubAllGlobals();
    });

    it('should initialize with saved theme setting', () => {
      globalThis.localStorage.setItem('xeg-theme', 'dark');

      const theme = initializeTheme();
      expect(theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should resolve auto setting from localStorage', () => {
      globalThis.localStorage.setItem('xeg-theme', 'auto');

      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: true,
          media: '(prefers-color-scheme: dark)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }))
      );

      const theme = initializeTheme();
      expect(theme).toBe('dark');

      vi.unstubAllGlobals();
    });
  });

  describe('setupThemeChangeListener', () => {
    it('should register theme change listener', () => {
      const addEventListenerSpy = vi.fn();
      const removeEventListenerSpy = vi.fn();

      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: addEventListenerSpy,
          removeEventListener: removeEventListenerSpy,
        }))
      );

      const onThemeChange = vi.fn();
      const cleanup = setupThemeChangeListener(onThemeChange);

      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

      cleanup();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));

      vi.unstubAllGlobals();
    });

    it('should call onThemeChange when system theme changes and setting is auto', () => {
      let changeHandler: ((event: { matches: boolean }) => void) | undefined;
      const addEventListener = vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler as (event: { matches: boolean }) => void;
        }
      });

      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener,
          removeEventListener: vi.fn(),
        }))
      );

      globalThis.localStorage.setItem('xeg-theme', 'auto');

      const onThemeChange = vi.fn();
      setupThemeChangeListener(onThemeChange);

      // Simulate system theme change to dark
      if (changeHandler) {
        changeHandler({ matches: true });
      }

      expect(onThemeChange).toHaveBeenCalledWith('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      vi.unstubAllGlobals();
    });

    it('should not call onThemeChange when setting is not auto', () => {
      let changeHandler: ((event: { matches: boolean }) => void) | undefined;
      const addEventListener = vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler as (event: { matches: boolean }) => void;
        }
      });

      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener,
          removeEventListener: vi.fn(),
        }))
      );

      globalThis.localStorage.setItem('xeg-theme', 'light');

      const onThemeChange = vi.fn();
      setupThemeChangeListener(onThemeChange);

      // Simulate system theme change
      if (changeHandler) {
        changeHandler({ matches: true });
      }

      expect(onThemeChange).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('should return noop cleanup when matchMedia not available', () => {
      vi.stubGlobal('matchMedia', undefined);

      const onThemeChange = vi.fn();
      const cleanup = setupThemeChangeListener(onThemeChange);

      expect(cleanup).toBeTypeOf('function');
      expect(() => cleanup()).not.toThrow();

      vi.unstubAllGlobals();
    });

    it('should return noop cleanup when addEventListener fails', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: false,
          media: '(prefers-color-scheme: dark)',
          addEventListener: () => {
            throw new Error('addEventListener failed');
          },
          removeEventListener: vi.fn(),
        }))
      );

      const onThemeChange = vi.fn();
      const cleanup = setupThemeChangeListener(onThemeChange);

      expect(cleanup).toBeTypeOf('function');
      expect(() => cleanup()).not.toThrow();

      vi.unstubAllGlobals();
    });
  });
});
