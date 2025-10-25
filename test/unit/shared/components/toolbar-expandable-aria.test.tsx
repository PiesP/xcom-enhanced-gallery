/**
 * @fileoverview Phase 47: Toolbar Expandable Panel Accessibility Tests
 * @description ARIA collapse pattern 검증 (간소화 버전 - 키보드는 E2E에서 검증)
 *
 * ✅ E2E Migration Complete (Phase 82.5): Interactive aria-expanded tests migrated
 *   - playwright/smoke/toolbar-aria-e2e.spec.ts (3 tests)
 *   - Migration Status: All interactive ARIA tests passing in E2E
 *   - Remaining: Static ARIA attribute verification tests (7 tests in this file)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ToolbarProps } from '../../../src/shared/components/ui/Toolbar/Toolbar.types';
import { setSettingsExpanded } from '../../../src/shared/state/signals/toolbar.signals';
import { getSolid } from '../../../src/shared/external/vendors';

const { render, cleanup } = await import('../../utils/testing-library');

describe('Phase 47: Toolbar Expandable Panel Accessibility (ARIA)', () => {
  const solid = getSolid();

  beforeEach(() => {
    cleanup();
    setSettingsExpanded(false); // 초기 상태 리셋
  });

  describe('ARIA Collapse Pattern', () => {
    it('설정 버튼에 aria-expanded 속성이 false로 초기화되어야 함', async () => {
      const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

      const props: ToolbarProps = {
        currentIndex: 0,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
      };

      const { container } = render(() => solid.createComponent(Toolbar, props));

      const allButtons = container.querySelectorAll('button');
      const settingsButton = Array.from(allButtons).find(
        btn => btn.getAttribute('data-gallery-element') === 'settings'
      );

      expect(settingsButton).toBeTruthy();
      expect(settingsButton?.getAttribute('aria-expanded')).toBe('false');
    });

    it('설정 버튼에 aria-controls 속성이 패널 ID를 참조해야 함', async () => {
      const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

      const props: ToolbarProps = {
        currentIndex: 0,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
      };

      const { container } = render(() => solid.createComponent(Toolbar, props));

      const allButtons = container.querySelectorAll('button');
      const settingsButton = Array.from(allButtons).find(
        btn => btn.getAttribute('data-gallery-element') === 'settings'
      );

      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');

      expect(settingsButton?.getAttribute('aria-controls')).toBe('toolbar-settings-panel');
      expect(settingsPanel?.getAttribute('id')).toBe('toolbar-settings-panel');
    });

    it('설정 패널에 aria-labelledby 속성이 버튼 ID를 참조해야 함', async () => {
      const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

      const props: ToolbarProps = {
        currentIndex: 0,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
      };

      const { container } = render(() => solid.createComponent(Toolbar, props));

      const allButtons = container.querySelectorAll('button');
      const settingsButton = Array.from(allButtons).find(
        btn => btn.getAttribute('data-gallery-element') === 'settings'
      );

      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');

      expect(settingsButton?.getAttribute('id')).toBe('settings-button');
      expect(settingsPanel?.getAttribute('aria-labelledby')).toBe('settings-button');
    });
  });

  describe('Screen Reader Support', () => {
    it('설정 패널이 role="region"을 가져야 함', async () => {
      const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

      const props: ToolbarProps = {
        currentIndex: 0,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
      };

      const { container } = render(() => solid.createComponent(Toolbar, props));

      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');

      expect(settingsPanel?.getAttribute('role')).toBe('region');
    });

    it('설정 패널이 aria-label을 가져야 함', async () => {
      const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

      const props: ToolbarProps = {
        currentIndex: 0,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
      };

      const { container } = render(() => solid.createComponent(Toolbar, props));

      const settingsPanel = container.querySelector('[data-gallery-element="settings-panel"]');

      expect(settingsPanel?.getAttribute('aria-label')).toMatch(/설정/);
    });

    it('설정 버튼이 적절한 aria-label을 가져야 함', async () => {
      const { Toolbar } = await import('../../../src/shared/components/ui/Toolbar/Toolbar');

      const props: ToolbarProps = {
        currentIndex: 0,
        totalCount: 5,
        onPrevious: vi.fn(),
        onNext: vi.fn(),
        onDownloadCurrent: vi.fn(),
        onDownloadAll: vi.fn(),
        onClose: vi.fn(),
        onOpenSettings: vi.fn(),
      };

      const { container } = render(() => solid.createComponent(Toolbar, props));

      const allButtons = container.querySelectorAll('button');
      const settingsButton = Array.from(allButtons).find(
        btn => btn.getAttribute('data-gallery-element') === 'settings'
      );

      expect(settingsButton?.getAttribute('aria-label')).toMatch(/설정/);
    });
  });
});
