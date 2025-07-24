/**
 * @fileoverview Core 서비스 초기화 로직
 * @description Core 레이어 서비스만 등록 (의존성 규칙 준수)
 * @version 1.1.0 - Phase 5: Core 서비스만 등록
 */

import { serviceManager } from './ServiceManager';

/**
 * Core 레이어 서비스들만 등록합니다
 * Features 레이어 서비스는 main.ts에서 별도 등록
 */
export async function registerCoreServices(): Promise<void> {
  const { SERVICE_KEYS } = await import('../../constants');

  // Core Services
  const { BulkDownloadService } = await import('./BulkDownloadService');
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, BulkDownloadService.getInstance());

  // GALLERY_DOWNLOAD는 BULK_DOWNLOAD와 같은 인스턴스 사용
  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, BulkDownloadService.getInstance());

  // Media Services (Core Layer)
  const { MediaExtractionService } = await import('./media-extraction/MediaExtractionService');
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, new MediaExtractionService());

  const { FilenameService } = await import('../media');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, FilenameService.getInstance());

  // Theme Service
  const { ThemeService } = await import('./ThemeService');
  serviceManager.register(SERVICE_KEYS.AUTO_THEME, ThemeService.getInstance());

  // Video Services - 같은 인스턴스 재사용
  const { VideoControlService } = await import('./media/VideoControlService');
  const videoService = VideoControlService.getInstance();
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, videoService);
  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, videoService);

  // Toast Controller
  const { ToastController } = await import('./ToastController');
  serviceManager.register(SERVICE_KEYS.TOAST_CONTROLLER, new ToastController());
}
