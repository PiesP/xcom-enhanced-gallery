/**
 * @fileoverview SettingsModal 컴포넌트    it('설정 제목이 표시되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const title = screen.getByText('Settings');
      expect(title).toBeDefined();
    });* @description TDD 기반 설정 모달 컴포넌트 테스트
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

      fireEvent.keyDown(document, { key: 'Escape' });

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
});
