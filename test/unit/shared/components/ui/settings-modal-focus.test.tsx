/** @jsxImportSource solid-js */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { RefactoredSettingsModal } from '@shared/components/ui/SettingsModal/RefactoredSettingsModal';

describe('SettingsModal Focus Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders close button with proper aria-label', async () => {
    render(() => <RefactoredSettingsModal isOpen onClose={vi.fn()} mode='panel' />);

    const closeButton = await screen.findByRole('button', { name: /close/i });
    expect(closeButton).toBeVisible();
  });

  it('renders modal structure with proper roles', async () => {
    render(() => (
      <RefactoredSettingsModal
        isOpen
        onClose={vi.fn()}
        mode='modal'
        data-testid='focus-test-modal'
      />
    ));

    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('data-testid', 'focus-test-modal');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('does not render when closed', () => {
    render(() => <RefactoredSettingsModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('invokes onClose callback when close button is clicked (panel mode)', async () => {
    const handleClose = vi.fn();
    render(() => <RefactoredSettingsModal isOpen mode='panel' onClose={handleClose} />);

    const closeButton = await screen.findByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose callback when close button is clicked (modal mode)', async () => {
    const handleClose = vi.fn();
    render(() => <RefactoredSettingsModal isOpen mode='modal' onClose={handleClose} />);

    const closeButton = await screen.findByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('defaults to panel mode when mode is not specified', async () => {
    render(() => <RefactoredSettingsModal isOpen onClose={vi.fn()} />);

    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('data-position', 'center');
  });

  it('supports all legacy position values', async () => {
    const positions = ['toolbar-below', 'top-right', 'center', 'bottom-sheet'] as const;

    for (const position of positions) {
      const { unmount } = render(() => (
        <RefactoredSettingsModal
          isOpen
          mode='panel'
          position={position}
          data-testid={`focus-${position}`}
          onClose={vi.fn()}
        />
      ));

      const dialog = await screen.findByTestId(`focus-${position}`);
      expect(dialog).toHaveAttribute('data-position', position);
      unmount();
    }
  });

  it('forwards className and data attributes', async () => {
    render(() => (
      <RefactoredSettingsModal
        isOpen
        mode='panel'
        className='custom-class'
        data-testid='focus-custom'
        onClose={vi.fn()}
      />
    ));

    const dialog = await screen.findByTestId('focus-custom');
    expect(dialog.className).toContain('custom-class');
  });

  it('renders custom children', async () => {
    render(() => (
      <RefactoredSettingsModal isOpen mode='modal' onClose={vi.fn()}>
        <p data-testid='custom-content'>Custom Settings</p>
      </RefactoredSettingsModal>
    ));

    const custom = await screen.findByTestId('custom-content');
    expect(custom).toHaveTextContent('Custom Settings');
  });
});
