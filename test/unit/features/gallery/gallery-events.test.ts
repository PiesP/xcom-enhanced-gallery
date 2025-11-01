/**
 * @fileoverview Gallery event scoping tests
 * @description Ensures gallery event wiring targets the Twitter scroll container instead of the global document
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import * as CoreUtils from '@/shared/utils/core-utils';
import { initializeGalleryEvents, cleanupGalleryEvents } from '@/shared/utils/events';

describe('Gallery event scoping', () => {
  afterEach(() => {
    cleanupGalleryEvents();
    vi.restoreAllMocks();
  });

  it('attaches keyboard and click listeners to the Twitter scroll container', async () => {
    const fakeContainer = document.createElement('div');
    const addEventListenerSpy = vi.spyOn(fakeContainer, 'addEventListener');

    const findSpy = vi
      .spyOn(CoreUtils, 'findTwitterScrollContainer')
      .mockReturnValue(fakeContainer as HTMLElement);

    const handlers = {
      onMediaClick: vi.fn().mockResolvedValue(undefined),
      onGalleryClose: vi.fn(),
      onKeyboardEvent: vi.fn(),
    };

    await initializeGalleryEvents(handlers, {
      enableMediaDetection: true,
      enableKeyboard: true,
      preventBubbling: true,
      context: 'gallery-scope-test',
    });

    expect(findSpy).toHaveBeenCalled();
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      expect.objectContaining({ capture: true })
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      expect.objectContaining({ capture: true })
    );
  });
});
