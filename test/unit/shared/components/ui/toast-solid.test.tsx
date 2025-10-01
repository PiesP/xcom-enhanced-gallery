/**
 * @fileoverview RED test for Solid Toast component
 * @description Drives FRAME-ALT-001 Stage D Phase 2 Solid port of shared Toast UI
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@solidjs/testing-library';

vi.mock('@shared/components/ui/Toast/Toast.module.css', () => ({
  default: new Proxy(
    {},
    {
      get: (_target, key: string) => key,
    }
  ),
}));

describe('SolidToast (RED)', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders toast content with title, message, and action', async () => {
    const { SolidToast } = await import('@shared/components/ui/Toast/SolidToast.solid');

    const handleClose = vi.fn();
    const handleAction = vi.fn();

    render(() =>
      SolidToast({
        toast: {
          id: 'toast-1',
          type: 'info',
          title: '알림',
          message: 'Solid 토스트 컴포넌트 전환',
          actionText: '확인',
          duration: 0,
          onAction: handleAction,
        },
        onClose: handleClose,
      })
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('알림')).toBeInTheDocument();
    expect(screen.getByText('Solid 토스트 컴포넌트 전환')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }));
    expect(handleClose).toHaveBeenCalledWith('toast-1');

    fireEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledWith('toast-1');
  });

  it('automatically closes after duration via timer', async () => {
    vi.useFakeTimers();
    const { SolidToast } = await import('@shared/components/ui/Toast/SolidToast.solid');

    const handleClose = vi.fn();

    render(() =>
      SolidToast({
        toast: {
          id: 'toast-2',
          type: 'success',
          title: '완료',
          message: '자동 닫힘 확인',
          duration: 2000,
        },
        onClose: handleClose,
      })
    );

    expect(handleClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2100);
    await waitFor(() => expect(handleClose).toHaveBeenCalledWith('toast-2'));
  });
});
