/**
 * @fileoverview Gallery event scoping tests
 * @description Ensures gallery event wiring targets the Twitter scroll container instead of the global document
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { initializeGalleryEvents, cleanupGalleryEvents } from '@shared/utils/events';

describe('Gallery event scoping', () => {
  setupGlobalTestIsolation();

  afterEach(() => {
    cleanupGalleryEvents();
    vi.restoreAllMocks();
  });

  it('attaches keyboard and click listeners to the provided root element', async () => {
    const fakeContainer = document.createElement('div');
    const addEventListenerSpy = vi.spyOn(fakeContainer, 'addEventListener');

    const handlers = {
      onMediaClick: vi.fn().mockResolvedValue(undefined),
      onGalleryClose: vi.fn(),
      onKeyboardEvent: vi.fn(),
    };

    await initializeGalleryEvents(handlers, fakeContainer);

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
