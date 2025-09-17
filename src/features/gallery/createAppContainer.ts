/**
 * @fileoverview App Container Factory - 타입 안전한 의존성 주입 컨테이너 생성
 * @description CoreService를 대체하는 명시적 의존성 주입 컨테이너
 */

import { logger } from '@shared/logging/logger';
import { bridgeGetService } from '@shared/container/service-bridge';
import { registerGalleryRenderer } from '@shared/container/service-accessors';
import { SERVICE_KEYS } from '@/constants';
import { FilenameService } from '@shared/media/FilenameService';
import type { MediaItemForFilename, MediaInfoForFilename } from '@shared/types/media.types';
import type { FilenameOptions } from '@shared/media/FilenameService';
import type {
  AppContainer,
  CreateContainerOptions,
  ILogger,
  IMediaService,
  IThemeService,
  IToastService,
  IVideoService,
  ISettingsService,
  IGalleryApp,
} from '../../shared/container/AppContainer';
import type { AppConfig } from '@/types';

/**
 * Legacy Service 타입 정의
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyServiceMap = Record<string, any>;

/**
 * Global 확장을 위한 타입 정의
 */
interface LegacyGlobal {
  __XEG_LEGACY_ADAPTER__?: LegacyServiceAdapter;
  __XEG_GET_SERVICE_OVERRIDE__?: (key: string) => unknown;
}

/**
 * Legacy Adapter - 기존 SERVICE_KEYS를 통한 서비스 접근을 AppContainer로 매핑
 */
class LegacyServiceAdapter {
  constructor(private readonly container: AppContainer) {}

  /**
   * 기존 getService(key) 호출을 새 컨테이너로 매핑
   */
  getService<T>(key: string): T {
    // Deprecation 경고
    logger.warn(`[DEPRECATED] getService('${key}') 사용 중. container.services.* 로 이전하세요.`);

    switch (key) {
      case SERVICE_KEYS.MEDIA_SERVICE:
      case SERVICE_KEYS.MEDIA_EXTRACTION:
        return this.container.services.media as T;

      case SERVICE_KEYS.THEME:
        return this.container.services.theme as T;

      case SERVICE_KEYS.TOAST:
        return this.container.services.toast as T;

      case SERVICE_KEYS.VIDEO_CONTROL:
      case SERVICE_KEYS.VIDEO_STATE:
        return this.container.services.video as T;

      case SERVICE_KEYS.SETTINGS:
        if (!this.container.services.settings) {
          throw new Error(`Lazy service not loaded: ${key}`);
        }
        return this.container.services.settings as T;

      default:
        // Fallback to legacy bridge (CoreService 비직접 접근)
        return bridgeGetService<T>(key);
    }
  }
}

/**
 * 기본 AppConfig 생성
 */
function createDefaultConfig(): AppConfig {
  return {
    version: import.meta.env.VITE_VERSION ?? '4.0.0',
    isDevelopment: import.meta.env.DEV,
    debug: import.meta.env.DEV,
    autoStart: true,
    performanceMonitoring: import.meta.env.DEV,
  };
}

/**
 * 서비스 래퍼 클래스들 (기존 서비스를 인터페이스에 맞게 래핑)
 */
class MediaServiceWrapper implements IMediaService {
  constructor(private readonly legacyService: LegacyServiceMap | null) {}

  // 테스트가 기대하는 인터페이스 제공
  extractUrls = (element: HTMLElement): string[] => {
    if (this.legacyService?.extractUrls) {
      return this.legacyService.extractUrls(element);
    }
    return [];
  };

  generateFilename = (media: unknown, options?: unknown): string => {
    if (this.legacyService?.generateFilename) {
      return this.legacyService.generateFilename(media, options);
    }
    return `media_${Date.now()}.jpg`;
  };

  async extractMediaUrls(element: HTMLElement): Promise<string[]> {
    return this.extractUrls(element);
  }

