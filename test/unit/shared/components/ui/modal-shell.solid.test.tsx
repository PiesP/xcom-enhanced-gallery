/** @jsxImportSource solid-js */
/**
 * @fileoverview Solid ModalShell characterization tests
 * @description Ensures FRAME-ALT-001 Stage D Solid modal shell parity with legacy implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@solidjs/testing-library';
import { createSignal, onCleanup } from 'solid-js';

import ModalShell, {
  type SolidModalShellProps,
} from '@shared/components/ui/ModalShell/ModalShell.solid';

const renderModal = (props: Partial<SolidModalShellProps> = {}) => {
  const defaultProps: SolidModalShellProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: (
      <div>
        <button data-testid='first'>First focusable</button>
        <button data-testid='second'>Second focusable</button>
      </div>
    ),
  };
  return render(() => <ModalShell {...defaultProps} {...props} />);
};

describe('ModalShell.solid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('does not render when closed', () => {
    renderModal({ isOpen: false, 'data-testid': 'modal' });
    expect(screen.queryByTestId('modal')).toBeNull();
  });

  it('applies size and surface variants with custom class', async () => {
    renderModal({
      size: 'lg',
      surfaceVariant: 'solid',
      className: 'custom-class',
      'data-testid': 'modal-shell',
    });

    const shell = await screen.findByTestId('modal-shell');
    expect(shell).toHaveClass('modal-shell');
    expect(shell.className).toContain('modal-size-lg');
    expect(shell.className).toContain('modal-surface-solid');
    expect(shell.className).toContain('custom-class');
  });

  it('invokes onClose when backdrop is clicked and closing allowed', async () => {
    const handleClose = vi.fn();
    renderModal({ onClose: handleClose, 'data-testid': 'modal-shell' });

    const backdrop = await screen.findByTestId('modal-shell-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when backdrop clicks are disabled', async () => {
    const handleClose = vi.fn();
    renderModal({
      onClose: handleClose,
      closeOnBackdropClick: false,
      'data-testid': 'modal-shell',
    });

    const backdrop = await screen.findByTestId('modal-shell-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('invokes onClose when Escape is pressed and escape closing enabled', async () => {
    const handleClose = vi.fn();
    renderModal({ onClose: handleClose, 'data-testid': 'modal-shell' });

    const backdrop = await screen.findByTestId('modal-shell-backdrop');
    fireEvent.keyDown(backdrop, { key: 'Escape' });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('traps focus within modal and restores focus on close', async () => {
    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside';
    outsideButton.setAttribute('data-testid', 'outside');
    document.body.appendChild(outsideButton);
    outsideButton.focus();

    let setOpen!: (value: boolean) => void;
    let closeMock: ReturnType<typeof vi.fn>;

    render(() => {
      const [open, set] = createSignal(true);
      setOpen = set;
      closeMock = vi.fn(() => set(false));

      onCleanup(() => {
        outsideButton.remove();
      });

      return (
        <ModalShell isOpen={open()} onClose={closeMock!} data-testid='modal-shell'>
          <button data-testid='first'>First</button>
          <button data-testid='last'>Last</button>
        </ModalShell>
      );
    });

    vi.runAllTimers();

    const first = await screen.findByTestId('first');
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: 'Tab' });
    const last = await screen.findByTestId('last');
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);

    setOpen(false);
    vi.runAllTimers();
    await Promise.resolve();

    expect(closeMock!).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(outsideButton);
  });
});
