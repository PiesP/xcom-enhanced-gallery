/**
 * @fileoverview SettingsModal form control theming tests (RED)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent } from 'solid-js';
import { render, screen, cleanup, fireEvent, within } from '@test-utils/testing-library';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

afterEach(() => {
  cleanup();
});

describe('SettingsModal form controls — themed surface consistency', () => {
  it('keeps form-control classes on selects and checkbox across theme changes', async () => {
    render(() =>
      createComponent(SettingsModal as any, {
        isOpen: true,
        onClose: () => void 0,
      })
    );

    const themeSelect = screen.getByLabelText(/theme/i);
    const languageRadiogroup = screen.getByRole('radiogroup', { name: /language/i });
    const toastToggle = screen.getByLabelText(/progress toast/i);

    expect(themeSelect.className).toContain('formControl');
    // Language is now a RadioGroup, not a select, so it doesn't have formControl class
    expect(languageRadiogroup).toBeDefined();
    expect(toastToggle.className).toContain('formControlToggle');

    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    expect((themeSelect as any).value).toBe('dark');
    expect(themeSelect.className).toContain('formControl');

    // Language RadioGroup uses radio buttons, not change events
    const jaRadio = within(languageRadiogroup).getByRole('radio', { name: /Japanese/i });
    fireEvent.click(jaRadio);
    expect(jaRadio.getAttribute('aria-checked')).toBe('true');
    // RadioGroup doesn't have formControl class, only the theme select does
    expect(languageRadiogroup.className).not.toContain('formControl');

    fireEvent.click(toastToggle);
    expect((toastToggle as any).checked).toBe(true);
    expect(toastToggle.className).toContain('formControlToggle');
  });
});
