/** @jsxImportSource solid-js */
/**
 * @fileoverview Settings Modal Accessibility Tests (Solid migration)
 * @description Validates Solid SettingsModal structure and accessibility behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@solidjs/testing-library';
import {
  RefactoredSettingsModal,
  type SettingsModalProps,
} from '@shared/components/ui/SettingsModal/RefactoredSettingsModal';

type ModalOverride = Partial<SettingsModalProps> & Record<string, unknown>;

const renderModal = (override: ModalOverride = {}) => {
  const onClose = (override.onClose as SettingsModalProps['onClose']) ?? vi.fn();
  const props = Object.assign(
    {
      isOpen: true,
      onClose,
      mode: 'panel' as const,
      position: 'center' as const,
    },
    override,
    { onClose }
  ) as SettingsModalProps & Record<string, unknown>;

  return { onClose, ...render(() => <RefactoredSettingsModal {...props} />) };
};

describe('SettingsModal Accessibility (Solid)', () => {
  it('renders panel dialog with accessible attributes', async () => {
    const handleClose = vi.fn();
    renderModal({
      mode: 'panel',
      onClose: handleClose,
      'data-testid': 'accessibility-test-panel',
    });

    const dialog = await screen.findByRole('dialog', { name: 'Settings' });

    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'settings-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'settings-content');
    expect(dialog).toHaveAttribute('data-position', 'center');
    expect(dialog).toHaveAttribute('data-testid', 'accessibility-test-panel');
  });

  it('invokes onClose when close button is clicked (panel mode)', async () => {
    const handleClose = vi.fn();
    renderModal({ mode: 'panel', onClose: handleClose });

    const closeButton = await screen.findByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders default settings controls for theme and language', async () => {
    renderModal({ mode: 'panel' });

    const themeSelect = await screen.findByLabelText('Theme');
    const languageRadiogroup = await screen.findByRole('radiogroup', { name: /language/i });
    const progressToggle = await screen.findByLabelText('Show progress toast during bulk download');

    expect(themeSelect).toHaveValue('auto');
    // Language is now a RadioGroup with radio buttons
    // Note: Radio name includes icon loading state and text label
    const autoRadio = within(languageRadiogroup).getByRole('radio', { name: /Auto/i });
    expect(autoRadio.getAttribute('aria-checked')).toBe('true');
    expect(progressToggle).not.toBeChecked();
  });

  it('forwards position attribute to the panel container', async () => {
    renderModal({ position: 'top-right' });

    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('data-position', 'top-right');
  });

  it('supports additional aria describers', async () => {
    renderModal({ 'aria-describedby': 'settings-description' });

    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('aria-describedby', 'settings-description');
  });

  it('renders provided children in place of default content', async () => {
    renderModal({
      children: <p data-testid='custom-content'>Custom Settings Content</p>,
    });

    const custom = await screen.findByTestId('custom-content');
    expect(custom).toHaveTextContent('Custom Settings Content');
  });

  it('renders modal mode using ModalShell with accessible label', async () => {
    renderModal({ mode: 'modal', 'data-testid': 'settings-modal-shell' });

    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('data-testid', 'settings-modal-shell');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.parentElement).toHaveClass('modal-backdrop');
  });

  it('invokes onClose when Escape is pressed in panel mode', async () => {
    const handleClose = vi.fn();
    renderModal({ mode: 'panel', onClose: handleClose });

    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
