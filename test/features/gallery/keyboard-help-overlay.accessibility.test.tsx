/** @jsxImportSource solid-js */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent, waitFor, cleanup } from '@test-utils/testing-library';
import { initializeVendors } from '@shared/external/vendors';
import {
  createSolidKeyboardHelpOverlayController,
  type SolidKeyboardHelpOverlayController,
} from '@/features/gallery/solid/createSolidKeyboardHelpOverlayController';

function getDoc() {
  return (globalThis as any)?.document || null;
}

function appendTrigger(label: string) {
  const doc = getDoc();
  if (!doc) {
    throw new Error('Document is not available in the current environment.');
  }
  const trigger = doc.createElement('button');
  trigger.type = 'button';
  trigger.setAttribute('aria-label', label);
  trigger.textContent = 'open';
  doc.body.appendChild(trigger);
  return trigger;
}

describe('KeyboardHelpOverlay accessibility (N5)', () => {
  let controller: SolidKeyboardHelpOverlayController | null = null;

  beforeEach(async () => {
    await initializeVendors();
    const doc = getDoc();
    if (doc) {
      doc.body.innerHTML = '';
    }
  });

  afterEach(() => {
    controller?.dispose();
    controller = null;
    const doc = getDoc();
    if (doc) {
      doc.body.innerHTML = '';
    }
    cleanup();
  });

  it('sets initial focus to close button on open', async () => {
    const doc = getDoc();
    const trigger = appendTrigger('Open Help');
    expect(doc).toBeTruthy();
    trigger.focus();

    controller = createSolidKeyboardHelpOverlayController();
    controller.open();

    await waitFor(() => {
      const closeBtn = doc?.querySelector(
        '[data-xeg-solid-help-overlay] button[aria-label="Close"]'
      ) as HTMLElement | null;
      expect(closeBtn).toBeTruthy();
      expect(doc?.activeElement).toBe(closeBtn);
    });
  });

  it('restores focus to trigger when closed via Escape', async () => {
    const doc = getDoc();
    const trigger = appendTrigger('Help Trigger');
    expect(doc).toBeTruthy();
    trigger.focus();

    controller = createSolidKeyboardHelpOverlayController();
    controller.open();

    await waitFor(() => {
      expect(doc?.querySelector('[data-xeg-solid-help-overlay] [role="dialog"]')).toBeTruthy();
    });

    if (doc) {
      fireEvent.keyDown(doc, { key: 'Escape' });
    }

    await waitFor(
      () => {
        const overlay = doc?.querySelector('[data-xeg-solid-help-overlay] [role="dialog"]');
        expect(overlay).toBeFalsy();
      },
      { timeout: 1500 }
    );

    await waitFor(() => {
      const activeElement = doc?.activeElement as HTMLElement | null;
      const marked = trigger.getAttribute('data-xeg-focused') === '1';
      expect(activeElement === trigger || marked).toBe(true);
    });
  });
});
