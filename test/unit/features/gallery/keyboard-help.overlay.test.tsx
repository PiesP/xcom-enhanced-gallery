import { sharedConfig } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@test/utils/testing-library';
import { getSolid } from '../../../../src/shared/external/vendors';
import { KeyboardHelpOverlay } from '../../../../src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

vi.mock('../../../../src/shared/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({
    isActive: false,
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}));

const { createSignal, createComponent } = getSolid();

function resetSharedConfig(): void {
  Reflect.set(sharedConfig, 'context', undefined);
  Reflect.set(sharedConfig, 'registry', undefined);
}

describe('KeyboardHelpOverlay', () => {
  it('opens and closes with ESC and backdrop click', async () => {
    resetSharedConfig();
    const [isOpen, setIsOpen] = createSignal(true);
    const onClose = vi.fn(() => {
      setIsOpen(false);
    });

    const { getByRole, queryByRole, container } = render(() =>
      createComponent(KeyboardHelpOverlay, {
        open: isOpen(),
        onClose,
      })
    );

    const dialog = getByRole('dialog');
    expect(dialog).toBeTruthy();

    // ESC closes
    fireEvent.keyDown(globalThis.document ?? window.document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    setIsOpen(true);
    await waitFor(() => expect(getByRole('dialog')).toBeTruthy());

    // Backdrop click closes
    const backdrop = container.firstElementChild as HTMLElement | null;
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalledTimes(2);

    // Closed state renders null
    setIsOpen(false);
    expect(queryByRole('dialog')).toBeNull();
  });
});
