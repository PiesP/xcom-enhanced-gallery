import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function setup() {
  vi.resetModules();

  // Mock signals used by gallery state
  vi.doMock('@/shared/external/vendors', () => {
    function signal(initial: any) {
      let _v = initial;
      return {
        get value() {
          return _v;
        },
        set value(n) {
          _v = n;
        },
      };
    }
    function effect(fn: () => void) {
      try {
        fn();
      } catch {
        // ignore for tests
      }
      return () => {};
    }
    return { getPreactSignals: vi.fn(() => ({ signal, effect })) };
  });

  const events = await import('@/shared/utils/events');
  const signals = await import('@/shared/state/signals/gallery.signals');
  return { ...events, ...signals };
}

function mountGalleryWithVideo(index = 0) {
  // Root container
  const doc = (globalThis as any).document;
  const root = doc.createElement('div');
  root.id = 'xeg-gallery-root';

  const items = doc.createElement('div');
  items.setAttribute('data-xeg-role', 'items-container');

  const item = doc.createElement('div');
  item.setAttribute('data-index', String(index));

  const video = doc.createElement('video');
  // Stub play/pause to be callable in JSDOM
  (video as unknown as { play: () => Promise<void> }).play = vi.fn(async () => {});
  (video as unknown as { pause: () => void }).pause = vi.fn(() => {});
  // initialize volume/muted
  video.volume = 0.5;
  video.muted = false;

  item.appendChild(video);
  items.appendChild(item);
  root.appendChild(items);
  doc.body.appendChild(root);

  return { root, items, item, video };
}

describe('Gallery video keyboard controls (Space/ArrowUp/ArrowDown/M)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).document.body.innerHTML = '';
  });

  afterEach(() => {
    (globalThis as any).document.body.innerHTML = '';
  });

  it('Space toggles play/pause for current gallery video and prevents default when open', async () => {
    const { initializeGalleryEvents, cleanupGalleryEvents, openGallery } = await setup();

    const handled: string[] = [];
    await initializeGalleryEvents(
      {
        onMediaClick: vi.fn(async () => {}),
        onGalleryClose: vi.fn(() => handled.push('close')),
        onKeyboardEvent: vi.fn((e: any) => handled.push((e && (e as any).key) as string)),
      },
      { enableKeyboard: true, enableMediaDetection: false }
    );

    const { video } = mountGalleryWithVideo(0);

    // Open gallery with a video item
    openGallery(
      [
        {
          id: 'v1',
          url: 'https://video.twimg.com/video/abc.mp4',
          originalUrl: 'https://video.twimg.com/video/abc.mp4',
          type: 'video',
          filename: 'abc.mp4',
        },
      ],
      0
    );

    function dispatchKey(key: string) {
      const EvCtor: any = (globalThis as any).KeyboardEvent;
      const ev = new EvCtor('keydown', { key, bubbles: true, cancelable: true });
      const ok = (globalThis as any).document.dispatchEvent(ev);
      return { defaultPrevented: ev.defaultPrevented, dispatched: ok };
    }

    // First press → play()
    let r = dispatchKey(' ');
    expect(r.defaultPrevented).toBe(true);
    expect((video as unknown as { play: () => Promise<void> }).play).toHaveBeenCalledTimes(1);

    // Second press → pause()
    r = dispatchKey(' ');
    expect(r.defaultPrevented).toBe(true);
    expect((video as unknown as { pause: () => void }).pause).toHaveBeenCalledTimes(1);

    cleanupGalleryEvents();
  });

  it('ArrowUp/ArrowDown adjust volume and prevent default; M toggles mute', async () => {
    const { initializeGalleryEvents, cleanupGalleryEvents, openGallery } = await setup();

    await initializeGalleryEvents(
      {
        onMediaClick: vi.fn(async () => {}),
        onGalleryClose: vi.fn(() => {}),
        onKeyboardEvent: vi.fn(() => {}),
      },
      { enableKeyboard: true, enableMediaDetection: false }
    );

    const { video } = mountGalleryWithVideo(0);

    openGallery(
      [
        {
          id: 'v1',
          url: 'https://video.twimg.com/video/abc.mp4',
          originalUrl: 'https://video.twimg.com/video/abc.mp4',
          type: 'video',
          filename: 'abc.mp4',
        },
      ],
      0
    );

    function dispatchKey(key: string) {
      const EvCtor: any = (globalThis as any).KeyboardEvent;
      const ev = new EvCtor('keydown', { key, bubbles: true, cancelable: true });
      const ok = (globalThis as any).document.dispatchEvent(ev);
      return { defaultPrevented: ev.defaultPrevented, dispatched: ok };
    }

    const initialVolume = video.volume;
    let r = dispatchKey('ArrowUp');
    expect(r.defaultPrevented).toBe(true);
    expect(video.volume).toBeGreaterThan(initialVolume);

    r = dispatchKey('ArrowDown');
    expect(r.defaultPrevented).toBe(true);
    expect(video.volume).toBeLessThanOrEqual(initialVolume);

    const prevMuted = video.muted;
    r = dispatchKey('m');
    expect(r.defaultPrevented).toBe(true);
    expect(video.muted).toBe(!prevMuted);

    r = dispatchKey('M');
    expect(r.defaultPrevented).toBe(true);
    expect(video.muted).toBe(prevMuted);

    cleanupGalleryEvents();
  });
});
