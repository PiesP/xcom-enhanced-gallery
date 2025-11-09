/**
 * Test Harness: createAppContainer
 *
 * 목적: 런타임 소스에서 AppContainer 구현을 제거하고, 리팩토링/계약 테스트에서만
 * 사용할 수 있도록 테스트 하네스 경로로 이전합니다.
 *
 * 주의: 이 파일은 테스트 전용입니다. 프로덕션 번들에 포함되지 않습니다.
 */

import { logger } from '@shared/logging/logger';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { registerGalleryRenderer } from '@shared/container/service-accessors';
import { SERVICE_KEYS } from '@/constants';
import { FilenameService } from '@shared/services/file-naming';
import type { MediaItemForFilename, MediaInfoForFilename } from '@shared/types/media.types';
import type { FilenameOptions } from '@shared/services/file-naming';
import type {
  AppContainer,
  CreateContainerOptions,
  ILogger,
  IMediaService,
  IThemeService,
  IVideoService,
  ISettingsService,
  IGalleryApp,
} from '@shared/container/app-container';
import type { AppConfig } from '@/types';

type LegacyServiceMap = Record<string, unknown>;

class LegacyServiceAdapter {
  constructor(private readonly container: AppContainer) {}

  getService<T>(key: string): T {
    logger.warn(`[DEPRECATED] getService('${key}') 사용 중. container.services.* 로 이전하세요.`);

    switch (key) {
      case SERVICE_KEYS.MEDIA_SERVICE:
      case SERVICE_KEYS.MEDIA_EXTRACTION:
        return this.container.services.media as T;
      case SERVICE_KEYS.THEME:
        return this.container.services.theme as T;
      case SERVICE_KEYS.VIDEO_CONTROL:
      case SERVICE_KEYS.VIDEO_STATE:
        return this.container.services.video as T;
      case SERVICE_KEYS.SETTINGS:
        if (!this.container.services.settings) {
          throw new Error(`Lazy service not loaded: ${key}`);
        }
        return this.container.services.settings as T;
      default:
        return CoreServiceRegistry.get<T>(key);
    }
  }
}

function createDefaultConfig(): AppConfig {
  return {
    version: import.meta.env.VITE_VERSION ?? '4.0.0',
    isDevelopment: import.meta.env.DEV,
    debug: import.meta.env.DEV,
    autoStart: true,
    performanceMonitoring: import.meta.env.DEV,
  };
}

class MediaServiceWrapper implements IMediaService {
  constructor(private readonly legacyService: LegacyServiceMap | null) {}

  extractUrls = (element: Element): string[] => {
    if (this.legacyService?.extractUrls) return this.legacyService.extractUrls(element);
    return [];
  };

  generateFilename = (media: unknown, options?: unknown): string => {
    if (this.legacyService?.generateFilename)
      return this.legacyService.generateFilename(media, options);
    return `media_${Date.now()}.jpg`;
  };

  async extractMediaUrls(element: Element): Promise<string[]> {
    return this.extractUrls(element);
  }

  async cleanup(): Promise<void> {
    await this.legacyService?.cleanup?.();
  }
}

class ThemeServiceWrapper implements IThemeService {
  constructor(private readonly legacyService: LegacyServiceMap | null) {}
  getCurrentTheme(): 'light' | 'dark' | 'auto' {
    return this.legacyService?.getCurrentTheme?.() ?? 'auto';
  }
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.legacyService?.setTheme?.(theme);
  }
  cleanup(): void {
    this.legacyService?.cleanup?.();
  }
}

class VideoServiceWrapper implements IVideoService {
  constructor(private readonly legacyService: LegacyServiceMap | null) {}
  play = (): void => {
    this.legacyService?.resumeAll?.();
  };
  pause = (): void => {
    this.legacyService?.pauseAll?.();
  };
  pauseAll(): void {
    this.legacyService?.pauseAll?.();
  }
  resumeAll(): void {
    this.legacyService?.resumeAll?.();
  }
  cleanup(): void {
    this.legacyService?.cleanup?.();
  }
}

class AppContainerImpl implements AppContainer {
  public config: AppConfig;
  public logger: ILogger;
  public services: {
    media: IMediaService;
    theme: IThemeService;
    video: IVideoService;
    settings?: ISettingsService;
  };
  public features: { loadGallery(): Promise<IGalleryApp> };
  public disposed = false;

  private readonly legacyAdapter?: LegacyServiceAdapter;
  private galleryAppCache?: IGalleryApp | undefined;
  private galleryLoadingPromise?: Promise<IGalleryApp> | undefined;

