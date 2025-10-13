/**
 * @fileoverview SettingsControls Component Tests (Phase 45 Step 1 - GREEN)
 * @description TDD tests for extracted settings UI component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, h, cleanup } from '../../../test/utils/testing-library';
import { SettingsControls } from '../../../src/shared/components/ui/Settings/SettingsControls';
import type {
  ThemeOption,
  LanguageOption,
} from '../../../src/shared/components/ui/Settings/SettingsControls';

describe('SettingsControls Component', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render theme selection control', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      const themeSelect = container.querySelector('select[id="theme-select"]');
      expect(themeSelect).toBeTruthy();
      expect(themeSelect?.tagName).toBe('SELECT');
    });

    it('should render language selection control', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      const languageSelect = container.querySelector('select[id="language-select"]');
      expect(languageSelect).toBeTruthy();
      expect(languageSelect?.tagName).toBe('SELECT');
    });

    it('should render theme options (auto, light, dark)', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      const themeSelect = container.querySelector('select[id="theme-select"]');
      const options = themeSelect?.querySelectorAll('option');

      expect(options?.length).toBeGreaterThanOrEqual(3);
      const values = Array.from(options || []).map(
        (opt: Element) => (opt as globalThis.HTMLOptionElement).value
      );
      expect(values).toContain('auto');
      expect(values).toContain('light');
      expect(values).toContain('dark');
    });

    it('should render language options (auto, ko, en, ja)', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      const languageSelect = container.querySelector('select[id="language-select"]');
      const options = languageSelect?.querySelectorAll('option');

      expect(options?.length).toBeGreaterThanOrEqual(4);
      const values = Array.from(options || []).map(
        (opt: Element) => (opt as globalThis.HTMLOptionElement).value
      );
      expect(values).toContain('auto');
      expect(values).toContain('ko');
      expect(values).toContain('en');
      expect(values).toContain('ja');
    });
  });

  describe('Current Value Display', () => {
    it('should display current theme value', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'dark',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      const themeSelect = container.querySelector(
        'select[id="theme-select"]'
      ) as globalThis.HTMLSelectElement | null;
      expect(themeSelect?.value).toBe('dark');
    });

    it('should display current language value', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'ko',
          onThemeChange,
          onLanguageChange,
        })
      );

      const languageSelect = container.querySelector(
        'select[id="language-select"]'
      ) as globalThis.HTMLSelectElement | null;
      expect(languageSelect?.value).toBe('ko');
    });
  });

  describe('Change Handlers', () => {
    it('should call onThemeChange when theme is changed', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      const themeSelect = container.querySelector(
        'select[id="theme-select"]'
      ) as globalThis.HTMLSelectElement | null;
      if (themeSelect) {
        themeSelect.value = 'dark';
        themeSelect.dispatchEvent(new globalThis.Event('change', { bubbles: true }));
      }

      expect(onThemeChange).toHaveBeenCalledTimes(1);
    });

    it('should call onLanguageChange when language is changed', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      const languageSelect = container.querySelector(
        'select[id="language-select"]'
      ) as globalThis.HTMLSelectElement | null;
      if (languageSelect) {
        languageSelect.value = 'ja';
        languageSelect.dispatchEvent(new globalThis.Event('change', { bubbles: true }));
      }

      expect(onLanguageChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Compact Mode', () => {
    it('should render controls in compact mode', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
          compact: true,
        })
      );

      // Compact mode should still render controls
      const themeSelect = container.querySelector('select[id="theme-select"]');
      const languageSelect = container.querySelector('select[id="language-select"]');
      expect(themeSelect).toBeTruthy();
      expect(languageSelect).toBeTruthy();
    });

    it('should render labels when compact is false', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      const { container } = render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
          compact: false,
        })
      );

      const themeLabel = container.querySelector('label[for="theme-select"]');
      const languageLabel = container.querySelector('label[for="language-select"]');

      expect(themeLabel).toBeTruthy();
      expect(languageLabel).toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    it('should accept valid theme values', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      // These should compile without errors
      render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      render(
        h(SettingsControls, {
          currentTheme: 'light',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      render(
        h(SettingsControls, {
          currentTheme: 'dark',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      expect(true).toBe(true); // If compilation succeeds, test passes
    });

    it('should accept valid language values', () => {
      const onThemeChange = vi.fn();
      const onLanguageChange = vi.fn();

      // These should compile without errors
      render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'auto',
          onThemeChange,
          onLanguageChange,
        })
      );

      render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'ko',
          onThemeChange,
          onLanguageChange,
        })
      );

      render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'en',
          onThemeChange,
          onLanguageChange,
        })
      );

      render(
        h(SettingsControls, {
          currentTheme: 'auto',
          currentLanguage: 'ja',
          onThemeChange,
          onLanguageChange,
        })
      );

      expect(true).toBe(true); // If compilation succeeds, test passes
    });
  });
});
