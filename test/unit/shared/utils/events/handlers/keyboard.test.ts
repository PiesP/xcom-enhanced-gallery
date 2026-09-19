import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { executeVideoControl, navigateNext, navigatePrevious, navigateToItem } = vi.hoisted(() => ({
  executeVideoControl: vi.fn(),
  navigateNext: vi.fn(),
  navigatePrevious: vi.fn(),
  navigateToItem: vi.fn(),
}));

vi.mock('@shared/utils/events/handlers/video-control-helper', () => ({
  executeVideoControl,
}));

vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    isOpen: true,
    currentIndex: 0,
    currentVideoElement: document.createElement('video'),
    mediaItems: [{ id: 'media-1' }],
  },
  navigateNext,
  navigatePrevious,
  navigateToItem,
}));

import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';

describe('handleKeyboardEvent', () => {
  const captureHandlers: EventListener[] = [];

  beforeEach(() => {
    executeVideoControl.mockClear();
    navigateNext.mockClear();
    navigatePrevious.mockClear();
    navigateToItem.mockClear();
    resetKeyboardDebounceState();
  });

  afterEach(() => {
    for (const handler of captureHandlers.splice(0)) {
      document.body.removeEventListener('keydown', handler, { capture: true });
    }
    document.body.replaceChildren();
  });

  it('toggles video playback for the KeyboardEvent space key', () => {
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });

    handleKeyboardEvent(
      event,
      { onGalleryClose: vi.fn(), onMediaClick: vi.fn(async () => undefined) },
      {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: false,
        preventBubbling: true,
        context: 'keyboard-test',
      }
    );

    expect(executeVideoControl).toHaveBeenCalledWith('togglePlayPause');
    expect(event.defaultPrevented).toBe(true);
  });

  it.each(['ArrowRight', ' ', 'Escape'])(
    'passes %j through to the host while modeless recovery is visible',
    (key) => {
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
        throw new Error('Missing keyboard recovery test fixture');
      }

      const onGalleryClose = vi.fn();
      const onKeyboardEvent = vi.fn();
      const hostKeyHandler = vi.fn();
      hostControl.addEventListener('keydown', hostKeyHandler);
      const captureHandler: EventListener = (event) => {
        if (event instanceof KeyboardEvent) {
          handleKeyboardEvent(
            event,
            {
              onGalleryClose,
              onKeyboardEvent,
              onMediaClick: vi.fn(async () => undefined),
            },
            {
              enableKeyboard: true,
              enableMediaDetection: true,
              debugMode: false,
              preventBubbling: true,
              context: 'keyboard-recovery-test',
            }
          );
        }
      };
      captureHandlers.push(captureHandler);
      document.body.addEventListener('keydown', captureHandler, { capture: true });

      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      const dispatched = hostControl.dispatchEvent(event);

      expect(dispatched).toBe(true);
      expect(event.defaultPrevented).toBe(false);
      expect(hostKeyHandler).toHaveBeenCalledOnce();
      expect(onGalleryClose).not.toHaveBeenCalled();
      expect(onKeyboardEvent).not.toHaveBeenCalled();
      expect(navigateNext).not.toHaveBeenCalled();
      expect(navigatePrevious).not.toHaveBeenCalled();
      expect(navigateToItem).not.toHaveBeenCalled();
      expect(executeVideoControl).not.toHaveBeenCalled();
      expect(document.body.contains(recovery)).toBe(true);
    }
  );
});
