/**
 * @fileoverview Core 서비스 초기화 로직
 * @description Phase 2: 통합된 서비스들 등록
 * @version 2.0.0 - Service Consolidation
 */

import { CoreService } from './service-manager';
import { logger } from '@shared/logging/logger';
import { getMediaService, getBulkDownloadService } from './service-factories';

/**
 * Core 레이어 통합 서비스들을 등록합니다
 * Phase 2: 서비스 통합 후 단순화된 등록
 */
export async function registerCoreServices(): Promise<void> {
  const { SERVICE_KEYS } = await import('../../constants');
  // Always resolve the current CoreService singleton to avoid stale instance issues in tests
  const serviceManager = CoreService.getInstance();

  // ====================================
  // 통합된 핵심 서비스들
  // ====================================

  // 통합 미디어 서비스
  const mediaService = await getMediaService();
  serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);

  // 기존 키들과의 호환성을 위해 중복 등록
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, mediaService);

  // 개별 UI 서비스들
  const { ThemeService } = await import('./theme-service');
  const { ToastController } = await import('./toast-controller');

  const themeService = new ThemeService();
  const toastController = new ToastController();

  serviceManager.register(SERVICE_KEYS.THEME, themeService);
  serviceManager.register(SERVICE_KEYS.TOAST, toastController);

  // 하위 호환성을 위한 추가 키 등록
  serviceManager.register('theme.service', themeService); // 테스트에서 사용하는 키
  serviceManager.register('toast.controller', toastController); // 테스트에서 사용하는 키

  // 기존 키들과의 호환성을 위해 중복 등록
  serviceManager.register(SERVICE_KEYS.THEME, themeService);
  // TOAST_CONTROLLER는 이미 위에서 등록됨

  // ====================================
  // 독립 유지 서비스들
  // ====================================

  // 대량 다운로드 서비스 (복잡도로 인해 독립 유지)
  const bulkDownloadService = await getBulkDownloadService();
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, bulkDownloadService);
  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, bulkDownloadService); // 호환성

  // 파일명 서비스 (배럴 경유 금지 — 구체 모듈로 import)
  const { FilenameService } = await import('../media/filename-service');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, new FilenameService());

  logger.info('Core services registered successfully');
}
