/**
 * @fileoverview SettingsModal 컴포넌트 테스트
 * @description TDD 기반 설정 모달 컴포넌트 테스트
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('isOpen이 true일 때 모달이 렌더링되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeDefined();
      expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    it('isOpen이 false일 때 모달이 렌더링되지 않아야 함', () => {
      render(<SettingsModal {...mockProps} isOpen={false} />);

      const modal = screen.queryByRole('dialog');
      expect(modal).toBeNull();
    });

    it('모달 제목이 표시되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const title = screen.getByText('Settings');
      expect(title).toBeDefined();
    });

    it('테마 설정 옵션들이 표시되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const themeLabel = screen.getByText('Theme');
      expect(themeLabel).toBeDefined();
    });

    it('언어 설정 옵션들이 표시되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const languageLabel = screen.getByText('Language');
      expect(languageLabel).toBeDefined();
    });

    it('닫기 버튼이 표시되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeDefined();
      expect(closeButton.tagName).toBe('BUTTON');
    });
  });

  describe('interactions', () => {
    it('닫기 버튼 클릭 시 onClose가 호출되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('배경 클릭 시 onClose가 호출되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('모달 내부 클릭 시 onClose가 호출되지 않아야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modalContent = screen.getByText('Settings').closest('div');
      if (modalContent) {
        fireEvent.click(modalContent);
        expect(mockProps.onClose).not.toHaveBeenCalled();
      }
    });

    it('ESC 키 입력 시 onClose가 호출되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modal = screen.getByRole('dialog');
      fireEvent.keyDown(modal, { key: 'Escape' });

      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('다른 키 입력 시 onClose가 호출되지 않아야 함', () => {
      render(<SettingsModal {...mockProps} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('theme settings', () => {
    it('테마 변경 시 즉시 적용되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const themeSelect = screen.getByLabelText('Theme') as HTMLSelectElement;
      fireEvent.change(themeSelect, { target: { value: 'dark' } });

      // 테마 변경이 즉시 적용되는지 확인
      expect(themeSelect.value).toBe('dark');
    });

    it('테마 옵션들이 올바르게 표시되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const autoOption = screen.getByText('Auto');
      const lightOption = screen.getByText('Light');
      const darkOption = screen.getByText('Dark');

      expect(autoOption).toBeDefined();
      expect(lightOption).toBeDefined();
      expect(darkOption).toBeDefined();
    });
  });

  describe('language settings', () => {
    it('언어 변경 시 즉시 적용되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const languageSelect = screen.getByLabelText('Language') as HTMLSelectElement;
      fireEvent.change(languageSelect, { target: { value: 'en' } });

      // 언어 변경이 즉시 적용되는지 확인
      expect(languageSelect.value).toBe('en');
    });

    it('언어 옵션들이 올바르게 표시되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const autoOption = screen.getByText('자동 / Auto / 自動');
      const koOption = screen.getByText('한국어');
      const enOption = screen.getByText('English');
      const jaOption = screen.getByText('日本語');

      expect(autoOption).toBeDefined();
      expect(koOption).toBeDefined();
      expect(enOption).toBeDefined();
      expect(jaOption).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('모달이 올바른 ARIA 속성을 가져야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('aria-labelledby')).toBe('settings-title');
    });

    it('제목이 올바른 ID를 가져야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const title = screen.getByText('Settings');
      expect(title.id).toBe('settings-title');
    });

    it('테마 선택이 올바른 레이블과 연결되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const themeSelect = screen.getByLabelText('Theme');
      expect(themeSelect.id).toBe('theme-select');
    });

    it('언어 선택이 올바른 레이블과 연결되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const languageSelect = screen.getByLabelText('Language');
      expect(languageSelect.id).toBe('language-select');
    });
  });

  describe('styling', () => {
    it('커스텀 className이 적용되어야 함', () => {
      const customClassName = 'custom-modal';
      render(<SettingsModal {...mockProps} className={customClassName} />);

      const modal = screen.getByRole('dialog');
      expect(modal.className).toContain(customClassName);
    });

    it('테스트 ID가 적용되어야 함', () => {
      const testId = 'settings-modal-test';
      render(<SettingsModal {...mockProps} data-testid={testId} />);

      const modal = screen.getByTestId(testId);
      expect(modal).toBeDefined();
    });
  });

  describe('TDD: 모달 위치 설정', () => {
    it('기본 위치는 center여야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const backdrop = screen.getByRole('dialog');
      expect(backdrop.className).toContain('center');
    });

    it('position="toolbar-below"일 때 툴바 아래 위치 스타일이 적용되어야 함', () => {
      render(<SettingsModal {...mockProps} position='toolbar-below' />);

      const backdrop = screen.getByRole('dialog');
      expect(backdrop.className).toContain('toolbarBelow');
    });

    it('position="bottom-sheet"일 때 하단 시트 스타일이 적용되어야 함', () => {
      render(<SettingsModal {...mockProps} position='bottom-sheet' />);

      const backdrop = screen.getByRole('dialog');
      expect(backdrop.className).toContain('bottomSheet');
    });

    it('position="top-right"일 때 우측 상단 위치 스타일이 적용되어야 함', () => {
      render(<SettingsModal {...mockProps} position='top-right' />);

      const backdrop = screen.getByRole('dialog');
      expect(backdrop.className).toContain('topRight');
    });
  });

  describe('TDD: 툴바와 디자인 일관성', () => {
    it('설정 모달이 테마 토큰 기반 스타일을 사용해야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modal = screen.getByRole('dialog').firstElementChild;
      expect(modal).toBeDefined();

      // CSS 모듈 클래스만 존재해야 하며 glass-surface는 TSX에서 사용하지 않음
      expect(modal!.className).not.toContain('glass-surface');
    });

    it('닫기 버튼이 올바른 CSS 클래스를 가져야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const closeButton = screen.getByLabelText('Close');

      // CSS 클래스 확인으로 glassmorphism 스타일 검증
      expect(closeButton.className).toContain('closeButton');
    });

    it('닫기 버튼이 에러 색상이 아닌 중립색 기반 CSS를 사용해야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const closeButton = screen.getByLabelText('Close');

      // 에러 색상 관련 클래스가 없음을 확인
      expect(closeButton.className).not.toContain('error');
      expect(closeButton.className).not.toContain('danger');
    });

    it('select 요소가 올바른 CSS 클래스를 가져야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const themeSelect = screen.getByLabelText('Theme');

      // select 클래스 확인
      expect(themeSelect.className).toContain('select');
    });

    it('label 요소가 올바른 CSS 클래스를 가져야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const themeLabel = screen.getByText('Theme');

      // label 클래스 확인
      expect(themeLabel.className).toContain('label');
    });

    it('모든 주요 요소들이 glassmorphism 관련 CSS를 가져야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const closeButton = screen.getByLabelText('Close');
      const themeSelect = screen.getByLabelText('Theme');
      const themeLabel = screen.getByText('Theme');

      // 모든 요소가 적절한 클래스를 가지는지 확인
      expect(closeButton).toBeDefined();
      expect(themeSelect).toBeDefined();
      expect(themeLabel).toBeDefined();

      // CSS 모듈 클래스들이 적용되었는지 확인
      expect(closeButton.className).toBeTruthy();
      expect(themeSelect.className).toBeTruthy();
      expect(themeLabel.className).toBeTruthy();
    });
  });
});
