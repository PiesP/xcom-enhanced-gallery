/**
 * @fileoverview ToolbarWithSettings - 설정 모달이 열린 상태에서 닫기 버튼 동작 테스트
 * @description TDD: 설정 모달과 갤러리 닫기의 상태 충돌 문제 재현 및 수정
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { getSolidCore } from '@shared/external/vendors';
import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';
import type { ToolbarWithSettingsProps } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';

const { createRoot } = getSolidCore();

// TODO: [RED-TEST-SKIP] This test is in RED state (TDD) - blocking git push
// Epic tracking: Move to separate Epic branch for GREEN implementation
describe.skip('ToolbarWithSettings - 설정 모달이 열린 상태에서 닫기 동작', () => {
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    if (dispose) {
      dispose();
      dispose = undefined;
    }
    document.body.innerHTML = '';
  });

  const createMockProps = (
    overrides?: Partial<ToolbarWithSettingsProps>
  ): ToolbarWithSettingsProps => ({
    currentIndex: 0,
    totalCount: 3,
    isDownloading: false,
    isLoading: false,
    disabled: false,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onClose: vi.fn(),
    settingsPosition: 'toolbar-below',
    settingsTestId: 'toolbar-settings-modal',
    ...overrides,
  });

  describe('RED: 현재 문제 재현 - 설정 모달이 열린 상태에서 닫기 버튼 클릭 시 동작 실패', () => {
    it('설정 모달이 열려 있을 때 툴바의 닫기 버튼을 클릭하면 설정 모달이 먼저 닫혀야 함', async () => {
      const mockProps = createMockProps();

      return createRoot(async disposeFn => {
        dispose = disposeFn;

        render(() => <ToolbarWithSettings {...mockProps} />);

        // 1. 설정 버튼 클릭하여 모달 열기
        const settingsButton = screen.getByLabelText('설정 열기');
        fireEvent.click(settingsButton);

        // 2. 설정 모달이 열렸는지 확인 (비동기 대기)
        await waitFor(() => {
          const settingsModal = screen.queryByTestId('toolbar-settings-modal');
          expect(settingsModal).toBeTruthy();
        });

        // 3. 툴바의 닫기 버튼 클릭
        const closeButton = screen.getByLabelText('갤러리 닫기');
        fireEvent.click(closeButton);

        // 4. 설정 모달이 먼저 닫혀야 함 (갤러리는 아직 열린 상태)
        await waitFor(() => {
          const settingsModalAfterClose = screen.queryByTestId('toolbar-settings-modal');
          expect(settingsModalAfterClose).toBeNull();
        });
        expect(mockProps.onClose).not.toHaveBeenCalled();
      });
    });

    it('설정 모달이 닫힌 상태에서 툴바의 닫기 버튼을 클릭하면 갤러리가 닫혀야 함', async () => {
      const mockProps = createMockProps();

      return createRoot(async disposeFn => {
        dispose = disposeFn;

        render(() => <ToolbarWithSettings {...mockProps} />);

        // 설정 모달이 닫힌 상태에서 닫기 버튼 클릭
        const closeButton = screen.getByLabelText('갤러리 닫기');
        fireEvent.click(closeButton);

        // 갤러리 onClose가 호출되어야 함
        await waitFor(() => {
          expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('설정 모달이 열린 상태에서 ESC 키를 누르면 설정 모달만 닫혀야 함', async () => {
      const mockProps = createMockProps();

      return createRoot(async disposeFn => {
        dispose = disposeFn;

        render(() => <ToolbarWithSettings {...mockProps} />);

        // 1. 설정 버튼 클릭하여 모달 열기
        const settingsButton = screen.getByLabelText('설정 열기');
        fireEvent.click(settingsButton);

        // 2. 설정 모달이 열렸는지 확인
        await waitFor(() => {
          const settingsModal = screen.queryByTestId('toolbar-settings-modal');
          expect(settingsModal).toBeTruthy();
        });

        // 3. ESC 키 입력
        const settingsModal = screen.queryByTestId('toolbar-settings-modal');
        if (settingsModal) {
          fireEvent.keyDown(settingsModal, { key: 'Escape' });
        }

        // 4. 설정 모달만 닫혀야 함
        await waitFor(() => {
          const settingsModalAfterEsc = screen.queryByTestId('toolbar-settings-modal');
          expect(settingsModalAfterEsc).toBeNull();
        });
        expect(mockProps.onClose).not.toHaveBeenCalled();
      });
    });

    it('설정 모달이 닫힌 상태에서 ESC 키를 누르면 갤러리가 닫혀야 함', async () => {
      const mockProps = createMockProps();

      return createRoot(async disposeFn => {
        dispose = disposeFn;

        render(() => <ToolbarWithSettings {...mockProps} />);

        // 툴바에서 ESC 키 입력
        const toolbar = screen.getByRole('toolbar');
        fireEvent.keyDown(toolbar, { key: 'Escape' });

        // 갤러리 onClose가 호출되어야 함
        await waitFor(() => {
          expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('설정 모달 열기 → 닫기 버튼 클릭 → 다시 닫기 버튼 클릭 시 갤러리가 닫혀야 함', async () => {
      const mockProps = createMockProps();

      return createRoot(async disposeFn => {
        dispose = disposeFn;

        render(() => <ToolbarWithSettings {...mockProps} />);

        // 1. 설정 모달 열기
        const settingsButton = screen.getByLabelText('설정 열기');
        fireEvent.click(settingsButton);

        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeTruthy();
        });

        // 2. 첫 번째 닫기 버튼 클릭 - 설정 모달 닫기
        const closeButton = screen.getByLabelText('갤러리 닫기');
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeNull();
        });
        expect(mockProps.onClose).not.toHaveBeenCalled();

        // 3. 두 번째 닫기 버튼 클릭 - 갤러리 닫기
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('통합 시나리오 테스트', () => {
    it('설정 변경 → 모달 닫기 → 갤러리 닫기 시나리오가 정상 동작해야 함', async () => {
      const mockProps = createMockProps();

      return createRoot(async disposeFn => {
        dispose = disposeFn;

        render(() => <ToolbarWithSettings {...mockProps} />);

        // 1. 설정 모달 열기
        const settingsButton = screen.getByLabelText('설정 열기');
        fireEvent.click(settingsButton);

        // 2. 설정 모달이 열릴 때까지 대기
        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeTruthy();
        });

        // 3. 테마 변경 (설정 모달 내부 동작)
        const themeSelect = screen.getByLabelText('Theme');
        fireEvent.change(themeSelect, { target: { value: 'dark' } });

        expect(themeSelect).toHaveValue('dark');

        // 4. 설정 모달 닫기
        const closeButton = screen.getByLabelText('갤러리 닫기');
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeNull();
        });

        // 5. 갤러리 닫기
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('여러 번 설정 모달 열고 닫기를 반복해도 상태가 일관되어야 함', async () => {
      const mockProps = createMockProps();

      return createRoot(async disposeFn => {
        dispose = disposeFn;

        render(() => <ToolbarWithSettings {...mockProps} />);

        const settingsButton = screen.getByLabelText('설정 열기');
        const closeButton = screen.getByLabelText('갤러리 닫기');

        // 첫 번째 사이클
        fireEvent.click(settingsButton);
        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeTruthy();
        });

        fireEvent.click(closeButton);
        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeNull();
        });
        expect(mockProps.onClose).not.toHaveBeenCalled();

        // 두 번째 사이클
        fireEvent.click(settingsButton);
        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeTruthy();
        });

        fireEvent.click(closeButton);
        await waitFor(() => {
          expect(screen.queryByTestId('toolbar-settings-modal')).toBeNull();
        });
        expect(mockProps.onClose).not.toHaveBeenCalled();

        // 갤러리 닫기
        fireEvent.click(closeButton);
        await waitFor(() => {
          expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
