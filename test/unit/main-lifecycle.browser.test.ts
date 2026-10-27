// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const state = vi.hoisted(() => ({
  initializeCoreBaseServices: vi.fn(),
  mediaDestroy: vi.fn(),
  mediaRefresh: vi.fn(),
  navigationCallback: null as ((url: string) => void) | null,
  settingsPrepareForRestart: vi.fn(),
  themeDestroy: vi.fn(),
  galleryClose: vi.fn(),
}));

vi.mock('@bootstrap/gallery-init', () => ({
  initializeCoreBaseServices: state.initializeCoreBaseServices,
  initializeGalleryApp: vi.fn(async () => ({
    initialize: vi.fn(async () => undefined),
    cleanup: vi.fn(async () => undefined),
    resumeEarlyMediaClick: vi.fn(async () => undefined),
    close: state.galleryClose,
  })),
  initializeGalleryServices: vi.fn(),
}));

vi.mock('@shared/services/media-service', () => ({
  getMediaService: () => ({
    destroy: state.mediaDestroy,
    isInitialized: () => true,
    refreshApiMetadata: state.mediaRefresh,
  }),
}));

vi.mock('@shared/services/theme-service', () => ({
  getThemeService: () => ({ destroy: state.themeDestroy, isInitialized: () => true }),
}));

vi.mock('@features/settings/services/settings-service', () => ({
  getSettingsService: () => ({ prepareForRestart: state.settingsPrepareForRestart }),
}));

vi.mock('@shared/services/event-manager', () => ({
  getEventManager: () => ({
    addEventListener: vi.fn(),
    getListenerStatus: () => 0,
  }),
}));

vi.mock('@shared/error/error-handler', () => ({
  getGlobalErrorHandler: () => ({ destroy: vi.fn(), initialize: vi.fn() }),
}));

vi.mock('@shared/container/settings-registry', () => ({ clearSettings: vi.fn() }));
vi.mock('@shared/devtools/dev-namespace', () => ({ mutateDevNamespace: vi.fn() }));
vi.mock('@shared/utils/url/history-navigation', () => ({
  installHistoryNavigationFallback: vi.fn((callback: (url: string) => void) => {
    state.navigationCallback = callback;
    return vi.fn();
  }),
}));
vi.mock('@shared/error/app-error-reporter', () => ({
  bootstrapErrorReporter: { error: vi.fn() },
  galleryErrorReporter: { error: vi.fn() },
}));

import { cleanup, startApplication } from '../../src/main';

function dispatchNavigation(url: string): void {
  if (typeof navigation === 'undefined') throw new Error('Chromium Navigation API unavailable');
  const event = new Event('navigate') as Event & { destination?: { url: string } };
  event.destination = { url };
  navigation.dispatchEvent(event);
}

describe('application media-service lifecycle', () => {
  beforeEach(() => {
    state.initializeCoreBaseServices.mockClear();
    state.mediaDestroy.mockClear();
    state.mediaRefresh.mockClear();
    state.settingsPrepareForRestart.mockClear();
    state.themeDestroy.mockClear();
    state.galleryClose.mockClear();
  });

  it('destroys global media resources on cleanup and initializes them again after restart', async () => {
    await startApplication();
    expect(state.initializeCoreBaseServices).toHaveBeenCalledTimes(1);

    await cleanup();
    expect(state.mediaDestroy).toHaveBeenCalledTimes(1);
    expect(state.settingsPrepareForRestart).toHaveBeenCalledTimes(1);

    await startApplication();
    expect(state.initializeCoreBaseServices).toHaveBeenCalledTimes(2);
    await cleanup();
  });

  it('invalidates API metadata on every accepted SPA route signal, including the same URL', async () => {
    await startApplication();
    dispatchNavigation('https://x.com/user/status/123');
    dispatchNavigation('https://x.com/user/status/123');
    expect(state.mediaRefresh).toHaveBeenCalledTimes(2);
    await cleanup();
  });

  it('retires gallery click and modal intent on allowed SPA navigation in an initialized app', async () => {
    vi.stubEnv('MODE', 'development');
    // Browser ESM keeps the first import's test-mode constant. A fresh same-origin
    // module URL lets this case exercise the development-mode gallery lifetime.
    const moduleUrl = '/src/main.ts?browser-test=gallery-intent';
    const application = (await import(
      /* @vite-ignore */ moduleUrl
    )) as typeof import('../../src/main');
    try {
      await application.startApplication();
      dispatchNavigation('https://x.com/user/status/123');
      dispatchNavigation('https://x.com/user/status/456');
      expect(state.galleryClose).toHaveBeenCalledTimes(2);
    } finally {
      await application.cleanup();
      vi.unstubAllEnvs();
    }
  });
});
