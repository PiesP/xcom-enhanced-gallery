/**
 * @fileoverview Core 서비스 초기화 로직
 * @description Phase 2: 통합된 서비스들 등록
 * @version 2.0.0 - Service Consolidation
 */

import { CoreService } from './ServiceManager';
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

  // Idempotency guard: if a sentinel core service is already registered, no-op
  // MEDIA_SERVICE is a concrete instance (not a factory), so presence implies prior full registration on normal boot
  if (serviceManager.has(SERVICE_KEYS.MEDIA_SERVICE)) {
    logger.debug('Core services already registered (idempotent no-op)');
    return;
  }

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
  const { ThemeService } = await import('./ThemeService');
  const { ToastController } = await import('./ToastController');

  // ToastController는 즉시 사용 가능해야 하므로 인스턴스 등록 유지
  const toastController = new ToastController();
  serviceManager.register(SERVICE_KEYS.TOAST, toastController);
  serviceManager.register('toast.controller', toastController); // 하위 호환

  // ThemeService/FilenameService는 Non-Critical → 첫 접근 시 생성되도록 팩토리 등록
  // 동일 인스턴스를 여러 키에서 공유해야 하므로 클로저 팩토리를 공유
  const themeFactory = (() => {
    let instance: InstanceType<typeof ThemeService> | null = null;
    return () => {
      if (!instance) instance = new ThemeService();
      return instance;
    };
  })();
  serviceManager.registerFactory(SERVICE_KEYS.THEME, themeFactory);
  serviceManager.registerFactory('theme.service', themeFactory); // 테스트 호환 키

  // ====================================
  // 독립 유지 서비스들
  // ====================================

  // 대량 다운로드 서비스 (복잡도로 인해 독립 유지)
  const bulkDownloadService = await getBulkDownloadService();
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, bulkDownloadService);
  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, bulkDownloadService); // 호환성

  // 파일명 서비스 (배럴 경유 금지 — 구체 모듈로 import)
  const { FilenameService } = await import('../media/FilenameService');
  const filenameFactory = (() => {
    let instance: InstanceType<typeof FilenameService> | null = null;
    return () => {
      if (!instance) instance = new FilenameService();
      return instance;
    };
  })();
  serviceManager.registerFactory(SERVICE_KEYS.MEDIA_FILENAME, filenameFactory);

  logger.info('Core services registered successfully');
}