  constructor(config: AppConfig, enableLegacyAdapter = true) {
    this.config = config;
    this.logger = logger;

    const mediaService = new MediaServiceWrapper(this.createMediaService());
    const themeService = new ThemeServiceWrapper(this.createThemeService());
    const videoService = new VideoServiceWrapper(this.createVideoService());
    const settingsService = this.createSettingsService();

    this.services = {
      media: Object.assign(() => Promise.resolve(mediaService), mediaService, {
        cleanup: () => mediaService.cleanup(),
        extractMediaUrls: (element: unknown) => mediaService.extractMediaUrls(element as Element),
        extractFromClickedElement: (element: unknown) =>
          mediaService.extractMediaUrls(element as Element),
      }),
      theme: Object.assign(() => Promise.resolve(themeService), themeService, {
        cleanup: () => themeService.cleanup(),
        getCurrentTheme: () => themeService.getCurrentTheme(),
        setTheme: (theme: 'light' | 'dark' | 'auto') => themeService.setTheme(theme),
      }),
      video: Object.assign(() => Promise.resolve(videoService), videoService, {
        cleanup: () => videoService.cleanup(),
        pauseAll: () => videoService.pauseAll(),
        resumeAll: () => videoService.resumeAll(),
      }),
      settings: Object.assign(() => Promise.resolve(settingsService), settingsService, {
        cleanup: () => settingsService?.cleanup?.(),
        get: (key: string) => settingsService.get(key),
        set: (key: string, value: unknown) => settingsService.set(key, value),
      }),
    };

    this.features = { loadGallery: this.loadGalleryFactory.bind(this) };

    const devLike = import.meta.env.DEV || import.meta.env.MODE === 'test';
    if (enableLegacyAdapter && devLike) {
      this.legacyAdapter = new LegacyServiceAdapter(this);
      const anyGlobal = globalThis as unknown as Record<string, unknown>;
      const LEGACY_ADAPTER_KEY = devLike ? '__XEG_LEGACY_ADAPTER__' : 'XEG_DEV_ONLY';
      anyGlobal[LEGACY_ADAPTER_KEY] = this.legacyAdapter;
    }
  }

  private createMediaService(): LegacyServiceMap {
    return {
      extractUrls: (element: Element) => {
        const images = element.querySelectorAll('img[src*="twimg.com"]');
        const videos = element.querySelectorAll('video');
        const urls: string[] = [];
        images.forEach(img => {
          const src = (img as Element & { src?: string }).src;
          if (typeof src === 'string' && src) urls.push(src);
        });
        videos.forEach(video => {
          const src = (video as Element & { src?: string }).src;
          if (typeof src === 'string' && src) urls.push(src);
        });
        return urls;
      },
      generateFilename: (
        media: MediaItemForFilename | MediaInfoForFilename,
        options?: FilenameOptions
      ) => {
        const filenameService = new FilenameService();
        return filenameService.generateMediaFilename(media, options);
      },
      optimizeUrl: (url: string) => url.replace(/&name=\w+/, '&name=orig'),
      loadMediaInBackground: async (urls: string[]) =>
        Promise.resolve(urls.map(url => ({ url, loaded: true }))),
    };
  }

  private createThemeService(): LegacyServiceMap {
    return {
      apply: () => logger.debug('Theme service - apply'),
      cleanup: () => logger.debug('Theme service - cleanup'),
    };
  }

  private createVideoService(): LegacyServiceMap {
    return {
      pauseAll: () => logger.debug('Video service - pauseAll'),
      resumeAll: () => logger.debug('Video service - resumeAll'),
      cleanup: () => logger.debug('Video service - cleanup'),
    };
  }

  private createSettingsService(): ISettingsService {
    return {
      getSettings: () => {
        logger.debug('Settings service - getSettings called');
        return {};
      },
      updateSettings: (settings: Record<string, unknown>) => {
        logger.debug('Settings service - updateSettings:', settings);
      },
      get: <T = unknown>(key: string): T => {
        logger.debug(`Settings service - get: ${key}`);
        return null as T;
      },
      set: async <T = unknown>(key: string, value: T): Promise<void> => {
        logger.debug(`Settings service - set: ${key} = ${value}`);
      },
      cleanup: () => logger.debug('Settings service - cleanup'),
    };
  }

