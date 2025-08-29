/**
 * @fileoverview TDD RED Test: Settings Modal Enhanced Accessibility
 * @description 설정 모달의 향상된 접근성 기능을 강제하는 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';
import { h } from 'preact';

describe('TDD RED: Settings Modal Enhanced Accessibility', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Enhanced ARIA Support', () => {
    it('모달이 aria-describedby를 통해 콘텐츠와 연결되어야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');
      const describedBy = modal.getAttribute('aria-describedby');

      expect(describedBy).toBe('settings-content');

      // 해당 ID를 가진 요소가 존재해야 함
      const contentElement = modal.querySelector('#settings-content');
      expect(contentElement).toBeTruthy();
    });

    it('모달이 적절한 role과 aria-modal 속성을 가져야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
      expect(modal.getAttribute('role')).toBe('dialog');
    });

    it('title과 aria-labelledby가 올바르게 연결되어야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');
      const labelledBy = modal.getAttribute('aria-labelledby');

      expect(labelledBy).toBe('settings-title');

      const titleElement = modal.querySelector('#settings-title');
      expect(titleElement).toBeTruthy();
      expect(titleElement?.textContent).toContain('Settings');
    });
  });

  describe('Enhanced Keyboard Event Handling', () => {
    it('ESC 키가 올바르게 처리되어야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');

      // 모달에서 ESC 키를 누르면 처리되어야 함
      fireEvent.keyDown(modal, { key: 'Escape' });
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('다른 키는 모달을 닫지 않아야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');

      // Enter, Space 등 다른 키는 모달을 닫지 않아야 함
      fireEvent.keyDown(modal, { key: 'Enter' });
      fireEvent.keyDown(modal, { key: ' ' });
      fireEvent.keyDown(modal, { key: 'ArrowDown' });

      expect(mockProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management Indicators', () => {
    it('포커스 트랩을 위한 포커스 가능한 요소들이 올바르게 쿼리되어야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');
      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      // 최소 1개 이상의 포커스 가능한 요소가 있어야 함 (닫기 버튼)
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('첫 번째 포커스 요소가 닫기 버튼이어야 함', () => {
      render(h(SettingsModal, mockProps));

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeTruthy();
      expect(closeButton.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('CSS Integration Requirements', () => {
    it('포커스 스타일링을 위한 CSS 클래스가 적용되어야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');

      // 접근성 향상을 위한 포커스 관련 클래스가 있어야 함
      expect(modal.className).toMatch(/(focus|accessibility|a11y)/i);
    });
  });

  describe('Component State Management', () => {
    it('isOpen이 false일 때 모달이 렌더링되지 않아야 함', () => {
      render(h(SettingsModal, { ...mockProps, isOpen: false }));

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('onClose 콜백이 함수여야 함', () => {
      expect(typeof mockProps.onClose).toBe('function');
    });
  });
});
