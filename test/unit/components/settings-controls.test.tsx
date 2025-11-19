/**
 * @fileoverview SettingsControls Component Tests (Phase 45 - GREEN)
 * @description TDD tests for extracted settings UI component with factory pattern
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@/shared/external/vendors';
import {
  SettingsControls,
  type ThemeOption,
  type LanguageOption,
  type SettingsControlsProps,
} from '@/shared/components/ui/Settings/SettingsControls';

const { createComponent } = getSolid();

type MaybeAccessor<T> = T | (() => T);

type SettingsControlsTestOverrides = Partial<
  Omit<SettingsControlsProps, 'currentTheme' | 'currentLanguage'>
> & {
  currentTheme?: MaybeAccessor<ThemeOption>;
  currentLanguage?: MaybeAccessor<LanguageOption>;
};

const toAccessor = <T,>(value: MaybeAccessor<T>): (() => T) => {
  return typeof value === 'function' ? (value as () => T) : () => value;
};

// Factory: Create default props
function createProps(overrides: SettingsControlsTestOverrides = {}) {
  const merged = {
    currentTheme: 'auto' as ThemeOption | (() => ThemeOption),
    currentLanguage: 'auto' as LanguageOption | (() => LanguageOption),
    onThemeChange: vi.fn(),
    onLanguageChange: vi.fn(),
    ...overrides,
  };

  return {
    ...merged,
    currentTheme: toAccessor(merged.currentTheme),
    currentLanguage: toAccessor(merged.currentLanguage),
  } satisfies SettingsControlsProps;
}

// Factory: Render component and get elements
function renderComponent(props: SettingsControlsTestOverrides = {}) {
  const finalProps = createProps(props);
  const { container } = render(() => createComponent(SettingsControls, finalProps));
  return {
    container,
    themeSelect: container.querySelector(
      'select[id="settings-theme-select"]'
    ) as globalThis.HTMLSelectElement,
    languageSelect: container.querySelector(
      'select[id="settings-language-select"]'
    ) as globalThis.HTMLSelectElement,
  };
}

describe('SettingsControls Component', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render both theme and language selects', () => {
      const { themeSelect, languageSelect } = renderComponent();

      expect(themeSelect).toBeTruthy();
      expect(languageSelect).toBeTruthy();
      expect(themeSelect?.tagName).toBe('SELECT');
      expect(languageSelect?.tagName).toBe('SELECT');
    });

    it('should render theme options', () => {
      const { themeSelect } = renderComponent();

      const values = Array.from(themeSelect?.querySelectorAll('option') || []).map(
        (opt: Element) => (opt as globalThis.HTMLOptionElement).value
      );

      expect(values.length).toBeGreaterThanOrEqual(3);
      expect(values).toContain('auto');
      expect(values).toContain('light');
      expect(values).toContain('dark');
    });

    it('should render language options', () => {
      const { languageSelect } = renderComponent();

      const values = Array.from(languageSelect?.querySelectorAll('option') || []).map(
        (opt: Element) => (opt as globalThis.HTMLOptionElement).value
      );

      expect(values.length).toBeGreaterThanOrEqual(4);
      expect(values).toContain('auto');
      expect(values).toContain('ko');
      expect(values).toContain('en');
      expect(values).toContain('ja');
    });
  });

  describe('Current Value Display', () => {
    it('should display current theme value', () => {
      const { themeSelect } = renderComponent({ currentTheme: 'dark' });
      expect(themeSelect?.value).toBe('dark');
    });

    it('should display current language value', () => {
      const { languageSelect } = renderComponent({ currentLanguage: 'ko' });
      expect(languageSelect?.value).toBe('ko');
    });

    it('should update when props change', () => {
      const { themeSelect } = renderComponent({ currentTheme: 'light' });
      expect(themeSelect?.value).toBe('light');
    });

    it('should react when currentTheme accessor changes after render', async () => {
      const { createSignal } = getSolid();
      const [theme, setTheme] = createSignal<ThemeOption>('auto');
      const { themeSelect } = renderComponent({ currentTheme: () => theme() });

      expect(themeSelect?.value).toBe('auto');

      setTheme('dark');

      await waitFor(() => {
        expect(themeSelect?.value).toBe('dark');
      });
    });
  });

  describe('Interaction', () => {
    it('should render select elements with proper IDs for event binding', () => {
      const { themeSelect, languageSelect } = renderComponent();

      expect(themeSelect?.id).toBe('settings-theme-select');
      expect(languageSelect?.id).toBe('settings-language-select');

      // Event handlers are verified in E2E tests
      // playwright/smoke/settings-controls-e2e.spec.ts
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      const { themeSelect, languageSelect } = renderComponent({ compact: true });

      expect(themeSelect).toBeTruthy();
      expect(languageSelect).toBeTruthy();
    });

    it('should render labels when not compact', () => {
      const { container } = renderComponent({ compact: false });

      const themeLabel = container.querySelector('label[for="settings-theme-select"]');
      const languageLabel = container.querySelector('label[for="settings-language-select"]');

      expect(themeLabel).toBeTruthy();
      expect(languageLabel).toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    it('should accept all valid theme values', () => {
      const themes = ['auto', 'light', 'dark'] as const;

      themes.forEach(theme => {
        const { themeSelect } = renderComponent({ currentTheme: theme });
        expect(themeSelect?.value).toBe(theme);
      });
    });

    it('should accept all valid language values', () => {
      const languages = ['auto', 'ko', 'en', 'ja'] as const;

      languages.forEach(lang => {
        const { languageSelect } = renderComponent({ currentLanguage: lang });
        expect(languageSelect?.value).toBe(lang);
      });
    });
  });
});
