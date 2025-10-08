/**
 * @fileoverview Settings Modal Toggle Test (Behavioral)
 * @description 설정 모달 토글 동작 검증 - 버튼 연속 클릭 시 열림/닫힘 교대 확인
 * @phase Phase 9.15: SETTINGS-MODAL-TOGGLE-BUG
 * @priority Critical
 *
 * Test Scenario:
 * 1. ToolbarWithSettings 렌더링
 * 2. 설정 버튼 5회 연속 클릭
 * 3. 각 클릭마다 모달 상태가 교대로 변경되는지 확인
 *    - 1회 클릭: 열림
 *    - 2회 클릭: 닫힘
 *    - 3회 클릭: 열림
 *    - 4회 클릭: 닫힘
 *    - 5회 클릭: 열림
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';

describe('[Phase 9.15] Settings Modal Toggle Behavior', () => {
  it('should toggle settings modal open/close on consecutive button clicks', async () => {
    // Arrange: Render ToolbarWithSettings
    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={5}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
        settingsTestId='test-settings-modal'
      />
    ));

    // 설정 버튼 찾기
    const settingsButton = screen.getByRole('button', { name: /설정/i });

    // Act & Assert: 5회 연속 클릭하여 토글 동작 검증

    // 초기 상태: 모달 DOM에 있지만 닫힌 상태 (CSS로 숨김)
    const modal = screen.getByTestId('test-settings-modal');
    expect(modal).toBeInTheDocument();

    // Helper 함수: 항상 최신 backdrop 요소를 조회
    const getBackdrop = () => screen.getByTestId('test-settings-modal-backdrop');

    // 초기 상태: modal-open 클래스가 없음
    expect(getBackdrop().className).not.toContain('modal-open');

    // 1회 클릭: 열림
    fireEvent.click(settingsButton);
    await waitFor(() => {
      expect(getBackdrop().className).toContain('modal-open');
    });

    // 2회 클릭: 닫힘
    fireEvent.click(settingsButton);
    await waitFor(() => {
      expect(getBackdrop().className).not.toContain('modal-open');
    });

    // 3회 클릭: 열림
    fireEvent.click(settingsButton);
    await waitFor(() => {
      expect(getBackdrop().className).toContain('modal-open');
    });

    // 4회 클릭: 닫힘
    fireEvent.click(settingsButton);
    await waitFor(() => {
      expect(getBackdrop().className).not.toContain('modal-open');
    });

    // 5회 클릭: 열림
    fireEvent.click(settingsButton);
    await waitFor(() => {
      expect(getBackdrop().className).toContain('modal-open');
    });
  });

  it('should maintain toggle state consistency across multiple interactions', async () => {
    // Arrange
    render(() => (
      <ToolbarWithSettings
        currentIndex={0}
        totalCount={3}
        onPrevious={() => {}}
        onNext={() => {}}
        onDownloadCurrent={() => {}}
        onDownloadAll={() => {}}
        onClose={() => {}}
        settingsTestId='consistency-test-modal'
      />
    ));

    const settingsButton = screen.getByRole('button', { name: /설정/i });
    const getBackdrop = () => screen.getByTestId('consistency-test-modal-backdrop');

    // Act: 짝수 번 클릭 (2회) → 최종 상태는 닫힘
    fireEvent.click(settingsButton); // 1회 - 열림
    fireEvent.click(settingsButton); // 2회 - 닫힘

    // Assert: 닫힌 상태 확인 (modal-open 클래스 없음)
    await waitFor(() => {
      expect(getBackdrop().className).not.toContain('modal-open');
    });

    // Act: 홀수 번 추가 클릭 (1회 더) → 최종 상태는 열림
    fireEvent.click(settingsButton); // 3회 - 열림

    // Assert: 열린 상태 확인 (modal-open 클래스 있음)
    await waitFor(() => {
      expect(getBackdrop().className).toContain('modal-open');
    });
  });
});
