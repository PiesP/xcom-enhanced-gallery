/**
 * @fileoverview Shared helper to import the main entry with mocks for Vitest suites.
 */

import * as solid from 'solid-js';
import { vi, type SpyInstance } from 'vitest';

export interface ImportMainWithMocksOptions {
  /** When false, uses the real Solid bootstrap module instead of the mocked handle. */
  mockSolidBootstrap?: boolean;
}

export interface ImportMainWithMocksResult {
  main: { start: () => Promise<void>; cleanup: () => Promise<void> };
  addEventSpy: SpyInstance;
  removeEventSpy: SpyInstance;
  solidBootstrap?: {
    startMock: ReturnType<typeof vi.fn>;
    disposeMock: ReturnType<typeof vi.fn>;
  };
}

export async function importMainWithMocks(
  options: ImportMainWithMocksOptions = {}
): Promise<ImportMainWithMocksResult> {
  vi.resetModules();

  const { resetFeatureFlagOverrides } = await import('@/shared/config/feature-flags');
  resetFeatureFlagOverrides();

  const solidBootstrapDisposeMock = vi.fn(async () => {
    /* noop */
  });
  const solidBootstrapStartMock = vi.fn(async () => ({
    dispose: solidBootstrapDisposeMock,
  }));

  vi.doMock('@/shared/external/vendors', () => {
    const calls = { initialize: 0 };
    const legacyPreact = {
      getPreact: vi.fn(() => ({
        h: vi.fn((type, props, ...children) => ({
          type,
          props,
          children,
        })),
        render: vi.fn(),
      })),
      getPreactHooks: vi.fn(() => ({})),
      getPreactSignals: vi.fn(() => ({})),
      getPreactCompat: vi.fn(() => ({})),
    };
    return {
      // fflate removed - using native ZIP implementation
      legacyPreact,
      getNativeDownload: vi.fn(() => ({})),
      getSolidCore: vi.fn(() => ({
        createComponent: vi.fn((Component: unknown, componentProps: unknown) => ({
          Component,
          componentProps,
        })),
        createSignal: solid.createSignal,
        createEffect: solid.createEffect,
        createMemo: solid.createMemo,
        createRoot: solid.createRoot,
        createComputed: solid.createComputed,
        mergeProps: solid.mergeProps,
        splitProps: solid.splitProps,
        onCleanup: solid.onCleanup,
        batch: solid.batch,
        untrack: solid.untrack,
        createContext: solid.createContext,
        useContext: solid.useContext,
      })),
      getSolidWeb: vi.fn(() => ({
        render: vi.fn((_componentFactory: () => unknown, _container: HTMLElement) => void 0),
      })),
      initializeVendors: vi.fn(async () => {
        calls.initialize += 1;
      }),
      cleanupVendors: vi.fn(async () => {}),
      __calls: calls,
    };
  });

  vi.mock('@/shared/services/core-services', async importOriginal => {
    const actual: any = await importOriginal();
    const { CoreService } = await import('@/shared/services/ServiceManager');
    const core = CoreService.getInstance();
    const dummy = { initialize: vi.fn(async () => {}), cleanup: vi.fn(async () => {}) } as const;
    return {
      ...actual,
      registerCoreServices: vi.fn(async () => {
        core.register('video.control', { ...dummy, name: 'video.control' });
        core.register('media.extraction', { ...dummy, name: 'media.extraction' });
        core.register('toast.controller', { ...dummy, name: 'toast.controller' });
      }),
      ServiceDiagnostics: { diagnoseServiceManager: vi.fn(async () => {}) },
    };
  });

  vi.doMock('@/features/settings/services/SettingsService', () => ({
    SettingsService: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
    },
  }));
  vi.doMock('@/features/settings/services/TwitterTokenExtractor', () => ({
    TwitterTokenExtractor: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
    },
  }));

  vi.doMock('@/features/gallery/GalleryRenderer', () => ({
    GalleryRenderer: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
      setOnCloseCallback = vi.fn();
    },
  }));
  vi.doMock('@/features/gallery/GalleryApp', () => ({
    GalleryApp: class {
      initialize = vi.fn(async () => {});
      cleanup = vi.fn(async () => {});
    },
  }));

  if (options.mockSolidBootstrap !== false) {
    vi.doMock('@/bootstrap/solid-bootstrap', () => ({
      startSolidBootstrap: solidBootstrapStartMock,
    }));
  }

  try {
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
  } catch {
    /* ignore jsdom override failure */
  }

  const addEventSpy = vi.spyOn(window, 'addEventListener');
  const removeEventSpy = vi.spyOn(window, 'removeEventListener');

  const { CoreService } = await import('@/shared/services/ServiceManager');
  const core = CoreService.getInstance();
  const dummy = { initialize: vi.fn(async () => {}), cleanup: vi.fn(async () => {}) } as const;
  core.register('video.control', { ...dummy, name: 'video.control' });
  core.register('media.extraction', { ...dummy, name: 'media.extraction' });
  core.register('toast.controller', { ...dummy, name: 'toast.controller' });

  const mainModule = await import('@/main');
  const main = mainModule.default as { start: () => Promise<void>; cleanup: () => Promise<void> };

  return {
    main,
    addEventSpy,
    removeEventSpy,
    solidBootstrap:
      options.mockSolidBootstrap === false
        ? undefined
        : {
            startMock: solidBootstrapStartMock,
            disposeMock: solidBootstrapDisposeMock,
          },
  };
}
