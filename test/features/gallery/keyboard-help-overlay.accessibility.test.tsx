// Safe document accessor (jsdom or browser)
function getDoc() {
  return (globalThis as any)?.document || null;
}
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/preact';
import { getPreact, getPreactSignals, initializeVendors } from '@/shared/external/vendors';
import { KeyboardHelpOverlay } from '@/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';

// Contract: When overlay opens, initial focus should be on the close button.
// When overlay closes (escape or backdrop), focus should be restored to the previously focused trigger element.

describe('KeyboardHelpOverlay accessibility (N5)', () => {
  const { h } = getPreact();
  const { signal } = getPreactSignals();
  let root: any;

  beforeEach(() => {
    initializeVendors();
    const d = getDoc();
    root = d?.createElement('div') || null;
    if (d && root) {
      d.body.innerHTML = '';
      d.body.appendChild(root);
    }
  });

  function setup(triggerLabel = 'Open Help') {
    const openSig = signal(false);

    const Trigger = () =>
      h(
        'button',
        {
          type: 'button',
          'aria-label': triggerLabel,
          onClick: () => (openSig.value = true),
        },
        'open'
      );

    function App() {
      return h(
        'div',
        {},
        h(Trigger, {}),
        h(KeyboardHelpOverlay, {
          open: openSig.value,
          onClose: () => (openSig.value = false),
        })
      );
    }

    return { App, openSig };
  }

  it('sets initial focus to close button on open', async () => {
    const { App } = setup();
    const { container } = render(h(App, {}), { container: root || undefined });
    const trigger = container.querySelector('button[aria-label="Open Help"]');
    expect(trigger).toBeTruthy();
    if (!trigger) return;
    fireEvent.focus(trigger);
    fireEvent.click(trigger);
    await waitFor(() => {
      const closeBtn = container.querySelector('button[aria-label="Close"]');
      expect(closeBtn).toBeTruthy();
      // jsdom에서 activeElement가 즉시 반영되지 않을 수 있으므로 waitFor로 안정화
      expect(getDoc()?.activeElement).toBe(closeBtn);
    });
  });

  it('restores focus to trigger when closed via Escape', async () => {
    const { App } = setup('Help Trigger');
    const { container } = render(h(App, {}), { container: root || undefined });
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
        // After close, focus should return to trigger (allow DOM node reuse)
        const doc = getDoc();
        const ae = doc?.activeElement as HTMLElement | null;
        const currentTrigger = container.querySelector(
          'button[aria-label="Help Trigger"]'
        ) as HTMLElement | null;
        const marked = currentTrigger && currentTrigger.getAttribute('data-xeg-focused') === '1';
        expect(ae === trigger || (currentTrigger && ae === currentTrigger) || marked).toBe(true);
      },
      { timeout: 1500 }
    );
  });
});
