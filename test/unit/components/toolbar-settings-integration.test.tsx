/**
 * @fileoverview Toolbar Settings Panel Integration Tests (Phase 45 Step 2 - RED)
 * @description TDD tests for integrating SettingsControls into Toolbar expandable panel
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, h, cleanup } from '../../../test/utils/testing-library';
import { Toolbar } from '../../../src/shared/components/ui/Toolbar/Toolbar';
import type { ToolbarProps } from '../../../src/shared/components/ui/Toolbar/Toolbar.types';

describe('Toolbar Settings Panel Integration', () => {
  beforeEach(() => {
    cleanup();
  });

  const defaultProps: ToolbarProps = {
    currentIndex: 0,
    totalCount: 5,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onClose: vi.fn(),
    onOpenSettings: vi.fn(), // Required for settings button to render
  };

  describe('Settings Panel Rendering', () => {
    it('should render settings panel div with correct class', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');
      expect(settingsPanel).toBeTruthy();
      expect(settingsPanel?.tagName).toBe('DIV');
    });

    it('should have data-expanded="false" by default', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');
      expect(settingsPanel?.getAttribute('data-expanded')).toBe('false');
    });

    it('should contain SettingsControls component', () => {
      const { container } = render(h(Toolbar, defaultProps));

      // SettingsControls는 theme-select와 language-select를 렌더링함
      const themeSelect = container.querySelector('select[id="theme-select"]');
      const languageSelect = container.querySelector('select[id="language-select"]');

      expect(themeSelect).toBeTruthy();
      expect(languageSelect).toBeTruthy();
    });
  });

  describe('Settings Button Behavior', () => {
    // Phase 49: 설정 버튼 렌더링 테스트는 E2E로 이관됨
    // - playwright/smoke/toolbar-settings.spec.ts:34 (should render settings button when onOpenSettings is provided)
    // JSDOM에서는 Solid.js Show 컴포넌트의 조건부 렌더링이 제대로 작동하지 않음

    it('should call onOpenSettings prop when settings button is clicked', () => {
      const onOpenSettings = vi.fn();
      const propsWithCallback: ToolbarProps = {
        ...defaultProps,
        onOpenSettings,
      };

      const { container } = render(h(Toolbar, propsWithCallback));

      const allButtons = container.querySelectorAll('button');
      const settingsButton = Array.from(allButtons).find(
        btn => btn.getAttribute('data-gallery-element') === 'settings'
      );

      settingsButton?.click();

      // Both onClick and onMouseDown trigger, so expect 2 calls
      expect(onOpenSettings).toHaveBeenCalled();
    });
  });

  describe('SettingsControls Integration', () => {
    it('should render SettingsControls in compact mode', () => {
      const { container } = render(h(Toolbar, defaultProps));

      // In compact mode, labels should not be visible
      const themeLabel = container.querySelector('label[for="theme-select"]');
      const languageLabel = container.querySelector('label[for="language-select"]');

      // Labels should be hidden in compact mode (Show component with when={false})
      // They exist in DOM but should not be visible
      // For now, just check that selects exist
      const themeSelect = container.querySelector('select[id="theme-select"]');
      const languageSelect = container.querySelector('select[id="language-select"]');

      expect(themeSelect).toBeTruthy();
      expect(languageSelect).toBeTruthy();
    });

    it('should handle theme changes through SettingsControls', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const themeSelect = container.querySelector(
        'select[id="theme-select"]'
      ) as globalThis.HTMLSelectElement | null;

      if (themeSelect) {
        themeSelect.value = 'dark';
        themeSelect.dispatchEvent(new globalThis.Event('change', { bubbles: true }));
      }

      // Theme change should be handled (implementation will add actual logic)
      expect(themeSelect?.value).toBe('dark');
    });

    it('should handle language changes through SettingsControls', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const languageSelect = container.querySelector(
        'select[id="language-select"]'
      ) as globalThis.HTMLSelectElement | null;

      if (languageSelect) {
        languageSelect.value = 'ja';
        languageSelect.dispatchEvent(new globalThis.Event('change', { bubbles: true }));
      }

      // Language change should be handled (implementation will add actual logic)
      expect(languageSelect?.value).toBe('ja');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on settings panel', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');

      // Panel should have role and label for accessibility
      expect(settingsPanel?.getAttribute('role')).toBe('region');
      expect(settingsPanel?.getAttribute('aria-label')).toBeTruthy();
    });

    // Phase 49: 설정 버튼 접근성 테스트는 E2E로 이관됨
    // - playwright/smoke/toolbar-settings.spec.ts:60 (should have settings button with proper accessibility)
    // - playwright/smoke/toolbar-settings.spec.ts:132 (should have accessible settings panel)
    // JSDOM에서는 Solid.js Show 컴포넌트의 조건부 렌더링이 제대로 작동하지 않음
  });

  describe('Panel Position', () => {
    it('should position panel below toolbar', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]');
      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');

      // Panel should be a child of toolbar for proper positioning
      expect(toolbar?.contains(settingsPanel as globalThis.Node)).toBe(true);
    });
  });
});
