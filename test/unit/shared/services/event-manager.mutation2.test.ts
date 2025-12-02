vi.mock('@shared/logging', () => ({ logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn(), error: vi.fn() } }));
import { EventManager } from '@shared/services/event-manager';
import * as galleryLifecycle from '@shared/utils/events/lifecycle/gallery-lifecycle';
import { logger } from '@shared/logging';

describe('EventManager - additional mutation coverage', () => {
  beforeEach(() => {
    (EventManager as unknown as { instance?: unknown }).instance = null;
    vi.clearAllMocks();
  });

  it('cleanupAll should handle cleanupGalleryEvents throwing error', () => {
    const manager = EventManager.getInstance();

    // Spy on cleanupGalleryEvents to throw
    const spy = vi.spyOn(galleryLifecycle, 'cleanupGalleryEvents').mockImplementation(() => {
      throw new Error('gallery cleanup failed');
    });

    expect(() => manager.cleanupAll()).not.toThrow();
    expect(spy).toHaveBeenCalled();
    // Should still log a warning when cleanupGalleryEvents fails
    expect(logger.warn).toHaveBeenCalledWith('EventManager: Failed to cleanup gallery events', expect.any(Error));
    // cleanupAll should still set isDestroyed
    expect(manager.getIsDestroyed()).toBe(true);

    spy.mockRestore();
  });
});
