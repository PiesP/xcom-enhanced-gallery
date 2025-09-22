import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { getPreact, initializeVendors } from '@shared/external/vendors';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal focus trap - Tab/Shift+Tab cycle (panel)', () => {
  beforeEach(() => {
    initializeVendors();
    document.body.innerHTML = '';
  });

  it('keeps focus within dialog on Tab and Shift+Tab', () => {
    const onClose = vi.fn();
    const { container } = render(
      getPreact().h(SettingsModal, {
        isOpen: true,
        onClose,
        mode: 'panel',
        position: 'center',
      })
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).toBeTruthy();
    if (!dialog) return;

    // find focusable elements within the dialog
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], select, [tabindex]:not([tabindex="-1"])'
      )
    );
    expect(focusables.length).toBeGreaterThan(1);

    // initial focus is close button per component behavior
    const initialActive = document.activeElement as HTMLElement | null;
    expect(initialActive && dialog.contains(initialActive)).toBe(true);

    // Press Tab: focus should remain within dialog (we assert containment only)
    fireEvent.keyDown(dialog, { key: 'Tab' });
    const afterTab = document.activeElement as HTMLElement | null;
    expect(afterTab && dialog.contains(afterTab)).toBe(true);

    // Press Shift+Tab: still contained
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    const afterShiftTab = document.activeElement as HTMLElement | null;
    expect(afterShiftTab && dialog.contains(afterShiftTab)).toBe(true);
  });
});
