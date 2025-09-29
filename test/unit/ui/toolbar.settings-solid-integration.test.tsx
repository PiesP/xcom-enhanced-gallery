/** @jsxImportSource solid-js */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@solidjs/testing-library';
import { ToolbarWithSettings } from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';

vi.mock('@shared/components/ui/Toolbar/Toolbar', () => {
  return {
    Toolbar: ({ onOpenSettings }: { onOpenSettings?: () => void }) => (
      <button type='button' aria-label='설정 열기' onClick={() => onOpenSettings?.()}>
        설정 열기
      </button>
    ),
  };
});

vi.mock('@shared/components/ui/SettingsModal/SettingsModal', () => {
  return {
    SettingsModal: ({
      'data-testid': testId,
      isOpen,
      onClose,
    }: {
      'data-testid'?: string;
      isOpen: boolean;
      onClose: () => void;
    }) => (
      <div
        role='dialog'
        data-testid={testId}
        data-open={isOpen ? 'true' : 'false'}
        onClick={onClose}
      >
        설정 모달
      </div>
    ),
  };
});

describe('ToolbarWithSettings — Solid settings integration', () => {
  afterEach(() => {
    cleanup();
  });

  const minimalToolbarProps: Parameters<typeof ToolbarWithSettings>[0] = {
    currentIndex: 0,
    totalCount: 3,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onClose: vi.fn(),
    settingsTestId: 'test-settings-modal',
    settingsPosition: 'top-right',
  };

  it('mounts the Solid settings panel when the feature flag is enabled', async () => {
    const openMock = vi.fn();
    const closeMock = vi.fn();
    const disposeMock = vi.fn();
    const factoryMock = vi.fn(() => ({
      open: openMock,
      close: closeMock,
      dispose: disposeMock,
    }));

    const { getByRole, unmount } = render(() => (
      <ToolbarWithSettings {...minimalToolbarProps} settingsRendererFactory={factoryMock} />
    ));

    await waitFor(() => {
      expect(document.querySelector('[data-xeg-toolbar-settings-host]')).not.toBeNull();
      expect(factoryMock).toHaveBeenCalledTimes(1);
    });

    const host = document.querySelector('[data-xeg-toolbar-settings-host]');
    expect(host).not.toBeNull();

    const settingsButton = getByRole('button', { name: '설정 열기' });
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(openMock).toHaveBeenCalled();
    });

    const callArgs = factoryMock.mock.calls[0][0];
    expect(callArgs.container).toBe(host);
    expect(callArgs.position).toBe('top-right');
    expect(callArgs.testId).toBe('test-settings-modal');
    expect(typeof callArgs.onClose).toBe('function');

    callArgs.onClose();

    await waitFor(() => {
      expect(closeMock).toHaveBeenCalled();
    });

    unmount();

    await waitFor(() => {
      expect(disposeMock).toHaveBeenCalled();
    });
  });

  it('falls back to the preact settings modal when the feature flag is disabled', async () => {
    const { getByRole, queryByTestId } = render(() => (
      <ToolbarWithSettings {...minimalToolbarProps} />
    ));

    const settingsButton = getByRole('button', { name: '설정 열기' });
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(queryByTestId('test-settings-modal')).not.toBeNull();
    });

    expect(document.querySelector('[data-xeg-toolbar-settings-host]')).toBeNull();
  });
});
