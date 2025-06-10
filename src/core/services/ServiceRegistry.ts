/**
 * @fileoverview Service Registry
 * @version 1.0.0
 *
 * 모든 서비스를 등록하고 설정하는 중앙 레지스트리
 */

import type { ServiceTypeMapping } from '@core/types/services.types';
import { serviceManager } from './ServiceManager';

/**
 * 서비스 키 상수
 */
export const SERVICE_KEYS = {
  // Core Services
  BULK_DOWNLOAD: 'core.bulkDownload',

  // Gallery Services
  GALLERY_RENDERER: 'gallery.renderer',
  GALLERY_DOWNLOAD: 'gallery.download',

  // Media Services
  MEDIA_EXTRACTION: 'media.extraction',
  MEDIA_FILENAME: 'media.filename',

  // Scroll Services
  PAGE_SCROLL_LOCK: 'scroll.pageLock',
  GALLERY_SCROLL: 'scroll.gallery',

  // Theme Service
  AUTO_THEME: 'theme.auto',

  // Video Services
  VIDEO_STATE: 'video.state',
  VIDEO_CONTROL: 'video.control',
} as const;

// Type-safe service keys
export type ServiceKey = keyof ServiceTypeMapping;

/**
 * 모든 서비스를 등록합니다
 */
export function registerAllServices(): void {
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
      const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
      return new GalleryRenderer();
    },
    singleton: true,
    lazy: true,
  });

  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, {
    factory: async () => {
      const { GalleryDownloadService } = await import(
        '@features/gallery/services/GalleryDownloadService'
      );
      return GalleryDownloadService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Media Services
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, {
    factory: async () => {
      const { EnhancedMediaExtractionService } = await import(
        '@features/media/services/EnhancedMediaExtractionService'
      );
      return EnhancedMediaExtractionService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, {
    factory: async () => {
      const { MediaFilenameService } = await import('@shared/utils/media/FilenameService');
      return MediaFilenameService.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Scroll Services
  serviceManager.register(SERVICE_KEYS.PAGE_SCROLL_LOCK, {
    factory: async () => {
      const { PageScrollLockManager } = await import('@shared/utils/core/dom/scroll-manager');
      return PageScrollLockManager.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  serviceManager.register(SERVICE_KEYS.GALLERY_SCROLL, {
    factory: async () => {
      const { GalleryScrollManager } = await import(
        '@shared/utils/core/dom/gallery-scroll-manager'
      );
      return GalleryScrollManager.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Theme Service - AutoThemeController로 수정
  serviceManager.register(SERVICE_KEYS.AUTO_THEME, {
    factory: async () => {
      const { AutoThemeController } = await import('@shared/utils/core/auto-theme');
      return AutoThemeController.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  // Video Services
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, {
    factory: async () => {
      const { VideoStateManager } = await import('@shared/utils/media/video-state-manager');
      return VideoStateManager.getInstance();
    },
    singleton: true,
    lazy: true,
  });

  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, {
    factory: async () => {
      const { VideoControlUtil } = await import('@shared/utils/media/video-control.util');
      return VideoControlUtil.getInstance();
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
