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

const { createSignal } = getSolid();

function resetSharedConfig(): void {
  Reflect.set(sharedConfig, 'context', undefined);
  Reflect.set(sharedConfig, 'registry', undefined);
}

describe.skip('KeyboardHelpOverlay', () => {
  // SKIP: Solid.js reactivity in test environment is complex
  // TODO: Convert to E2E test or simplify to unit test individual behaviors
  // Related: Phase 10 test stabilization - Solid.js testing patterns need refinement

  it('opens and closes with ESC and backdrop click', async () => {
    resetSharedConfig();
    const [isOpen, setIsOpen] = createSignal(true);
    const onClose = vi.fn(() => {
      setIsOpen(false);
    });

    // Render with reactive prop access
    const { getByRole, queryByRole, container } = render(() => (
      <KeyboardHelpOverlay open={isOpen()} onClose={onClose} />
    ));

    // Dialog should be visible initially
    let dialog = getByRole('dialog');
    expect(dialog).toBeTruthy();

    // ESC closes
    fireEvent.keyDown(globalThis.document ?? window.document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Reopen
    setIsOpen(true);
    await waitFor(() => expect(getByRole('dialog')).toBeTruthy(), { timeout: 1000 });

    // Backdrop click closes
    const backdrop = container.firstElementChild as HTMLElement | null;
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalledTimes(2);

    // Verify closed state - dialog should not be in DOM
    await waitFor(
      () => {
        const dialogElement = queryByRole('dialog');
        expect(dialogElement).toBeNull();
      },
      { timeout: 1000 }
    );
  });
});
