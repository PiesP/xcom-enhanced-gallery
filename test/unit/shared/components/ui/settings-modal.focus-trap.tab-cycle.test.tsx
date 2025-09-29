/** @jsxImportSource solid-js */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@solidjs/testing-library';
import { initializeVendors } from '@shared/external/vendors';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal focus trap - Tab/Shift+Tab cycle (panel)', () => {
  beforeEach(() => {
    initializeVendors();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps focus within dialog on Tab and Shift+Tab', async () => {
    const onClose = vi.fn();
    const { container } = render(() => (
      <SettingsModal isOpen mode='panel' position='center' onClose={onClose} />
    ));

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).toBeTruthy();
    if (!dialog) return;

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], select, [tabindex]:not([tabindex="-1"])'
      )
    );
    expect(focusables.length).toBeGreaterThan(1);

    await waitFor(() => {
      const active = document.activeElement as HTMLElement | null;
      expect(active && dialog.contains(active)).toBe(true);
    });

    fireEvent.keyDown(dialog, { key: 'Tab' });
    await waitFor(() => {
      const active = document.activeElement as HTMLElement | null;
      expect(active && dialog.contains(active)).toBe(true);
    });

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    await waitFor(() => {
      const active = document.activeElement as HTMLElement | null;
      expect(active && dialog.contains(active)).toBe(true);
    });
  });
});
