import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initializeGalleryEvents,
  cleanupGalleryEvents,
  getGalleryEventStatus,
  removeEventListenersByContext,
} from '@/shared/utils/events';
import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';

describe('P4.4: Priority enforcement — behavior/limits', () => {
  const handlers = {
    onMediaClick: vi.fn(async () => {}),
    onGalleryClose: vi.fn(() => {}),
    onKeyboardEvent: vi.fn(() => {}),
  } as const;

  beforeEach(() => {
    vi.useFakeTimers();
    // ensure gallery closed at start
    closeGallery();
  });

  afterEach(() => {
    cleanupGalleryEvents();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not re-register when listeners are healthy; backs off while skipping', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    await initializeGalleryEvents(handlers, { context: 'gallery' });

    const addCountInitial = (addSpy as any).mock.calls.length;
    // Advance slightly beyond first interval (15s)
    vi.advanceTimersByTime(16000);
    // No re-add/remove expected because listenersHealthy === true
    expect((addSpy as any).mock.calls.length).toBe(addCountInitial);
    expect((removeSpy as any).mock.calls.length).toBe(0);

    // Advance further (simulate multiple intervals with backoff growth)
    vi.advanceTimersByTime(60000);
    expect((addSpy as any).mock.calls.length).toBe(addCountInitial);
    expect((removeSpy as any).mock.calls.length).toBe(0);

    const status = getGalleryEventStatus();
    expect(status.initialized).toBe(true);
    expect(status.hasPriorityInterval).toBe(true);
  });

  it('re-registers at most once when listeners become unhealthy; resets interval', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    await initializeGalleryEvents(handlers, { context: 'gallery' });
    const addCount0 = (addSpy as any).mock.calls.length; // initial 2 adds (click, keydown)

    // Simulate unhealthy by removing all listeners for the gallery context
    const removed = removeEventListenersByContext('gallery');
    expect(removed).toBeGreaterThanOrEqual(1);

    // Next tick after 15s should trigger re-registration once
    vi.advanceTimersByTime(16000);
    const addCount1 = (addSpy as any).mock.calls.length;
    const removeCount1 = (removeSpy as any).mock.calls.length;
    expect(addCount1).toBeGreaterThan(addCount0);
    expect(removeCount1).toBeGreaterThanOrEqual(1);

    // Further intervals should see listenersHealthy and not re-add again
    vi.advanceTimersByTime(60000);
    expect((addSpy as any).mock.calls.length).toBe(addCount1);
  });

  it('skips reinforcement entirely while gallery is open', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    await initializeGalleryEvents(handlers, { context: 'gallery' });
    const addCountInitial = (addSpy as any).mock.calls.length;

    // Open gallery — should skip reinforcement
    openGallery([], 0);

    vi.advanceTimersByTime(90000); // many intervals
    expect((addSpy as any).mock.calls.length).toBe(addCountInitial);
    expect((removeSpy as any).mock.calls.length).toBe(0);
  });
});
