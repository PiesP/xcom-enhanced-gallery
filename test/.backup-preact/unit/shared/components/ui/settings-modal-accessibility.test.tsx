/**
 * @fileoverview Settings Modal Accessibility Tests (Solid)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '../../../../utils/testing-library';
import {
  SettingsModal,
  type SettingsModalProps,
} from '../../../../../src/shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal accessibility', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  const renderModal = (override: Partial<SettingsModalProps> = {}) =>
    render(() => <SettingsModal isOpen onClose={mockOnClose} {...override} />);

  it('renders dialog with labelled title and description', async () => {
    renderModal();

    const dialog = await screen.findByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('settings-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('settings-content');

    const title = screen.getByText('Settings');
    expect(title.id).toBe('settings-title');

    const description = document.getElementById('settings-content');
    expect(description).not.toBeNull();
  });

  it('provides an accessible close button label', async () => {
    renderModal();

    const closeButton = await screen.findByLabelText('Close');
    expect(closeButton.getAttribute('data-initial-focus')).toBe('true');
  });

  it('associates labels with theme and language selectors', async () => {
    renderModal();

    const themeSelect = screen.getByLabelText('Theme');
    const languageSelect = screen.getByLabelText('Language');

    expect(themeSelect).toHaveProperty('id', 'theme-select');
    expect(languageSelect).toHaveProperty('id', 'language-select');
  });

  it('supports panel mode positions with data attribute', async () => {
    renderModal({ mode: 'panel', position: 'top-right', 'data-testid': 'panel-modal' });

    const panel = await screen.findByTestId('panel-modal');
    expect(panel.getAttribute('data-position')).toBe('top-right');
    expect(panel.getAttribute('role')).toBe('dialog');
  });

  it('does not render dialog when closed', () => {
    render(() => <SettingsModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
