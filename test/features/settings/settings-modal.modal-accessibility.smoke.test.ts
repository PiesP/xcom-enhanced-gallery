import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { getPreact, initializeVendors } from '@shared/external/vendors';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal a11y smoke (modal mode)', () => {
  beforeEach(() => {
    initializeVendors();
    document.body.innerHTML = '';
  });

  it('renders dialog semantics on backdrop container', () => {
    const onClose = vi.fn();
    const { container } = render(
      getPreact().h(SettingsModal, {
        isOpen: true,
        onClose,
        mode: 'modal',
        position: 'center',
        'data-testid': 'settings-a11y-modal-smoke',
      })
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).toBeTruthy();
    if (!dialog) return;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('closes on Escape and backdrop click', () => {
    const onClose = vi.fn();
    const { container } = render(
      getPreact().h(SettingsModal, {
        isOpen: true,
        onClose,
        mode: 'modal',
        position: 'center',
      })
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).toBeTruthy();
    if (!dialog) return;

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // reopen and test backdrop click
    onClose.mockReset();
    const { container: container2 } = render(
      getPreact().h(SettingsModal, {
        isOpen: true,
        onClose,
        mode: 'modal',
        position: 'center',
      })
    );
    const dialog2 = container2.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog2).toBeTruthy();
    if (!dialog2) return;
    fireEvent.click(dialog2); // backdrop is the dialog container in modal mode
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
