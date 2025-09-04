/**
 * @fileoverview App Container Factory - 타입 안전한 의존성 주입 컨테이너 생성
 * @description CoreService를 대체하는 명시적 의존성 주입 컨테이너
 */

import { logger } from '@shared/logging/logger';
import { CoreService, getService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
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
} from './AppContainer';
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
        // Fallback to legacy CoreService
        return getService<T>(key);
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

  async extractMediaUrls(element: HTMLElement): Promise<string[]> {
    if (this.legacyService?.extractMediaUrls) {
      return this.legacyService.extractMediaUrls(element);
    }
    return [];
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

  private readonly legacyAdapter?: LegacyServiceAdapter;
  private galleryAppCache?: IGalleryApp | undefined;

  constructor(config: AppConfig, enableLegacyAdapter = true) {
    this.config = config;
    this.logger = logger;

    // 기존 CoreService에서 서비스들을 가져와서 래핑
    const coreService = CoreService.getInstance();

    this.services = {
      media: new MediaServiceWrapper(coreService.tryGet(SERVICE_KEYS.MEDIA_SERVICE)),
      theme: new ThemeServiceWrapper(coreService.tryGet(SERVICE_KEYS.THEME)),
      toast: new ToastServiceWrapper(coreService.tryGet(SERVICE_KEYS.TOAST)),
      video: new VideoServiceWrapper(coreService.tryGet(SERVICE_KEYS.VIDEO_CONTROL)),
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

  private async loadGalleryFactory(): Promise<IGalleryApp> {
    if (this.galleryAppCache) {
      return this.galleryAppCache;
    }

    try {
      // Gallery Renderer 서비스 등록 (갤러리 앱에 필요)
      const galleryRendererModule = await import('../../features/gallery/GalleryRenderer');
      const coreService = CoreService.getInstance();
      coreService.register(
        SERVICE_KEYS.GALLERY_RENDERER,
        new galleryRendererModule.GalleryRenderer()
      );

      // 동적 import로 갤러리 앱 로드 (상대 경로 사용)
      const galleryAppModule = await import('../../features/gallery/GalleryApp');
      const galleryApp = new galleryAppModule.GalleryApp();
      await galleryApp.initialize();

      this.galleryAppCache = galleryApp;
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

    // Legacy adapter 정리
    if (this.legacyAdapter && (globalThis as LegacyGlobal).__XEG_LEGACY_ADAPTER__) {
      delete (globalThis as LegacyGlobal).__XEG_LEGACY_ADAPTER__;
    }

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
