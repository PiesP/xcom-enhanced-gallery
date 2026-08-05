// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  initializeCoreBaseServices: vi.fn(),
  mediaDestroy: vi.fn(),
  themeDestroy: vi.fn(),
}));

vi.mock('@bootstrap/gallery-init', () => ({
  initializeCoreBaseServices: state.initializeCoreBaseServices,
  initializeGalleryApp: vi.fn(),
  initializeGalleryServices: vi.fn(),
}));

vi.mock('@shared/services/media-service', () => ({
  getMediaService: () => ({ destroy: state.mediaDestroy, isInitialized: () => true }),
}));

vi.mock('@shared/services/theme-service', () => ({
  getThemeService: () => ({ destroy: state.themeDestroy, isInitialized: () => true }),
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
  installHistoryNavigationFallback: vi.fn(),
}));
vi.mock('@shared/error/app-error-reporter', () => ({
  bootstrapErrorReporter: { error: vi.fn() },
  galleryErrorReporter: { error: vi.fn() },
}));

import { cleanup, startApplication } from '../../src/main';

describe('application media-service lifecycle', () => {
  beforeEach(() => {
    state.initializeCoreBaseServices.mockClear();
    state.mediaDestroy.mockClear();
    state.themeDestroy.mockClear();
  });

  it('destroys global media resources on cleanup and initializes them again after restart', async () => {
    await startApplication();
    expect(state.initializeCoreBaseServices).toHaveBeenCalledTimes(1);

    await cleanup();
    expect(state.mediaDestroy).toHaveBeenCalledTimes(1);

    await startApplication();
    expect(state.initializeCoreBaseServices).toHaveBeenCalledTimes(2);
    await cleanup();
  });
});
