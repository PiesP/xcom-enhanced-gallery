/**
 * @fileoverview SettingsModal component tests (Solid)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, h } from '@test/utils/testing-library';
import {
  SettingsModal,
  type SettingsModalProps,
} from '../../../../../src/shared/components/ui/SettingsModal/SettingsModal';
import { ThemeService } from '../../../../../src/shared/services/ThemeService';
import {
  LanguageService,
  languageService,
} from '../../../../../src/shared/services/LanguageService';

type PartialProps = Partial<SettingsModalProps>;

const mountModal = (override: PartialProps = {}) => {
  const { onClose = vi.fn(), children, ...rest } = override;
  const result = render(
    h(
      SettingsModal,
      { isOpen: true, onClose, ...rest },
      ...(children !== undefined ? [children] : [])
    )
  );

  return { ...result, onClose };
};

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    languageService.setLanguage('auto');
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders default layout with theme and language controls', () => {
    mountModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
  });

  it('defaults position to center when not provided', () => {
    const { container } = render(h(SettingsModal, { isOpen: true, onClose: vi.fn() }));
    const panel = container.querySelector('[data-position]');
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute('data-position')).toBe('center');
  });

  it('does not render when closed', () => {
    render(h(SettingsModal, { isOpen: false, onClose: vi.fn() }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('invokes onClose when close button is clicked', () => {
    const { onClose } = mountModal();

    fireEvent.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when clicking backdrop', () => {
    const { onClose } = mountModal();

    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking modal content', () => {
    const { onClose } = mountModal();

    const content = screen.getByText('Settings').closest('div');
    expect(content).not.toBeNull();
    if (content) {
      fireEvent.click(content);
    }

    expect(onClose).not.toHaveBeenCalled();
  });

  it('invokes onClose on Escape key', () => {
    const { onClose } = mountModal();

    fireEvent.keyDown(screen.getByRole('document'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('updates theme via ThemeService and data-theme attribute', () => {
    const themeSpy = vi.spyOn(ThemeService.prototype, 'setTheme');
    mountModal();

    const themeSelect = screen.getByLabelText('Theme') as globalThis.HTMLSelectElement;
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    expect(themeSelect.value).toBe('dark');
    expect(themeSpy).toHaveBeenCalledWith('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    themeSpy.mockRestore();
  });

  it('updates language via LanguageService', () => {
    const languageSpy = vi.spyOn(LanguageService.prototype, 'setLanguage');
    mountModal();

    const languageSelect = screen.getByLabelText('Language') as globalThis.HTMLSelectElement;
    fireEvent.change(languageSelect, { target: { value: 'en' } });

    expect(languageSelect.value).toBe('en');
    expect(languageSpy).toHaveBeenCalledWith('en');

    languageSpy.mockRestore();
  });

  it('supports panel mode with position attribute and custom class', () => {
    const { container } = mountModal({
      mode: 'panel',
      position: 'top-right',
      className: 'custom-modal',
    });

    const panel = container.querySelector('[role="dialog"]');
    expect(panel).not.toBeNull();
    if (panel) {
      expect(panel.getAttribute('data-position')).toBe('top-right');
      expect(panel.className).toContain('custom-modal');
    }
  });

  it('respects custom children content', () => {
    render(
      h(
        SettingsModal,
        { isOpen: true, onClose: vi.fn() },
        h('div', { 'data-testid': 'custom-body' }, 'Custom Settings')
      )
    );

    expect(screen.getByTestId('custom-body')).toHaveTextContent('Custom Settings');
    expect(screen.queryByText('Theme')).toBeNull();
    expect(screen.queryByText('Language')).toBeNull();
  });

  it('forwards data-testid to root element', () => {
    const { container } = mountModal({ 'data-testid': 'settings-modal-root' });

    const root = container.querySelector('[data-testid="settings-modal-root"]');
    expect(root).not.toBeNull();
  });
});
