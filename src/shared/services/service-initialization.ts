/**
 * @fileoverview Core 서비스 초기화 로직
 * @description Phase 2: 통합된 서비스들 등록 (Wave 1: 중복 키 정리 완료)
 * @version 2.1.0 - Service Key Cleanup
 */

import { serviceManager } from './ServiceManager';
import { logger } from '@shared/logging/logger';

/**
 * Core 레이어 통합 서비스들을 등록합니다
 * Wave 1: 중복 키 제거 완료 + deprecated alias 추가
 */
export async function registerCoreServices(): Promise<void> {
  const { SERVICE_KEYS } = await import('../../constants');

  // ====================================
  // 통합된 핵심 서비스들
  // ====================================

  // 통합 미디어 서비스
  const { MediaService } = await import('./MediaService');
  const mediaService = new MediaService();
  serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);

  // deprecated 키들은 alias로 등록 (경고 포함)
  serviceManager.registerAlias(SERVICE_KEYS.MEDIA_EXTRACTION, SERVICE_KEYS.MEDIA_SERVICE);
  serviceManager.registerAlias(SERVICE_KEYS.VIDEO_CONTROL, SERVICE_KEYS.MEDIA_SERVICE);
  serviceManager.registerAlias(SERVICE_KEYS.VIDEO_STATE, SERVICE_KEYS.MEDIA_SERVICE);

  // 개별 UI 서비스들
  const { ThemeService } = await import('./ThemeService');
  const { ToastController } = await import('./ToastController');

  const themeService = new ThemeService();
  const toastController = new ToastController();

  serviceManager.register(SERVICE_KEYS.THEME, themeService);
  serviceManager.register(SERVICE_KEYS.TOAST, toastController);

  // deprecated 키들은 alias로 등록
  serviceManager.registerAlias('theme.service', SERVICE_KEYS.THEME);
  serviceManager.registerAlias('toast.controller', SERVICE_KEYS.TOAST);

  // ====================================
  // 독립 유지 서비스들
  // ====================================

  // 대량 다운로드 서비스 (복잡도로 인해 독립 유지)
  const { BulkDownloadService } = await import('./BulkDownloadService');
  const bulkDownloadService = new BulkDownloadService();
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, bulkDownloadService);

  // deprecated alias 등록
  serviceManager.registerAlias(SERVICE_KEYS.GALLERY_DOWNLOAD, SERVICE_KEYS.BULK_DOWNLOAD);

  // 파일명 서비스
  const { FilenameService } = await import('../media');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, new FilenameService());

  logger.info('Core services registered successfully (with deprecated aliases)');
}
