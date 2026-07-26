import { beforeEach, describe, expect, it, vi } from 'vitest';

const { executeVideoControl } = vi.hoisted(() => ({
  executeVideoControl: vi.fn(),
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
  navigateNext: vi.fn(),
  navigatePrevious: vi.fn(),
  navigateToItem: vi.fn(),
}));

import {
  handleKeyboardEvent,
  resetKeyboardDebounceState,
} from '@shared/utils/events/handlers/keyboard';

describe('handleKeyboardEvent', () => {
  beforeEach(() => {
    executeVideoControl.mockClear();
    resetKeyboardDebounceState();
  });

  it('toggles video playback for the KeyboardEvent space key', () => {
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });

    handleKeyboardEvent(
      event,
      { onGalleryClose: vi.fn() },
      { enableKeyboard: true }
    );

    expect(executeVideoControl).toHaveBeenCalledWith('togglePlayPause');
    expect(event.defaultPrevented).toBe(true);
  });
});
