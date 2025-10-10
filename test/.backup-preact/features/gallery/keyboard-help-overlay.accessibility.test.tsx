import { sharedConfig } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '../../utils/testing-library';
import { getSolid, initializeVendors } from '../../../src/shared/external/vendors';
import { KeyboardHelpOverlay } from '../../../src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

vi.mock('../../../src/shared/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({
    isActive: false,
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}));

const solid = getSolid();
const { createSignal, createComponent } = solid;

const resetSharedConfig = () => {
  const mutableConfig = sharedConfig as unknown as {
    context: typeof sharedConfig.context | undefined;
    registry: typeof sharedConfig.registry | undefined;
  };

  mutableConfig.context = undefined;
  mutableConfig.registry = undefined;
};

function getDoc() {
  return (globalThis as any)?.document || null;
}

// Contract: When overlay opens, initial focus should be on the close button.
// When overlay closes (escape or backdrop), focus should be restored to the previously focused trigger element.

describe('KeyboardHelpOverlay accessibility', () => {
  let root!: HTMLElement;

  beforeEach(() => {
    initializeVendors();
    const doc = getDoc();
    if (!doc) {
      throw new Error('Document not initialized');
    }

    root = doc.createElement('div');
    doc.body.innerHTML = '';
    doc.body.appendChild(root);
  });

  function setup(triggerLabel = 'Open Help') {
    const [isOpen, setIsOpen] = createSignal(false);

    const Trigger = () => (
      <button type='button' aria-label={triggerLabel} onClick={() => setIsOpen(true)}>
        open
      </button>
    );

    const App = () => (
      <div>
        <Trigger />
        <KeyboardHelpOverlay open={isOpen()} onClose={() => setIsOpen(false)} />
      </div>
    );

    return { App, isOpen, setIsOpen };
  }

  it('sets initial focus to close button on open', async () => {
    const { App } = setup();
    const { container } = render(() => <App />, { container: root });
    const trigger = container.querySelector('button[aria-label="Open Help"]');
    expect(trigger).toBeTruthy();
    if (!trigger) return;
    fireEvent.focus(trigger);
    fireEvent.click(trigger);
    await waitFor(() => {
      const closeBtn = container.querySelector('button[aria-label="Close"]');
      expect(closeBtn).toBeTruthy();
      expect(getDoc()?.activeElement).toBe(closeBtn);
    });
  });

  it('restores focus to trigger when closed via Escape', async () => {
    const { App } = setup('Help Trigger');
    const { container } = render(() => <App />, { container: root });
    const trigger = container.querySelector('button[aria-label="Help Trigger"]');
    expect(trigger).toBeTruthy();
    if (!trigger) return;
    fireEvent.focus(trigger);
    fireEvent.click(trigger);

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();

    const d = getDoc();
    if (d) fireEvent.keyDown(d, { key: 'Escape' });

    await waitFor(
      () => {
        const doc = getDoc();
        const activeElement = doc?.activeElement as HTMLElement | null;
        const currentTrigger = container.querySelector(
          'button[aria-label="Help Trigger"]'
        ) as HTMLElement | null;
        const marked = currentTrigger && currentTrigger.getAttribute('data-xeg-focused') === '1';
        expect(
          activeElement === trigger ||
            (currentTrigger && activeElement === currentTrigger) ||
            marked
        ).toBe(true);
      },
      { timeout: 1500 }
    );
  });

  it('restores focus to previous element when closed', async () => {
    resetSharedConfig();
    const { document: doc } = globalThis;
    const button = doc.createElement('button');
    button.textContent = 'Open overlay';
    doc.body.appendChild(button);
    button.focus();

    const [isOpen, setIsOpen] = createSignal(true);
    const onClose = vi.fn(() => setIsOpen(false));

    const { unmount } = render(() =>
      createComponent(KeyboardHelpOverlay, {
        open: isOpen(),
        onClose,
      })
    );

    expect(doc.activeElement).not.toBe(button);

    setIsOpen(false);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    await waitFor(() => expect(doc.activeElement).toBe(button));

    unmount();
    button.remove();
  });
});