  private async loadGalleryFactory(): Promise<IGalleryApp> {
    if (this.galleryAppCache) return this.galleryAppCache;
    if (this.galleryLoadingPromise) return this.galleryLoadingPromise;

    this.galleryLoadingPromise = this.createGalleryApp();
    try {
      this.galleryAppCache = await this.galleryLoadingPromise;
      return this.galleryAppCache;
    } finally {
      this.galleryLoadingPromise = undefined;
    }
  }

  private async createGalleryApp(): Promise<IGalleryApp> {
    try {
      try {
        const RENDERER_IMPORT_TIMEBOX_MS = 800;
        const galleryRendererModule = await Promise.race([
          import('@/features/gallery/GalleryRenderer'),
          new Promise<undefined>(resolve =>
            globalThis.setTimeout?.(() => resolve(undefined), RENDERER_IMPORT_TIMEBOX_MS)
          ),
        ]);
        if ((galleryRendererModule as any)?.GalleryRenderer) {
          registerGalleryRenderer(new (galleryRendererModule as any).GalleryRenderer());
        } else {
          this.logger.warn('GalleryRenderer import timed out; skip registration for now');
        }
      } catch (regErr) {
        this.logger.warn('GalleryRenderer registration skipped due to error:', regErr);
      }

      const APP_IMPORT_TIMEBOX_MS = 1000;
      let galleryApp: IGalleryApp;
      try {
        const galleryAppModule = await Promise.race([
          import('@/features/gallery/GalleryApp'),
          new Promise<undefined>(resolve =>
            globalThis.setTimeout?.(() => resolve(undefined), APP_IMPORT_TIMEBOX_MS)
          ),
        ]);

        if ((galleryAppModule as any)?.GalleryApp) {
          galleryApp = new (galleryAppModule as any).GalleryApp();
        } else {
          this.logger.warn('GalleryApp import timed out; returning minimal stub');
          galleryApp = {
            async initialize() {},
            async cleanup() {},
          } as IGalleryApp;
        }
      } catch (appErr) {
        this.logger.warn('GalleryApp import failed; returning minimal stub:', appErr);
        galleryApp = {
          async initialize() {},
          async cleanup() {},
        } as IGalleryApp;
      }

      try {
        const TIMEBOX_MS = 1500;
        await Promise.race([
          galleryApp.initialize(),
          new Promise<void>(resolve => globalThis.setTimeout?.(resolve, TIMEBOX_MS)),
        ]);
      } catch (initError) {
        this.logger.warn('Gallery app initialization error (continuing):', initError);
      }

      return galleryApp;
    } catch (error) {
      this.logger.error('Gallery app loading failed:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    this.logger.info('AppContainer cleanup started');
    await Promise.all([
      this.services.media.cleanup(),
      this.services.theme.cleanup(),
      this.services.video.cleanup(),
      this.services.settings?.cleanup(),
    ]);
    if (this.galleryAppCache) {
      await this.galleryAppCache.cleanup();
      this.galleryAppCache = undefined;
    }
    this.galleryLoadingPromise = undefined;
    if (this.legacyAdapter && import.meta.env.DEV) {
      const anyGlobal = globalThis as unknown as Record<string, unknown>;
      const LEGACY_ADAPTER_KEY = import.meta.env.DEV ? '__XEG_LEGACY_ADAPTER__' : 'XEG_DEV_ONLY';
      if (LEGACY_ADAPTER_KEY in anyGlobal) delete anyGlobal[LEGACY_ADAPTER_KEY];
    }
    this.disposed = true;
    this.logger.info('AppContainer cleanup completed');
  }
}

export async function createAppContainer(
  options: CreateContainerOptions = {}
): Promise<AppContainer> {
  const config = { ...createDefaultConfig(), ...options.config };
  const enableLegacyAdapter = options.enableLegacyAdapter ?? import.meta.env.DEV;
  logger.info('Creating AppContainer [TEST HARNESS]', { config, enableLegacyAdapter });
  const container = new AppContainerImpl(config, enableLegacyAdapter);
  logger.info('AppContainer created successfully [TEST HARNESS]');
  return container;
}

export function installLegacyAdapter(container: AppContainer): void {
  if (!(import.meta.env.DEV || import.meta.env.MODE === 'test')) return;
  const adapter = new LegacyServiceAdapter(container);
  const anyGlobal = globalThis as unknown as Record<string, unknown>;
  const GET_OVERRIDE_KEY =
    import.meta.env.DEV || import.meta.env.MODE === 'test'
      ? '__XEG_GET_SERVICE_OVERRIDE__'
      : 'XEG_DEV_ONLY';
  anyGlobal[GET_OVERRIDE_KEY] = adapter.getService.bind(adapter);
}
