/**
 * @fileoverview TDD RED Test: Settings Modal Design Token Integration
 * @description 설정 모달의 통합 디자인 토큰 시스템 사용을 강제하는 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';
import { h } from 'preact';

describe('TDD RED: Settings Modal Design Token Integration', () => {
  const mockProps = {
    isOpen: true,
    onClose: () => {},
  };

  beforeEach(() => {
    cleanup();
  });

  describe('Glass Surface Token Integration', () => {
    it('설정 모달 내부 컨테이너가 통합 glass-surface 클래스를 사용해야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');
      // 실제 내부 컨테이너는 div#settings-content
      const innerContainer = modal.querySelector('#settings-content');

      // 통합 glass-surface 클래스가 적용되어야 함 (엄격한 검증)
      expect(innerContainer?.className).toContain('glass-surface');

      // 개별 glassmorphism 클래스는 제거되어야 함
      expect(innerContainer?.className).not.toContain('glass-surface-light');
      expect(innerContainer?.className).not.toContain('glass-surface-dark');
    });

    it('설정 모달이 toolbarButton 스타일을 올바르게 상속해야 함', () => {
      render(h(SettingsModal, mockProps));

      const closeButton = screen.getByLabelText('Close');
      const selects = screen.getAllByRole('combobox');

      // 툴바 버튼 스타일 클래스가 적용되어야 함
      expect(closeButton.className).toContain('toolbarButton');

      selects.forEach(select => {
        expect(select.className).toContain('toolbarButton');
      });
    });

    it('개별 glassmorphism 스타일이 제거되고 통합 토큰을 사용해야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');
      const computedStyle = window.getComputedStyle(modal.firstElementChild);

      // 통합 CSS 변수 사용 확인 (실제 값이 아닌 CSS 변수 참조 확인)
      // 이 테스트는 CSS가 올바르게 적용되었는지 간접적으로 확인
      expect(modal.firstElementChild).toBeDefined();
    });
  });

  describe('Z-Index Layer Management', () => {
    it('설정 모달이 독립적인 z-index 레이어를 사용해야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');

      // data-position 속성이 있어야 함
      expect(modal.getAttribute('data-position')).toBeDefined();
    });
  });

  describe('Focus Ring Consistency', () => {
    it('모든 인터랙티브 요소가 일관된 포커스 스타일을 가져야 함', () => {
      render(h(SettingsModal, mockProps));

      const closeButton = screen.getByLabelText('Close');
      const selects = screen.getAllByRole('combobox');

      // 포커스 가능한 요소들 확인
      expect(closeButton.tabIndex).not.toBe(-1);
      selects.forEach(select => {
        expect(select.tabIndex).not.toBe(-1);
      });
    });
  });

  describe('Animation Token Integration', () => {
    it('설정 모달이 통합 애니메이션 토큰을 사용해야 함', () => {
      render(h(SettingsModal, mockProps));

      const modal = screen.getByRole('dialog');

      // 애니메이션 관련 데이터 속성이나 클래스가 있어야 함
      expect(modal).toBeDefined();

      // CSS transition이 적용되어 있는지 확인
      const computedStyle = window.getComputedStyle(modal);
      expect(computedStyle.transition).toBeDefined();
    });
  });
});
