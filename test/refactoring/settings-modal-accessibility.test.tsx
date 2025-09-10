/**
 * @fileoverview SettingsModal 접근성 개선 TDD 테스트
 * @description 포커스 트랩, 스크롤 잠금, 포커스 복원 등 접근성 기능 테스트
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal Accessibility Improvements (TDD)', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // body 스타일 초기화
    document.body.style.overflow = '';
    // 이전 포커스 요소 시뮬레이션을 위한 더미 버튼
    const triggerButton = document.createElement('button');
    triggerButton.id = 'trigger-button';
    triggerButton.textContent = 'Open Settings';
    document.body.appendChild(triggerButton);
    triggerButton.focus();
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
    // 더미 버튼 제거
    const triggerButton = document.getElementById('trigger-button');
    if (triggerButton) {
      document.body.removeChild(triggerButton);
    }
  });

  describe('RED: 포커스 관리', () => {
    it('모달이 열릴 때 첫 번째 포커스 가능한 요소로 포커스가 이동해야 함', async () => {
      render(<SettingsModal {...mockProps} />);

      // 비동기 포커스 이동을 기다림
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close');
        expect(document.activeElement).toBe(closeButton);
      });
    });

    it('모달이 닫힐 때 이전 포커스 요소로 포커스가 복원되어야 함', () => {
      const { rerender } = render(<SettingsModal {...mockProps} />);

      // 모달 닫기
      rerender(<SettingsModal {...mockProps} isOpen={false} />);

      // 원래 트리거 버튼으로 포커스가 돌아가야 함
      const triggerButton = document.getElementById('trigger-button');
      expect(document.activeElement).toBe(triggerButton);
    });

    it('Tab 키로 마지막 요소에서 첫 번째 요소로 순환해야 함', () => {
      render(<SettingsModal {...mockProps} />);

      // 모든 포커스 가능한 요소들 찾기
      const modal = screen.getByRole('dialog');
      const focusableElements = modal.querySelectorAll(
        'button, [href], select, [tabindex]:not([tabindex="-1"])'
      );

      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      const firstElement = focusableElements[0] as HTMLElement;

      // 마지막 요소로 포커스 이동
      lastElement.focus();
      expect(document.activeElement).toBe(lastElement);

      // Tab 키 누르면 첫 번째 요소로 이동해야 함
      fireEvent.keyDown(modal, { key: 'Tab' });
      expect(document.activeElement).toBe(firstElement);
    });

    it('Shift+Tab 키로 첫 번째 요소에서 마지막 요소로 순환해야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modal = screen.getByRole('dialog');
      const focusableElements = modal.querySelectorAll(
        'button, [href], select, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // 첫 번째 요소로 포커스 이동
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);

      // Shift+Tab 키 누르면 마지막 요소로 이동해야 함
      fireEvent.keyDown(modal, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastElement);
    });
  });

  describe('RED: 스크롤 잠금', () => {
    it('모달이 열릴 때 body 스크롤이 비활성화되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('모달이 닫힐 때 원래 스크롤 상태가 복원되어야 함', () => {
      // 원래 overflow 값 설정
      document.body.style.overflow = 'auto';

      const { rerender } = render(<SettingsModal {...mockProps} />);

      // 모달이 열렸을 때 hidden으로 변경됨을 확인
      expect(document.body.style.overflow).toBe('hidden');

      // 모달 닫기
      rerender(<SettingsModal {...mockProps} isOpen={false} />);

      // 원래 값으로 복원되어야 함
      expect(document.body.style.overflow).toBe('auto');
    });
  });

  describe('RED: ARIA 속성 개선', () => {
    it('모달 콘텐츠가 aria-describedby로 연결되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modal = screen.getByRole('dialog');
      const describedBy = modal.getAttribute('aria-describedby');

      expect(describedBy).toBe('settings-content');

      // 해당 ID를 가진 요소가 존재해야 함
      const contentElement = document.getElementById('settings-content');
      expect(contentElement).toBeTruthy();
    });
  });

  describe('RED: 키보드 이벤트 개선', () => {
    it('키보드 이벤트가 모달 내부에서만 처리되어야 함', () => {
      render(<SettingsModal {...mockProps} />);

      const modal = screen.getByRole('dialog');

      // 모달 외부에서 ESC 키를 눌러도 처리되지 않아야 함
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(mockProps.onClose).not.toHaveBeenCalled();

      // 모달 내부에서 ESC 키를 누르면 처리되어야 함
      fireEvent.keyDown(modal, { key: 'Escape' });
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('RED: 배경 요소 비활성화', () => {
    it('모달이 열려있을 때 배경 요소들이 inert 속성을 가져야 함', () => {
      // 배경에 더미 요소들 추가
      const backgroundElement1 = document.createElement('button');
      backgroundElement1.id = 'background-element-1';
      backgroundElement1.textContent = 'Background Button 1';
      document.body.appendChild(backgroundElement1);

      const backgroundElement2 = document.createElement('a');
      backgroundElement2.id = 'background-element-2';
      backgroundElement2.href = '#';
      backgroundElement2.textContent = 'Background Link';
      document.body.appendChild(backgroundElement2);

      render(<SettingsModal {...mockProps} />);

      // 배경 요소들이 비활성화되어야 함 (여기서는 tabindex="-1" 또는 inert 속성)
      expect(backgroundElement1.getAttribute('tabindex')).toBe('-1');
      expect(backgroundElement2.getAttribute('tabindex')).toBe('-1');

      // 정리
      document.body.removeChild(backgroundElement1);
      document.body.removeChild(backgroundElement2);
    });
  });

  describe('RED: 포커스 트랩 경계 테스트', () => {
    it('비활성화된 요소는 포커스 트랩에서 제외되어야 함', () => {
      // disabled 버튼이 있는 커스텀 모달 테스트
      const CustomModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
        if (!isOpen) return null;

        return (
          <div role='dialog' aria-modal='true'>
            <button>Active Button 1</button>
            <button disabled>Disabled Button</button>
            <button>Active Button 2</button>
            <button onClick={onClose}>Close</button>
          </div>
        );
      };

      render(<CustomModal isOpen={true} onClose={mockProps.onClose} />);

      const modal = screen.getByRole('dialog');
      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], select, [tabindex]:not([tabindex="-1"])'
        )
      );

      // disabled 버튼은 포함되지 않아야 함
      expect(focusableElements).toHaveLength(3); // Active Button 1, Active Button 2, Close
      expect(focusableElements.some(el => el.textContent === 'Disabled Button')).toBe(false);
    });
  });

  describe('RED: 성능 최적화', () => {
    it('모달이 닫혀있을 때 이벤트 리스너가 등록되지 않아야 함', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      render(<SettingsModal {...mockProps} isOpen={false} />);

      // keydown 이벤트 리스너가 등록되지 않았어야 함
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('모달이 닫힐 때 이벤트 리스너가 정리되어야 함', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { rerender } = render(<SettingsModal {...mockProps} />);

      // 모달 닫기
      rerender(<SettingsModal {...mockProps} isOpen={false} />);

      // keydown 이벤트 리스너가 제거되었어야 함
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

      removeEventListenerSpy.mockRestore();
    });
  });
});
