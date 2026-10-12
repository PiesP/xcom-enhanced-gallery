// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaExtractionResult } from '@shared/types/media.types';
import { clearSettings, registerSettings } from '@shared/container/settings-registry';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MediaClickHandler = (element: HTMLElement, event: MouseEvent) => Promise<void>;

const state = vi.hoisted(() => ({
  cancelPending: vi.fn(),
  error: vi.fn(),
  extract: vi.fn(),
  handlers: null as { onMediaClick: MediaClickHandler; onGalleryClose: () => void } | null,
  notify: vi.fn(),
  openGallery: vi.fn(),
  warn: vi.fn(),
  setSetting: vi.fn(async () => undefined),
}));

vi.mock('@shared/utils/events/lifecycle/gallery-lifecycle', () => ({
  createGalleryLifecycle: () => ({
    initialize: vi.fn((handlers: typeof state.handlers) => {
      state.handlers = handlers;
      return vi.fn();
    }),
    cleanup: vi.fn(),
  }),
}));

vi.mock('@shared/services/media-service', () => ({
  getMediaService: () => ({
    cancelPendingMediaRequests: state.cancelPending,
    extractFromClickedElement: state.extract,
  }),
}));

vi.mock('@platform/index', () => ({
  getNotificationAdapter: () => ({}),
  notifySafely: state.notify,
}));

vi.mock('@shared/services/language-service', () => ({
  getLanguageService: () => ({ translate: (key: string) => key }),
}));

vi.mock('@shared/error/app-error-reporter', () => ({
  galleryErrorReporter: { critical: vi.fn(), error: vi.fn() },
  mediaErrorReporter: { error: state.error, warn: state.warn },
  normalizeErrorMessage: (error: unknown) => String(error),
}));

vi.mock('@shared/state/signals/gallery.signals', () => ({
  closeGallery: vi.fn(),
  disposeGallerySignals: vi.fn(),
  gallerySignals: { isOpen: false },
  openGallery: state.openGallery,
}));

vi.mock('@shared/utils/events/handlers/keyboard', () => ({ disposeKeyboardDebouncer: vi.fn() }));
vi.mock('@shared/utils/media/ambient-video-coordinator', () => ({
  pauseAmbientVideosForGallery: vi.fn(),
  startAmbientVideoGuard: () => vi.fn(),
}));

import { GalleryApp } from '@features/gallery/gallery-app';

interface DeferredResult {
  readonly promise: Promise<MediaExtractionResult>;
  readonly reject: (reason: unknown) => void;
  readonly resolve: (result: MediaExtractionResult) => void;
}

function deferredResult(): DeferredResult {
  let resolve!: DeferredResult['resolve'];
  let reject!: DeferredResult['reject'];
  const promise = new Promise<MediaExtractionResult>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, reject, resolve };
}

function success(id: string): MediaExtractionResult {
  return {
    success: true,
    clickedIndex: 0,
    mediaItems: [{ id, type: 'image', url: `https://pbs.twimg.com/media/${id}.jpg` }],
  };
}

