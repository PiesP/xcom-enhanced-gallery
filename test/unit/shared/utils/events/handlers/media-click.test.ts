// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { handleMediaClick } from '@shared/utils/events/handlers/media-click';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    isOpen: true,
  },
}));

const options: GalleryEventOptions = {
  enableKeyboard: true,
  enableMediaDetection: true,
  debugMode: false,
  preventBubbling: true,
  context: 'media-click-recovery-test',
};

function installGalleryCaptureHandler(handlers: EventHandlers): EventListener {
  const captureHandler: EventListener = (event) => {
    if (event instanceof MouseEvent) {
      void handleMediaClick(event, handlers, options);
    }
  };
  document.body.addEventListener('click', captureHandler, { capture: true });
  return captureHandler;
}

describe('handleMediaClick recovery routing', () => {
  const captureHandlers: EventListener[] = [];

  afterEach(() => {
    for (const handler of captureHandlers.splice(0)) {
      document.body.removeEventListener('click', handler, { capture: true });
    }
    document.body.replaceChildren();
  });

  it('lets an outside click reach the host without closing modeless recovery', () => {
    document.body.innerHTML = `
      <main>
        <button id="host-control" type="button">Host control</button>
      </main>
      <section data-xeg-error-boundary="">
        <button data-xeg-error-action="close" type="button">Close</button>
      </section>
    `;
    const hostControl = document.querySelector('#host-control');
    const recovery = document.querySelector('[data-xeg-error-boundary]');
    if (!(hostControl instanceof HTMLButtonElement) || !(recovery instanceof HTMLElement)) {
      throw new Error('Missing click recovery test fixture');
    }

    const hostClickHandler = vi.fn();
    const onGalleryClose = vi.fn();
    hostControl.addEventListener('click', hostClickHandler);
    captureHandlers.push(
      installGalleryCaptureHandler({
        onGalleryClose,
        onMediaClick: vi.fn(async () => undefined),
      })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const dispatched = hostControl.dispatchEvent(event);

    expect(dispatched).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(hostClickHandler).toHaveBeenCalledOnce();
    expect(onGalleryClose).not.toHaveBeenCalled();
    expect(document.body.contains(recovery)).toBe(true);
  });

  it('keeps recovery action buttons interactive', () => {
    document.body.innerHTML = `
      <section data-xeg-error-boundary="">
        <button data-xeg-error-action="close" type="button">Close</button>
      </section>
    `;
    const closeButton = document.querySelector('[data-xeg-error-action="close"]');
    if (!(closeButton instanceof HTMLButtonElement)) {
      throw new Error('Missing recovery close button fixture');
    }

    const recoveryClickHandler = vi.fn();
    const onGalleryClose = vi.fn();
    closeButton.addEventListener('click', recoveryClickHandler);
    captureHandlers.push(
      installGalleryCaptureHandler({
        onGalleryClose,
        onMediaClick: vi.fn(async () => undefined),
      })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const dispatched = closeButton.dispatchEvent(event);

    expect(dispatched).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(recoveryClickHandler).toHaveBeenCalledOnce();
    expect(onGalleryClose).not.toHaveBeenCalled();
  });

  it('preserves normal modal outside-click routing without recovery', () => {
    document.body.innerHTML = '<button id="host-control" type="button">Host control</button>';
    const hostControl = document.querySelector('#host-control');
    if (!(hostControl instanceof HTMLButtonElement)) {
      throw new Error('Missing normal modal test fixture');
    }

    const hostClickHandler = vi.fn();
    const onGalleryClose = vi.fn();
    hostControl.addEventListener('click', hostClickHandler);
    captureHandlers.push(
      installGalleryCaptureHandler({
        onGalleryClose,
        onMediaClick: vi.fn(async () => undefined),
      })
    );

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const dispatched = hostControl.dispatchEvent(event);

    expect(dispatched).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(hostClickHandler).not.toHaveBeenCalled();
    expect(onGalleryClose).toHaveBeenCalledOnce();
  });
});
