import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { getPreact, initializeVendors } from '@shared/external/vendors';
import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal';

describe('SettingsModal a11y smoke (panel mode)', () => {
  beforeEach(() => {
    initializeVendors();
    document.body.innerHTML = '';
  });

  it('renders dialog semantics with aria attributes', () => {
    const onClose = vi.fn();
    const { container } = render(
      getPreact().h(SettingsModal, {
        isOpen: true,
        onClose,
        mode: 'panel',
        position: 'center',
        'data-testid': 'settings-a11y-smoke',
      })
    );

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialog).toBeTruthy();
    if (!dialog) return;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const labelledby = dialog.getAttribute('aria-labelledby');
    const describedby = dialog.getAttribute('aria-describedby');
    expect(labelledby).toBeTruthy();
    expect(describedby).toBeTruthy();

    // labelled element exists and is a heading
    const labelledEl = labelledby ? container.querySelector(`#${labelledby}`) : null;
    expect(labelledEl).toBeTruthy();
    if (labelledEl) {
      expect(labelledEl.tagName.toLowerCase()).toBe('h2');
    }

    // described element exists (content container)
    const describedEl = describedby ? container.querySelector(`#${describedby}`) : null;
    expect(describedEl).toBeTruthy();
  });

  it('closes on Escape keydown dispatched on dialog container', () => {
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

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking on backdrop (panel container)', () => {
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

    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
