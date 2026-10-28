import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const {
  executeVideoControl,
  getDisplayedMediaIndex,
  navigateNext,
  navigatePrevious,
  navigateToItem,
} = vi.hoisted(() => ({
  executeVideoControl: vi.fn(),
  getDisplayedMediaIndex: vi.fn(() => 0),
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
  getDisplayedMediaIndex,
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

  it.each(['select', 'input', 'textarea', 'div'] as const)(
    'leaves %s editing keys native while the gallery is open',
    (tag) => {
      const element: HTMLElement = document.createElement(tag);
      if (tag === 'div') {
        Object.defineProperty(element, 'isContentEditable', { get: () => true });
      }
      document.body.append(element);
      const handler = (event: KeyboardEvent) =>
        handleKeyboardEvent(
          event,
          { onGalleryClose: vi.fn(), onMediaClick: vi.fn(async () => undefined) },
          {
            enableKeyboard: true,
            enableMediaDetection: true,
            debugMode: false,
            preventBubbling: true,
            context: 'editing-test',
          }
        );
      element.addEventListener('keydown', handler);
      for (const key of ['Home', 'End', 'ArrowDown', ' ']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }
      expect(executeVideoControl).not.toHaveBeenCalled();
      expect(navigateToItem).not.toHaveBeenCalled();
      expect(navigateNext).not.toHaveBeenCalled();
    }
  );

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

  it('leaves focused native controls and nested panels in charge of their keys', () => {
    const panel = document.createElement('section');
    panel.dataset.galleryElement = 'settings-panel';
    const button = document.createElement('button');
    button.type = 'button';
    const nested = document.createElement('span');
    button.append(nested);
    panel.append(button);
    document.body.append(panel);
    const onGalleryClose = vi.fn();
    const onKeyboardEvent = vi.fn();
    const captureHandler: EventListener = (event) => {
      if (event instanceof KeyboardEvent) {
        handleKeyboardEvent(
          event,
          { onGalleryClose, onKeyboardEvent, onMediaClick: vi.fn(async () => undefined) },
          {
            enableKeyboard: true,
            enableMediaDetection: true,
            debugMode: false,
            preventBubbling: true,
            context: 'native-control-test',
          }
        );
      }
    };
    captureHandlers.push(captureHandler);
    document.body.addEventListener('keydown', captureHandler, { capture: true });

    for (const key of [' ', 'Enter', 'Home', 'ArrowRight']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      nested.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(onGalleryClose).not.toHaveBeenCalled();
    expect(onKeyboardEvent).not.toHaveBeenCalled();
    expect(executeVideoControl).not.toHaveBeenCalled();
    expect(navigateNext).not.toHaveBeenCalled();
    expect(navigateToItem).not.toHaveBeenCalled();
  });

  it('keeps button activation native but routes gallery arrows after a toolbar click', () => {
    const toolbar = document.createElement('div');
    toolbar.dataset.galleryElement = 'toolbar';
    const button = document.createElement('button');
    const label = document.createElement('span');
    button.append(label);
    toolbar.append(button);
    document.body.append(toolbar);
    const captureHandler: EventListener = (event) => {
      if (event instanceof KeyboardEvent) {
        handleKeyboardEvent(
          event,
          { onGalleryClose: vi.fn(), onMediaClick: vi.fn(async () => undefined) },
          {
            enableKeyboard: true,
            enableMediaDetection: true,
            debugMode: false,
            preventBubbling: true,
            context: 'toolbar-button-test',
          }
        );
      }
    };
    captureHandlers.push(captureHandler);
    document.body.addEventListener('keydown', captureHandler, { capture: true });

    for (const key of [' ', 'Enter']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      label.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(executeVideoControl).not.toHaveBeenCalled();

    for (const key of ['ArrowRight', 'ArrowLeft']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      label.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    expect(navigateNext).toHaveBeenCalledOnce();
    expect(navigatePrevious).toHaveBeenCalledOnce();
  });

  it('does not claim modified, composed or already-handled navigation keys', () => {
    const element = document.createElement('div');
    document.body.append(element);
    const captureHandler: EventListener = (event) => {
      if (event instanceof KeyboardEvent) {
        handleKeyboardEvent(
          event,
          { onGalleryClose: vi.fn(), onMediaClick: vi.fn(async () => undefined) },
          {
            enableKeyboard: true,
            enableMediaDetection: true,
            debugMode: false,
            preventBubbling: true,
            context: 'shortcut-eligibility-test',
          }
        );
      }
    };
    captureHandlers.push(captureHandler);
    document.body.addEventListener('keydown', captureHandler, { capture: true });

    for (const init of [
      { key: 'ArrowRight', ctrlKey: true },
      { key: 'ArrowRight', altKey: true },
      { key: 'ArrowRight', metaKey: true },
      { key: 'ArrowRight', shiftKey: true },
      { key: 'ArrowRight', isComposing: true },
    ]) {
      const event = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    const earlierOwner = (event: KeyboardEvent) => event.preventDefault();
    document.addEventListener('keydown', earlierOwner, { capture: true });
    try {
      const claimed = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(claimed);
      expect(claimed.defaultPrevented).toBe(true);
    } finally {
      document.removeEventListener('keydown', earlierOwner, { capture: true });
    }
    expect(navigateNext).not.toHaveBeenCalled();
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
