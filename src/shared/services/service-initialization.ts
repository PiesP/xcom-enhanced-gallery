/**
 * @fileoverview Core 서비스 초기화 로직
 * @description Phase 2: 통합된 서비스들 등록
 * @version 2.0.0 - Service Consolidation
 */

import { serviceManager } from './ServiceManager';
import { logger } from '@shared/logging/logger';

/**
 * Core 레이어 통합 서비스들을 등록합니다
 * Phase 2: 서비스 통합 후 단순화된 등록
 */
export async function registerCoreServices(): Promise<void> {
  const { SERVICE_KEYS } = await import('../../constants');

  // ====================================
  // 통합된 핵심 서비스들
  // ====================================

  // 통합 미디어 서비스
  const { MediaService } = await import('./MediaService');
  const mediaService = MediaService.getInstance();
  serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);

  // 기존 키들과의 호환성을 위해 중복 등록
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, mediaService);

  // 통합 UI 서비스
  const { UIService } = await import('./UIService');
  const uiService = UIService.getInstance();
  serviceManager.register(SERVICE_KEYS.UI_SERVICE, uiService);

  // 기존 키들과의 호환성을 위해 중복 등록
  serviceManager.register(SERVICE_KEYS.AUTO_THEME, uiService);
  serviceManager.register(SERVICE_KEYS.TOAST_CONTROLLER, uiService);

  // ====================================
  // 독립 유지 서비스들
  // ====================================

  // 대량 다운로드 서비스 (복잡도로 인해 독립 유지)
  const { BulkDownloadService } = await import('./BulkDownloadService');
  const bulkDownloadService = BulkDownloadService.getInstance();
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, bulkDownloadService);
  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, bulkDownloadService); // 호환성

  // 파일명 서비스
  const { FilenameService } = await import('../media');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, FilenameService.getInstance());

  logger.info('Core services registered successfully');
}
