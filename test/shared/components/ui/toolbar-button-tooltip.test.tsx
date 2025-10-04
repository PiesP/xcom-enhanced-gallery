/**
 * Phase 4 RED: ToolbarButton Tooltip 통합 테스트
 *
 * 목표: ToolbarButton에 커스텀 Tooltip 통합 검증
 * - *WithShortcut i18n 키를 <kbd> 마크업으로 렌더링
 * - title prop 제거하고 Tooltip으로 대체
 * - PC 전용 이벤트로 툴팁 트리거
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { ToolbarButton } from '@shared/components/ui/ToolbarButton/ToolbarButton';
import { LanguageService } from '@shared/services/LanguageService';

describe('ToolbarButton Tooltip Integration (Phase 4 RED)', () => {
  let languageService: LanguageService;

  beforeEach(() => {
    vi.useFakeTimers();
    languageService = new LanguageService();
  });

  describe('Tooltip 렌더링', () => {
    it('should render tooltip with <kbd> markup for shortcut keys on mouseenter', async () => {
      const { container } = render(() => (
        <ToolbarButton
          icon='ChevronLeft'
          aria-label={languageService.getString('toolbar.previousMedia')}
          tooltipText={languageService.getString('toolbar.previousMediaWithShortcut')}
          data-testid='prev-button'
        />
      ));

      const button = screen.getByTestId('prev-button');

      // mouseenter 트리거
      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      // Tooltip이 표시되고 <kbd>←</kbd> 마크업 포함되어야 함
      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();

      const kbdElement = tooltip?.querySelector('kbd');
      expect(kbdElement).toBeInTheDocument();
      expect(kbdElement?.textContent).toBe('←');
    });

    it('should render tooltip for download button with Ctrl+D shortcut', async () => {
      const { container } = render(() => (
        <ToolbarButton
          icon='Download'
          aria-label={languageService.getString('toolbar.downloadCurrent')}
          tooltipText={languageService.getString('toolbar.downloadCurrentWithShortcut')}
          data-testid='download-button'
        />
      ));

      const button = screen.getByTestId('download-button');

      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();

      // "Ctrl+D" 텍스트가 포함되어야 함
      const kbdElements = tooltip?.querySelectorAll('kbd');
      expect(kbdElements?.length).toBeGreaterThan(0);

      const tooltipText = tooltip?.textContent || '';
      expect(tooltipText).toContain('Ctrl');
      expect(tooltipText).toContain('D');
    });

    it('should render tooltip for close button with Esc shortcut', async () => {
      const { container } = render(() => (
        <ToolbarButton
          icon='XMark'
          intent='danger'
          aria-label={languageService.getString('toolbar.closeGallery')}
          tooltipText={languageService.getString('toolbar.closeGalleryWithShortcut')}
          data-testid='close-button'
        />
      ));

      const button = screen.getByTestId('close-button');

      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();

      const kbdElement = tooltip?.querySelector('kbd');
      expect(kbdElement).toBeInTheDocument();
      expect(kbdElement?.textContent).toBe('Esc');
    });
  });

  describe('title prop 제거', () => {
    it('should not render native title attribute', () => {
      render(() => (
        <ToolbarButton
          icon='ChevronLeft'
          aria-label={languageService.getString('toolbar.previousMedia')}
          tooltipText={languageService.getString('toolbar.previousMediaWithShortcut')}
          data-testid='prev-button'
        />
      ));

      const button = screen.getByTestId('prev-button');

      // title 속성이 없어야 함 (Tooltip으로 대체)
      expect(button.hasAttribute('title')).toBe(false);
    });
  });

  describe('PC 전용 이벤트', () => {
    it('should show tooltip on focus (keyboard navigation)', async () => {
      const { container } = render(() => (
        <ToolbarButton
          icon='ChevronLeft'
          aria-label={languageService.getString('toolbar.previousMedia')}
          tooltipText={languageService.getString('toolbar.previousMediaWithShortcut')}
          data-testid='prev-button'
        />
      ));

      const button = screen.getByTestId('prev-button');

      button.focus();
      vi.runAllTimers();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
    });

    it('should hide tooltip on blur', async () => {
      const { container } = render(() => (
        <ToolbarButton
          icon='ChevronLeft'
          aria-label={languageService.getString('toolbar.previousMedia')}
          tooltipText={languageService.getString('toolbar.previousMediaWithShortcut')}
          data-testid='prev-button'
        />
      ));

      const button = screen.getByTestId('prev-button');

      // Focus로 툴팁 표시
      button.focus();
      vi.runAllTimers();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      let tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('aria-hidden')).not.toBe('true');

      // Blur로 툴팁 숨김
      button.blur();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('다국어 지원', () => {
    it('should render tooltip in Korean for ko locale', async () => {
      languageService.setLanguage('ko');

      const { container } = render(() => (
        <ToolbarButton
          icon='ChevronLeft'
          aria-label={languageService.getString('toolbar.previousMedia')}
          tooltipText={languageService.getString('toolbar.previousMediaWithShortcut')}
          data-testid='prev-button'
        />
      ));

      const button = screen.getByTestId('prev-button');

      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip?.textContent).toContain('이전 미디어');
    });

    it('should render tooltip in English for en locale', async () => {
      languageService.setLanguage('en');

      const { container } = render(() => (
        <ToolbarButton
          icon='ChevronLeft'
          aria-label={languageService.getString('toolbar.previousMedia')}
          tooltipText={languageService.getString('toolbar.previousMediaWithShortcut')}
          data-testid='prev-button'
        />
      ));

      const button = screen.getByTestId('prev-button');

      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip?.textContent).toContain('Previous media');
    });
  });
});