describe('GalleryApp media-click currentness', () => {
  afterEach(() => clearSettings());
  beforeEach(() => {
    state.setSetting.mockClear();
    registerSettings({ get: () => undefined, set: state.setSetting });
    state.cancelPending.mockClear();
    state.error.mockClear();
    state.extract.mockReset();
    state.handlers = null;
    state.notify.mockClear();
    state.openGallery.mockClear();
    state.warn.mockClear();
    document.documentElement.removeAttribute('data-xeg-gallery-ready');
  });

  it('aborts the previous click and ignores its late success', async () => {
    const first = deferredResult();
    const second = deferredResult();
    const signals: AbortSignal[] = [];
    state.extract.mockImplementation(
      (_element: HTMLElement, options: { signal: AbortSignal }) => {
        signals.push(options.signal);
        return signals.length === 1 ? first.promise : second.promise;
      }
    );
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    expect(document.documentElement.getAttribute('data-xeg-gallery-ready')).toBe('true');

    const firstClick = state.handlers?.onMediaClick(
      document.createElement('img'),
      new MouseEvent('click')
    );
    const secondClick = state.handlers?.onMediaClick(
      document.createElement('img'),
      new MouseEvent('click')
    );

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    second.resolve(success('current'));
    await secondClick;
    first.resolve(success('stale'));
    await firstClick;

    expect(state.openGallery).toHaveBeenCalledTimes(1);
    expect(state.openGallery).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'current' })]), 0);
    await app.cleanup();
    expect(document.documentElement.hasAttribute('data-xeg-gallery-ready')).toBe(false);
  });

  it('ignores stale errors without reporting or notifying', async () => {
    const first = deferredResult();
    const second = deferredResult();
    state.extract.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();

    const firstClick = state.handlers?.onMediaClick(
      document.createElement('img'),
      new MouseEvent('click')
    );
    const secondClick = state.handlers?.onMediaClick(
      document.createElement('img'),
      new MouseEvent('click')
    );
    first.reject(new Error('stale failure'));
    second.resolve(success('current'));
    await Promise.all([firstClick, secondClick]);

    expect(state.error).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
    await app.cleanup();
  });
  it('discloses visible-tile recovery and still opens only the recovered items', async () => {
    const result = { ...success('tile'), metadata: { recoveryScope: 'visible-tile' } };
    state.extract.mockResolvedValue(result);
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    await state.handlers?.onMediaClick(document.createElement('img'), new MouseEvent('click'));
    expect(state.openGallery).toHaveBeenCalledWith(result.mediaItems, 0);
    expect(state.notify).toHaveBeenCalledWith({}, 'msg.gal.partialRecovery.title', 'msg.gal.partialRecovery.body');
    await app.cleanup();
  });

  it.each([
    ['denied', 'msg.err.loadMedia.denied'],
    ['rate-limited', 'msg.err.loadMedia.rateLimited'],
    ['owner-unconfirmed', 'msg.err.loadMedia.ownerUnconfirmed'],
    ['no-media', 'msg.err.loadMedia.noMedia'],
  ] as const)('shows the safe %s extraction diagnosis', async (failureKind, message) => {
    state.extract.mockResolvedValue({ success: false, mediaItems: [], failureKind });
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    await state.handlers?.onMediaClick(document.createElement('img'), new MouseEvent('click'));
    expect(state.notify).toHaveBeenCalledWith({}, 'msg.err.loadMedia.title', message);
    await app.cleanup();
  });

  it.each([
    ['denied', 'msg.err.loadMedia.denied'],
    ['unreadable', 'msg.err.loadMedia.unreadable'],
    ['unsupported-source', 'msg.err.loadMedia.unsupported'],
    ['mismatch', 'msg.err.loadMedia.mismatch'],
    ['transport', 'msg.err.loadMedia.transport'],
  ] as const)(
    'keeps %s diagnosis and offers native-player recovery for a video click', async (failureKind, diagnosis) => {
      state.extract.mockResolvedValue({ success: false, mediaItems: [], failureKind });
      const app = new GalleryApp({ destroy: vi.fn() } as never);
      const video = document.createElement('video');
      try {
        await app.initialize();
        document.body.append(video);
        await state.handlers?.onMediaClick(video, new MouseEvent('click'));
        expect(state.openGallery).not.toHaveBeenCalled();
        expect(state.notify).toHaveBeenCalledExactlyOnceWith(
          {},
          'msg.err.loadMedia.title',
          `${diagnosis} msg.err.loadMedia.nativeVideoRecovery`
        );
      } finally {
        video.remove();
        await app.cleanup();
      }
    }
  );

  it('cancels a held extraction when the user closes, with no stale opening or feedback', async () => {
    const pending = deferredResult();
    state.extract.mockReturnValue(pending.promise);
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    const click = state.handlers?.onMediaClick(document.createElement('video'), new MouseEvent('click'));
    app.close();
    expect(state.extract.mock.calls[0]?.[1]?.signal.aborted).toBe(true);
    pending.resolve(success('late'));
    await click;
    expect(state.openGallery).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
    await app.cleanup();
  });

  it('retires pending extraction at beforeunload before a transport rejection or pagehide', async () => {
    const pending = deferredResult();
    state.extract.mockReturnValue(pending.promise);
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    try {
      const click = state.handlers?.onMediaClick(document.createElement('video'), new MouseEvent('click'));
      window.dispatchEvent(new Event('beforeunload'));
      pending.reject(new Error('Transport closed during navigation'));
      await click;
      expect(state.extract.mock.calls[0]?.[1]?.signal.aborted).toBe(true);
      expect(state.notify).not.toHaveBeenCalled();
      expect(state.openGallery).not.toHaveBeenCalled();
    } finally {
      await app.cleanup();
    }
  });

  it('ignores a result after the URL changes before navigation reconciliation', async () => {
    const priorUrl = location.href;
    const pending = deferredResult();
    state.extract.mockReturnValue(pending.promise);
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    try {
      const click = state.handlers?.onMediaClick(document.createElement('video'), new MouseEvent('click'));
      history.pushState({}, '', '/other/status/999');
      pending.resolve(success('old-page'));
      await click;
      expect(state.notify).not.toHaveBeenCalled();
      expect(state.openGallery).not.toHaveBeenCalled();
    } finally {
      history.replaceState({}, '', priorUrl);
      await app.cleanup();
    }
  });

  it('removes navigation cancellation after extraction settles', async () => {
    state.extract.mockResolvedValue(success('settled'));
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    try {
      await state.handlers?.onMediaClick(document.createElement('img'), new MouseEvent('click'));
      window.dispatchEvent(new Event('beforeunload'));
      expect(state.extract.mock.calls[0]?.[1]?.signal.aborted).toBe(false);
    } finally {
      await app.cleanup();
    }
  });

  it('offers recovery for a bounded unmarked native-video button too', async () => {
    state.extract.mockResolvedValue({ success: false, mediaItems: [], failureKind: 'owner-unconfirmed' });
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    const frame = document.createElement('div');
    frame.innerHTML = '<video poster="https://pbs.twimg.com/amplify_video_thumb/333/img/poster.jpg"></video><button type="button">Play</button>';
    document.body.append(frame);
    const button = frame.querySelector('button');
    if (!button) throw new Error('Missing fixture button');
    await state.handlers?.onMediaClick(button, new MouseEvent('click'));
    expect(state.notify.mock.calls[0]?.[2]).toBe('msg.err.loadMedia.ownerUnconfirmed msg.err.loadMedia.nativeVideoRecovery');
    frame.remove();
    await app.cleanup();
  });

  it('never changes the mode automatically or after synthetic recovery input', async () => {
    state.extract.mockResolvedValue({ success: false, mediaItems: [], failureKind: 'denied' });
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    const video = document.createElement('video');
    document.body.append(video);
    await state.handlers?.onMediaClick(video, new MouseEvent('click'));
    expect(state.setSetting).not.toHaveBeenCalled();
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV', altKey: true, shiftKey: true }));
    expect(state.setSetting).not.toHaveBeenCalled();
    const remove = vi.spyOn(document, 'removeEventListener');
    await app.cleanup();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    video.remove();
  });

  it('ignores extraction completion after cleanup', async () => {
    const pending = deferredResult();
    state.extract.mockReturnValue(pending.promise);
    const app = new GalleryApp({ destroy: vi.fn() } as never);
    await app.initialize();
    const click = state.handlers?.onMediaClick(document.createElement('video'), new MouseEvent('click'));
    await app.cleanup();
    expect(state.extract.mock.calls[0]?.[1]?.signal.aborted).toBe(true);
    pending.resolve(success('after-cleanup'));
    await click;
    expect(state.openGallery).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
  });

});