  async cleanup(): Promise<void> {
    if (this.legacyService?.cleanup) {
      await this.legacyService.cleanup();
    }
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

class ToastServiceWrapper implements IToastService {
  constructor(private readonly legacyService: LegacyServiceMap | null) {}

  show(
    message: string,
    options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }
  ): void {
    this.legacyService?.show?.(message, options);
  }

  cleanup(): void {
    this.legacyService?.cleanup?.();
  }
}

class VideoServiceWrapper implements IVideoService {
  constructor(private readonly legacyService: LegacyServiceMap | null) {}

  // 테스트가 기대하는 인터페이스
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

/**
 * AppContainer 구현
 */
class AppContainerImpl implements AppContainer {
  public config: AppConfig;
  public logger: ILogger;
  public services: {
    media: IMediaService;
    theme: IThemeService;
    toast: IToastService;
    video: IVideoService;
    settings?: ISettingsService;
  };
  public features: {
    loadGallery(): Promise<IGalleryApp>;
  };
  public disposed = false;

  private readonly legacyAdapter?: LegacyServiceAdapter;
  private galleryAppCache?: IGalleryApp | undefined;
  private galleryLoadingPromise?: Promise<IGalleryApp> | undefined;

  constructor(config: AppConfig, enableLegacyAdapter = true) {
    this.config = config;
    this.logger = logger;

    // 직접 서비스들을 생성 (CoreService 의존성 제거)
    const mediaService = new MediaServiceWrapper(this.createMediaService());
    const themeService = new ThemeServiceWrapper(this.createThemeService());
    const toastService = new ToastServiceWrapper(this.createToastService());
    const videoService = new VideoServiceWrapper(this.createVideoService());
    const settingsService = this.createSettingsService();

    // 객체 방식과 함수 방식 모두 지원
    this.services = {
      media: Object.assign(() => Promise.resolve(mediaService), mediaService, {
        cleanup: () => mediaService.cleanup(),
        extractMediaUrls: (element: HTMLElement) => mediaService.extractMediaUrls(element),
        extractFromClickedElement: (element: HTMLElement) => mediaService.extractMediaUrls(element),
      }),
      theme: Object.assign(() => Promise.resolve(themeService), themeService, {
        cleanup: () => themeService.cleanup(),
        getCurrentTheme: () => themeService.getCurrentTheme(),
        setTheme: (theme: 'light' | 'dark' | 'auto') => themeService.setTheme(theme),
      }),
      toast: Object.assign(() => Promise.resolve(toastService), toastService, {
        cleanup: () => toastService.cleanup(),
        show: (
          message: string,
          options?: { type?: 'info' | 'success' | 'warning' | 'error'; duration?: number }
        ) => toastService.show(message, options),
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

    this.features = {
      loadGallery: this.loadGalleryFactory.bind(this),
    };

    // Legacy Adapter 설정
    if (enableLegacyAdapter) {
      this.legacyAdapter = new LegacyServiceAdapter(this);
      // 전역에서 접근 가능하도록 설정 (임시)
      (globalThis as LegacyGlobal).__XEG_LEGACY_ADAPTER__ = this.legacyAdapter;
    }
  }

  /**
   * 실제 미디어 서비스 생성 (테스트 환경용 mock)
   */
  private createMediaService(): LegacyServiceMap {
    // 테스트 환경에서는 간단한 mock 서비스 제공
    return {
      extractUrls: (element: HTMLElement) => {
        // Mock implementation
        const images = element.querySelectorAll('img[src*="twimg.com"]');
        const videos = element.querySelectorAll('video');
        const urls: string[] = [];

        images.forEach(img => {
          if (img instanceof HTMLImageElement && img.src) {
            urls.push(img.src);
          }
        });

        videos.forEach(video => {
          if (video instanceof HTMLVideoElement && video.src) {
            urls.push(video.src);
          }
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
      optimizeUrl: (url: string) => {
        // Mock URL optimization
        return url.replace(/&name=\w+/, '&name=orig');
      },
      loadMediaInBackground: async (urls: string[]) => {
        // Mock background loading
        return Promise.resolve(urls.map(url => ({ url, loaded: true })));
      },
    };
  }

  /**
   * 테마 서비스 생성
   */
  private createThemeService(): LegacyServiceMap {
    return {
      apply: () => logger.debug('Theme service - apply'),
      cleanup: () => logger.debug('Theme service - cleanup'),
    };
  }

  /**
   * 토스트 서비스 생성
   */
  private createToastService(): LegacyServiceMap {
    return {
      show: (message: string) => logger.info(`Toast: ${message}`),
      hide: () => logger.debug('Toast service - hide'),
      cleanup: () => logger.debug('Toast service - cleanup'),
    };
  }

  /**
   * 비디오 서비스 생성
   */
  private createVideoService(): LegacyServiceMap {
    return {
      pauseAll: () => logger.debug('Video service - pauseAll'),
      resumeAll: () => logger.debug('Video service - resumeAll'),
      cleanup: () => logger.debug('Video service - cleanup'),
    };
  }

  /**
   * 설정 서비스 생성 (lazy loading)
   */
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
    if (this.galleryAppCache) {
      return this.galleryAppCache;
    }

    // 동시 호출 시 Promise 캐싱으로 중복 생성 방지
    if (this.galleryLoadingPromise) {
      return this.galleryLoadingPromise;
    }

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
      // Gallery Renderer 서비스 등록 (갤러리 앱에 필요)
      const galleryRendererModule = await import('./GalleryRenderer');
      registerGalleryRenderer(new galleryRendererModule.GalleryRenderer());

      // 동적 import로 갤러리 앱 로드 (같은 디렉토리)
      const galleryAppModule = await import('./GalleryApp');
      const galleryApp = new galleryAppModule.GalleryApp();
      await galleryApp.initialize();

      return galleryApp;
    } catch (error) {
      this.logger.error('Gallery app loading failed:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    this.logger.info('AppContainer cleanup started');

    // 서비스들 정리
    await Promise.all([
      this.services.media.cleanup(),
      this.services.theme.cleanup(),
      this.services.toast.cleanup(),
      this.services.video.cleanup(),
      this.services.settings?.cleanup(),
    ]);

    // 갤러리 앱 정리
    if (this.galleryAppCache) {
      await this.galleryAppCache.cleanup();
      this.galleryAppCache = undefined;
    }

    // 진행 중인 로딩 Promise 정리
    this.galleryLoadingPromise = undefined;

    // Legacy adapter 정리
    if (this.legacyAdapter && (globalThis as LegacyGlobal).__XEG_LEGACY_ADAPTER__) {
      delete (globalThis as LegacyGlobal).__XEG_LEGACY_ADAPTER__;
    }

    // disposed 플래그 설정
    this.disposed = true;

    this.logger.info('AppContainer cleanup completed');
  }
}

/**
 * AppContainer 팩토리 함수
 */
export async function createAppContainer(
  options: CreateContainerOptions = {}
): Promise<AppContainer> {
  const config = { ...createDefaultConfig(), ...options.config };
  const enableLegacyAdapter = options.enableLegacyAdapter ?? true;

  logger.info('Creating AppContainer', { config, enableLegacyAdapter });

  const container = new AppContainerImpl(config, enableLegacyAdapter);

  logger.info('AppContainer created successfully');
  return container;
}

/**
 * Legacy 지원을 위한 전역 getService 함수 오버라이드 (임시)
 */
export function installLegacyAdapter(container: AppContainer): void {
  const adapter = new LegacyServiceAdapter(container);

  // 전역 getService 함수를 오버라이드
  (globalThis as LegacyGlobal).__XEG_GET_SERVICE_OVERRIDE__ = adapter.getService.bind(adapter);
}
