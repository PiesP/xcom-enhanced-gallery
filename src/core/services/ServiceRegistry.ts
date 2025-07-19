/**
 * @fileoverview Service Registry
 * @version 1.0.0
 *
 * 모든 서비스를 등록하고 설정하는 중앙 레지스트리
 */

import { SERVICE_KEYS } from '../../constants';
import type { ServiceTypeMapping } from '../types/services.types';
import { ServiceManager } from './ServiceManager';

// Type-safe service keys
export type ServiceKey = keyof ServiceTypeMapping;

// Create service manager instance
const serviceManager = ServiceManager.getInstance();

/**
 * 모든 서비스를 등록합니다
 */
export async function registerAllServices(): Promise<void> {
  // Core Services
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, {
    factory: async () => {
      const { BulkDownloadService } = await import('./BulkDownloadService');
      return BulkDownloadService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Gallery Services
  serviceManager.register(SERVICE_KEYS.GALLERY_RENDERER, {
    factory: async () => {
      const { GalleryRenderer } = await import('../../features/gallery/GalleryRenderer');
      return new GalleryRenderer();
    },
    singleton: true,
    lazy: true,
  });

  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, {
    factory: async () => {
      const { DownloadService } = await import('../../features/gallery/services/DownloadService');
      return DownloadService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Media Services (Simplified)
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, {
    factory: async () => {
      const { MediaExtractionService } = await import(
        '../../features/media/extraction/services/MediaExtractor'
      );
      return new MediaExtractionService();
    },
    singleton: true,
    lazy: true,
  });

  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, {
    factory: async () => {
      const { FilenameService } = await import('../../infrastructure/media');
      return FilenameService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Theme Service
  serviceManager.register(SERVICE_KEYS.AUTO_THEME, {
    factory: async () => {
      const { ThemeService } = await import('./ThemeService');
      return ThemeService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Video Services
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, {
    factory: async () => {
      const { VideoControlService } = await import('./media/VideoControlService');
      return VideoControlService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, {
    factory: async () => {
      const { VideoControlService } = await import('./media/VideoControlService');
      return VideoControlService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Toast Controller
  serviceManager.register(SERVICE_KEYS.TOAST_CONTROLLER, {
    factory: async () => {
      const { ToastController } = await import('./ToastController');
      return new ToastController();
    },
    singleton: true,
    lazy: true,
  });

  // Settings Manager
  serviceManager.register(SERVICE_KEYS.SETTINGS_MANAGER, {
    factory: async () => {
      const { SettingsService } = await import('../../features/settings/services/SettingsService');
      return new SettingsService();
    },
    singleton: true,
    lazy: true,
  });

  // Twitter Token Extractor
  serviceManager.register(SERVICE_KEYS.TWITTER_TOKEN_EXTRACTOR, {
    factory: async () => {
      const { TwitterTokenExtractor } = await import(
        '../../features/settings/services/TwitterTokenExtractor'
      );
      return new TwitterTokenExtractor();
    },
    singleton: true,
    lazy: true,
  });
}

/**
 * 타입 안전한 서비스 접근을 위한 헬퍼 함수
 */
export async function getService<K extends ServiceKey>(key: K): Promise<ServiceTypeMapping[K]> {
  return serviceManager.get(key);
}
