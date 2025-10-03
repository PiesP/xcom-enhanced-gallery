/**
 * @fileoverview Phase 1-2: Fit 모드 선택 상태 시각화 테스트
 * @description TDD RED: data-selected 속성과 시각적 스타일 검증
 * Epic UX-GALLERY-FEEDBACK-001 Phase 1-2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { useToolbarState } from '@shared/hooks/useToolbarState';

// Mocks
vi.mock('@shared/hooks/useToolbarState', () => ({
  useToolbarState: vi.fn(() => [
    {
      isDownloading: false,
      isLoading: false,
      hasError: false,
      currentFitMode: 'fitWidth',
      needsHighContrast: false,
    },
    {
      setDownloading: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      setCurrentFitMode: vi.fn(),
      setNeedsHighContrast: vi.fn(),
      resetState: vi.fn(),
    },
  ]),
  getToolbarDataState: vi.fn(() => 'idle'),
  getToolbarClassName: vi.fn((_s: any, base: string) => base || 'toolbar'),
}));

vi.mock('@shared/utils', () => ({
  throttleScroll: (fn: any) => fn,
}));

import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import type { ToolbarProps } from '@shared/components/ui/Toolbar/Toolbar.types';

describe('Toolbar - Fit Mode Selected State (Phase 1-2)', () => {
  const createMockProps = (override: Partial<ToolbarProps> = {}): ToolbarProps => ({
    currentIndex: 0,
    totalCount: 5,
    onClose: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onFitOriginal: vi.fn(),
    onFitWidth: vi.fn(),
    onFitHeight: vi.fn(),
    onFitContainer: vi.fn(),
    ...override,
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('data-selected 속성 적용', () => {
    it('should apply data-selected="true" to the button matching currentFitMode', () => {
      const props = createMockProps({ currentFitMode: 'fitWidth' });
      render(() => <Toolbar {...props} />);

      // fitWidth 버튼에만 data-selected="true" 적용
      const fitWidthButton = document.querySelector(
        '[data-gallery-element="fit-width"]'
      ) as HTMLElement;
      const fitOriginalButton = document.querySelector(
        '[data-gallery-element="fit-original"]'
      ) as HTMLElement;
      const fitHeightButton = document.querySelector(
        '[data-gallery-element="fit-height"]'
      ) as HTMLElement;
      const fitContainerButton = document.querySelector(
        '[data-gallery-element="fit-container"]'
      ) as HTMLElement;

      expect(fitWidthButton).toBeTruthy();
      expect(fitWidthButton.getAttribute('data-selected')).toBe('true');

      // 다른 버튼들은 data-selected="false" 또는 속성 없음
      expect(fitOriginalButton?.getAttribute('data-selected')).not.toBe('true');
      expect(fitHeightButton?.getAttribute('data-selected')).not.toBe('true');
      expect(fitContainerButton?.getAttribute('data-selected')).not.toBe('true');
    });

    it('should apply data-selected="true" to fit-original when currentFitMode is original', () => {
      const props = createMockProps({ currentFitMode: 'original' });
      render(() => <Toolbar {...props} />);

      const fitOriginalButton = document.querySelector(
        '[data-gallery-element="fit-original"]'
      ) as HTMLElement;
      const fitWidthButton = document.querySelector(
        '[data-gallery-element="fit-width"]'
      ) as HTMLElement;

      expect(fitOriginalButton?.getAttribute('data-selected')).toBe('true');
      expect(fitWidthButton?.getAttribute('data-selected')).not.toBe('true');
    });

    it('should apply data-selected="true" to fit-container when currentFitMode is fitContainer', () => {
      const props = createMockProps({ currentFitMode: 'fitContainer' });
      render(() => <Toolbar {...props} />);

      const fitContainerButton = document.querySelector(
        '[data-gallery-element="fit-container"]'
      ) as HTMLElement;
      const fitWidthButton = document.querySelector(
        '[data-gallery-element="fit-width"]'
      ) as HTMLElement;

      expect(fitContainerButton?.getAttribute('data-selected')).toBe('true');
      expect(fitWidthButton?.getAttribute('data-selected')).not.toBe('true');
    });

    it('should not apply data-selected="true" if currentFitMode is undefined', () => {
      // Mock의 currentFitMode를 undefined로 설정
      vi.mocked(vi.mocked(useToolbarState as any)).mockReturnValueOnce([
        {
          isDownloading: false,
          isLoading: false,
          hasError: false,
          currentFitMode: undefined, // undefined로 설정
          needsHighContrast: false,
        },
        {
          setDownloading: vi.fn(),
          setLoading: vi.fn(),
          setError: vi.fn(),
          setCurrentFitMode: vi.fn(),
          setNeedsHighContrast: vi.fn(),
          resetState: vi.fn(),
        },
      ]);

      const props = createMockProps();
      // currentFitMode prop도 전달하지 않음
      render(() => <Toolbar {...props} />);

      const fitButtons = document.querySelectorAll('[data-gallery-element^="fit-"]');
      fitButtons.forEach(button => {
        expect(button.getAttribute('data-selected')).not.toBe('true');
      });
    });
  });

  describe('CSS 스타일 적용 (디자인 토큰)', () => {
    it('should have data-selected attribute for CSS targeting', () => {
      const props = createMockProps({ currentFitMode: 'fitHeight' });
      render(() => <Toolbar {...props} />);

      const fitHeightButton = document.querySelector(
        '[data-gallery-element="fit-height"]'
      ) as HTMLElement;

      expect(fitHeightButton).toBeTruthy();
      expect(fitHeightButton.getAttribute('data-selected')).toBe('true');
      // CSS에서 [data-selected='true'] 셀렉터로 스타일 적용 가능
      expect(fitHeightButton.hasAttribute('data-selected')).toBe(true);
    });

    it('should not have data-selected="true" on non-selected buttons', () => {
      const props = createMockProps({ currentFitMode: 'original' });
      render(() => <Toolbar {...props} />);

      const fitWidthButton = document.querySelector(
        '[data-gallery-element="fit-width"]'
      ) as HTMLElement;
      const fitHeightButton = document.querySelector(
        '[data-gallery-element="fit-height"]'
      ) as HTMLElement;
      const fitContainerButton = document.querySelector(
        '[data-gallery-element="fit-container"]'
      ) as HTMLElement;

      // 선택되지 않은 버튼들은 data-selected가 true가 아님
      expect(fitWidthButton?.getAttribute('data-selected')).not.toBe('true');
      expect(fitHeightButton?.getAttribute('data-selected')).not.toBe('true');
      expect(fitContainerButton?.getAttribute('data-selected')).not.toBe('true');
    });
  });

  describe('회귀 방지: 기존 기능 유지', () => {
    it('should maintain existing keyboard navigation functionality', () => {
      const mockOnClose = vi.fn();
      const props = createMockProps({
        currentFitMode: 'fitWidth',
        onClose: mockOnClose,
      });
      render(() => <Toolbar {...props} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeTruthy();

      // Escape 키로 닫기 동작 확인
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      toolbar.dispatchEvent(escapeEvent);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should maintain fit mode click handlers', () => {
      const mockOnFitWidth = vi.fn();
      const props = createMockProps({
        currentFitMode: 'original',
        onFitWidth: mockOnFitWidth,
      });
      render(() => <Toolbar {...props} />);

      const fitWidthButton = screen.getByLabelText('가로에 맞춤');
      expect(fitWidthButton).toBeTruthy();

      // 클릭 동작 확인
      fitWidthButton.click();
      expect(mockOnFitWidth).toHaveBeenCalledTimes(1);
    });

    it('should not break navigation buttons when fit mode is selected', () => {
      const mockOnNext = vi.fn();
      const mockOnPrevious = vi.fn();
      const props = createMockProps({
        currentIndex: 1,
        currentFitMode: 'fitContainer',
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
      });
      render(() => <Toolbar {...props} />);

      const nextButton = screen.getByLabelText('다음 미디어');
      const previousButton = screen.getByLabelText('이전 미디어');

      expect(nextButton).toBeTruthy();
      expect(previousButton).toBeTruthy();

      nextButton.click();
      previousButton.click();

      expect(mockOnNext).toHaveBeenCalledTimes(1);
      expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });
  });
});
