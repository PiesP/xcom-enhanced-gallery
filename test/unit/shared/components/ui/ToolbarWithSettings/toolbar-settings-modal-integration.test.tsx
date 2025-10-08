/**
 * @fileoverview ToolbarWithSettings 통합 테스트 - 설정 모달 표시 확인
 * @description Phase 9.3: Show 중첩 제거 후 설정 모달이 정상 표시되는지 검증
 */

/// <reference lib="dom" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@solidjs/testing-library';
import { ToolbarWithSettings } from '@/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';

describe('[Phase 9.3] ToolbarWithSettings - 설정 모달 통합 테스트', () => {
  const mockProps = {
    currentIndex: 0,
    totalCount: 10,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('RED: 설정 버튼 클릭 시 모달 표시 (실패 예상)', () => {
    it('설정 버튼이 렌더링되어야 함', () => {
      render(() => <ToolbarWithSettings {...mockProps} />);

      const settingsButton = screen.getByLabelText('설정 열기');
      expect(settingsButton).toBeDefined();
      expect(settingsButton.tagName).toBe('BUTTON');
    });

    it('설정 버튼 클릭 시 설정 모달이 표시되어야 함', async () => {
      render(() => <ToolbarWithSettings {...mockProps} />);

      // 초기 상태: 모달이 표시되지 않음
      expect(screen.queryByRole('dialog')).toBeNull();

      // 설정 버튼 클릭
      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      // 모달이 표시되어야 함 (현재는 실패 예상)
      const modal = await screen.findByRole('dialog', {}, { timeout: 1000 });
      expect(modal).toBeDefined();
      expect(modal).toBeInTheDocument();
    });

    it('모달의 닫기 버튼이 렌더링되어야 함', async () => {
      render(() => <ToolbarWithSettings {...mockProps} />);

      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      const modal = await screen.findByRole('dialog', {}, { timeout: 1000 });
      expect(modal).toBeDefined();

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeDefined();
      expect(closeButton.tagName).toBe('BUTTON');
    });

    it('닫기 버튼 클릭 시 모달이 사라져야 함', async () => {
      render(() => <ToolbarWithSettings {...mockProps} />);

      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      const modal = await screen.findByRole('dialog', {}, { timeout: 1000 });
      expect(modal).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // 모달이 사라져야 함
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('ESC 키 입력 시 모달이 닫혀야 함', async () => {
      render(() => <ToolbarWithSettings {...mockProps} />);

      const settingsButton = screen.getByLabelText('설정 열기');
      fireEvent.click(settingsButton);

      const modal = await screen.findByRole('dialog', {}, { timeout: 1000 });
      expect(modal).toBeInTheDocument();

      fireEvent.keyDown(modal, { key: 'Escape' });

      // 모달이 사라져야 함
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
