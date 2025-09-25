/**
 * @fileoverview SettingsModal form control theming tests (RED)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/preact';
import { getPreact } from '../../../src/shared/external/vendors';
import { SettingsModal } from '../../../src/shared/components/ui/SettingsModal/SettingsModal';

const { h } = getPreact();

afterEach(() => {
  cleanup();
});

describe('SettingsModal form controls — themed surface consistency', () => {
  it('keeps form-control classes on selects and checkbox across theme changes', async () => {
    render(
      h(SettingsModal as any, {
        isOpen: true,
        onClose: () => void 0,
      })
    );

    const themeSelect = screen.getByLabelText(/theme/i);
    const languageSelect = screen.getByLabelText(/language/i);
    const toastToggle = screen.getByLabelText(/progress toast/i);

    expect(themeSelect.className).toContain('formControl');
    expect(languageSelect.className).toContain('formControl');
    expect(toastToggle.className).toContain('formControlToggle');

    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    expect((themeSelect as any).value).toBe('dark');
    expect(themeSelect.className).toContain('formControl');

    fireEvent.change(languageSelect, { target: { value: 'ja' } });
    expect((languageSelect as any).value).toBe('ja');
    expect(languageSelect.className).toContain('formControl');

    fireEvent.click(toastToggle);
    expect((toastToggle as any).checked).toBe(true);
    expect(toastToggle.className).toContain('formControlToggle');
  });
});
