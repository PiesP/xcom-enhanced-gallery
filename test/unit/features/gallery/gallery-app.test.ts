// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaExtractionResult } from '@shared/types/media.types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type MediaClickHandler = (element: HTMLElement, event: MouseEvent) => Promise<void>;

const state = vi.hoisted(() => ({
  cancelPending: vi.fn(),
  error: vi.fn(),
  extract: vi.fn(),
  handlers: null as { onMediaClick: MediaClickHandler; onGalleryClose: () => void } | null,
  notify: vi.fn(),
  openGallery: vi.fn(),
  warn: vi.fn(),
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
  beforeEach(() => {
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
});
