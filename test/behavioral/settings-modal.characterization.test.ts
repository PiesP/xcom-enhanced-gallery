/**
 * @fileoverview SettingsModal Characterization Tests (TDD Phase T0)
 * @description 현재 SettingsModal 동작을 특성화하여 리팩토링 시 회귀 방지
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/testing-library';
import h from 'solid-js/h';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal - 현행 기능 특성화 (Characterization)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    position: 'toolbar-below',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('isOpen=false일 때 렌더링되지 않는다', () => {
      const closedProps = { ...defaultProps, isOpen: false };
      render(h(SettingsModal, closedProps));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=true일 때 dialog role로 렌더링된다', () => {
      render(h(SettingsModal, defaultProps));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('설정 제목이 표시된다', () => {
      render(h(SettingsModal, defaultProps));

      const title = screen.getByRole('heading');
      expect(title).toBeInTheDocument();
    });

    it('닫기 버튼이 존재한다', () => {
      render(h(SettingsModal, defaultProps));

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('설정 옵션', () => {
    it('테마 선택과 언어 선택 요소가 존재한다', () => {
      render(h(SettingsModal, defaultProps));

      // 최소 2개의 select 요소 (테마, 언어)
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('상호작용', () => {
    it('닫기 버튼 클릭 시 onClose가 호출된다', () => {
      render(h(SettingsModal, defaultProps));

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('ESC 키 누를 때 모달이 닫힌다', () => {
      render(h(SettingsModal, defaultProps));

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('모달 배경 클릭 시 닫힌다', () => {
      render(h(SettingsModal, defaultProps));

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('위치 설정', () => {
    it('position prop에 따라 올바른 data-position 속성이 설정된다', () => {
      const props = { ...defaultProps, position: 'top-right' };
      render(h(SettingsModal, props));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-position', 'top-right');
    });

    it('기본 position은 center로 설정된다', () => {
      const propsWithoutPosition = { isOpen: true, onClose: vi.fn() };
      render(h(SettingsModal, propsWithoutPosition));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-position', 'center');
    });
  });

  describe('접근성', () => {
    it('모달이 올바른 ARIA 속성을 가진다', () => {
      render(h(SettingsModal, defaultProps));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
