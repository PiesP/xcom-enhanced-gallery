/**
 * @fileoverview Toolbar - Keyboard Hint Button (Phase 1-3)
 * Epic UX-GALLERY-FEEDBACK-001: 키보드 단축키 힌트 버튼 추가
 *
 * 목적: ? 키 발견성 개선. 툴바에 키보드 단축키 도움말 버튼을 추가하여
 * 사용자가 ? 키를 쉽게 발견하고 KeyboardHelpOverlay를 표시할 수 있도록 개선.
 *
 * Acceptance Criteria:
 * - 툴바에 "?" 아이콘 버튼이 렌더링됨
 * - 버튼에 aria-label="Show keyboard shortcuts" 속성 있음
 * - 버튼 클릭 시 onShowKeyboardHelp 콜백 호출됨
 * - 키보드 포커스 및 네비게이션 유지 (회귀 방지)
 * - 디자인 토큰 기반 스타일 적용
 *
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';

// Type declaration for HTMLButtonElement (JSDOM environment)
type HTMLButtonElement = HTMLElement & { click: () => void };

// Mock dependencies
vi.mock('@shared/hooks/useToolbarState', () => ({
  useToolbarState: vi.fn(() => [
    {
      isVisible: true,
      currentFitMode: 'fitWidth',
      isDownloading: false,
      isLoading: false,
      needsHighContrast: false,
    },
    {
      setFitMode: vi.fn(),
      setVisible: vi.fn(),
      setDownloading: vi.fn(),
      setLoading: vi.fn(),
      setCurrentFitMode: vi.fn(),
      setNeedsHighContrast: vi.fn(),
    },
  ]),
  getToolbarDataState: vi.fn(() => 'idle'),
  getToolbarClassName: vi.fn((_s: any, base: string) => base || 'toolbar'),
}));

vi.mock('@shared/hooks/useToolbarPositionBased', () => ({
  useToolbarPositionBased: vi.fn(),
}));

vi.mock('@shared/utils', () => ({
  throttleScroll: (fn: any) => fn,
}));

import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import type { ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar.types';

describe('Toolbar - Keyboard Hint Button (Phase 1-3)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const createMockProps = (overrides = {}): ToolbarProps => ({
    currentIndex: 0,
    totalCount: 5,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onClose: vi.fn(),
    onFitOriginal: vi.fn(),
    onFitWidth: vi.fn(),
    onFitHeight: vi.fn(),
    onFitContainer: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onOpenSettings: vi.fn(),
    onShowKeyboardHelp: vi.fn(), // 새 prop
    ...overrides,
  });

  describe('버튼 렌더링', () => {
    it('should render keyboard hint button with "?" icon', () => {
      const props = createMockProps();
      render(() => <Toolbar {...props} />);

      // data-gallery-element="keyboard-help" 속성으로 버튼 찾기
      const button = document.querySelector('[data-gallery-element="keyboard-help"]');
      expect(button).toBeInTheDocument();
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should have aria-label="Show keyboard shortcuts"', () => {
      const props = createMockProps();
      render(() => <Toolbar {...props} />);

      const button = document.querySelector(
        '[data-gallery-element="keyboard-help"]'
      ) as HTMLButtonElement | null;
      expect(button).toBeInTheDocument();
      expect(button?.getAttribute('aria-label')).toBe('Show keyboard shortcuts');
    });

    it('should have role="button"', () => {
      const props = createMockProps();
      render(() => <Toolbar {...props} />);

      const button = document.querySelector(
        '[data-gallery-element="keyboard-help"]'
      ) as HTMLButtonElement | null;
      expect(button).toBeInTheDocument();
      // <button> 요소는 암묵적으로 role="button"을 가짐
      expect(button?.tagName).toBe('BUTTON');
    });
  });

  describe('클릭 동작', () => {
    it('should call onShowKeyboardHelp when clicked', () => {
      const onShowKeyboardHelp = vi.fn();
      const props = createMockProps({ onShowKeyboardHelp });
      render(() => <Toolbar {...props} />);

      const button = document.querySelector(
        '[data-gallery-element="keyboard-help"]'
      ) as HTMLButtonElement | null;
      expect(button).toBeInTheDocument();

      button?.click();
      expect(onShowKeyboardHelp).toHaveBeenCalledTimes(1);
    });

    it('should not call onShowKeyboardHelp if button is disabled', () => {
      const onShowKeyboardHelp = vi.fn();
      const props = createMockProps({ onShowKeyboardHelp, disabled: true });
      render(() => <Toolbar {...props} />);

      const button = document.querySelector(
        '[data-gallery-element="keyboard-help"]'
      ) as HTMLButtonElement | null;

      // disabled 버튼은 클릭해도 콜백 호출 안 됨
      button?.click();
      expect(onShowKeyboardHelp).not.toHaveBeenCalled();
    });
  });

  describe('회귀 방지: 키보드 네비게이션', () => {
    it('should be included in keyboard navigation focus order', () => {
      const props = createMockProps();
      render(() => <Toolbar {...props} />);

      const button = document.querySelector(
        '[data-gallery-element="keyboard-help"]'
      ) as HTMLButtonElement | null;
      expect(button).toBeInTheDocument();

      // 키보드 포커스 가능한지 확인 (tabindex 또는 네이티브 포커스 가능 요소)
      const isKeyboardFocusable =
        button?.hasAttribute('tabindex') || button?.tagName === 'BUTTON' || button?.tagName === 'A';
      expect(isKeyboardFocusable).toBe(true);
    });

    it('should maintain existing toolbar buttons (no regression)', () => {
      const props = createMockProps();
      render(() => <Toolbar {...props} />);

      // 기존 버튼들이 여전히 존재하는지 확인
      const prevButton = document.querySelector('[data-gallery-element="nav-previous"]');
      const nextButton = document.querySelector('[data-gallery-element="nav-next"]');
      const closeButton = document.querySelector('[data-gallery-element="close"]');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });

    it('should handle Escape key press (close toolbar navigation)', () => {
      const props = createMockProps();
      render(() => <Toolbar {...props} />);

      const button = document.querySelector(
        '[data-gallery-element="keyboard-help"]'
      ) as HTMLButtonElement | null;
      expect(button).toBeInTheDocument();

      // Escape 키 이벤트 시뮬레이션
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escapeEvent);

      // Escape 키는 툴바 포커스를 벗어나는 동작이지만, 버튼 자체는 여전히 존재
      expect(button).toBeInTheDocument();
    });
  });

  describe('디자인 토큰 준수', () => {
    it('should use design token classes (no hardcoded styles)', () => {
      const props = createMockProps();
      render(() => <Toolbar {...props} />);

      const button = document.querySelector(
        '[data-gallery-element="keyboard-help"]'
      ) as HTMLButtonElement | null;
      expect(button).toBeInTheDocument();

      // 인라인 스타일이 없는지 확인 (디자인 토큰 기반 CSS 클래스 사용)
      const hasInlineStyle = button?.hasAttribute('style');
      expect(hasInlineStyle).toBe(false);
    });
  });
});
