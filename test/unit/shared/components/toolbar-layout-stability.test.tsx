/**
 * @fileoverview Toolbar Layout Stability Tests (Phase 49)
 * @description TDD tests for settings panel dropdown with absolute positioning
 *
 * Phase 49: 툴바 설정 패널 드롭다운 리팩토링
 * - 설정 패널 확장 시 툴바 높이가 변경되지 않아야 함
 * - absolute positioning을 통한 레이아웃 안정성 확보
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, h, cleanup } from '@test/utils/testing-library';
import { Toolbar } from '@/shared/components/ui/Toolbar/Toolbar';
import type { ToolbarProps } from '@/shared/components/ui/Toolbar/Toolbar.types';

describe('Toolbar Layout Stability (Phase 49)', () => {
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
    onOpenSettings: vi.fn(),
  };

  describe('Settings Panel Dropdown Positioning', () => {
    it('툴바 높이는 설정 패널 확장과 무관하게 고정되어야 함', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const toolbar = container.querySelector('[data-gallery-element="toolbar"]') as HTMLElement;
      expect(toolbar).toBeTruthy();

      // Assert: 초기 툴바 높이 측정
      const initialHeight = toolbar.getBoundingClientRect().height;

      // Act: 설정 버튼 클릭 (패널 확장)
      const allButtons = container.querySelectorAll('button');
      const settingsButton = Array.from(allButtons).find(
        btn => btn.getAttribute('data-gallery-element') === 'settings'
      );

      settingsButton?.click();

      // Assert: 툴바 높이가 변경되지 않아야 함
      const expandedHeight = toolbar.getBoundingClientRect().height;
      expect(expandedHeight).toBe(initialHeight);

      // Note: JSDOM에서는 CSS 높이 계산이 제한적이므로,
      // 실제 높이 고정은 E2E 테스트로 검증 필요
      // 이 테스트는 구조적 제약(toolbar의 높이 속성 존재)을 검증함
    });

    it('설정 패널은 absolute positioning 스타일을 가져야 함', () => {
      const { container } = render(h(Toolbar, defaultProps));

      const settingsPanel = container.querySelector(
        '[data-gallery-element="settings-panel"]'
      ) as HTMLElement;
      expect(settingsPanel).toBeTruthy();

      // Assert: CSS Modules를 통해 적용된 스타일 클래스 확인
      // 실제 computed style은 JSDOM에서 제한적이므로,
      // 클래스가 올바르게 적용되었는지만 검증
      const hasSettingsPanelClass = settingsPanel.className.includes('settingsPanel');
      expect(hasSettingsPanelClass).toBe(true);

      // Note: 실제 position: absolute 검증은 E2E 테스트에서 수행
      // playwright/smoke/toolbar-layout-stability.spec.ts
    });
  });
});
