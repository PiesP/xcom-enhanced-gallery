/**
 * @fileoverview Core 서비스 초기화 로직
 * @description 통합된 서비스 등록 + 호환 alias 키만 유지 (중복 등록/경고 경로 제거됨)
 * @version 2.1.0 - CORE-REG-DEDUPE P3: 초기화 경로 간소화 및 주석 정리
 */

import { serviceManager } from './ServiceManager';
import { logger } from '@shared/logging/logger';
import { getMediaService, getBulkDownloadService } from './service-factories';

/**
 * Core 레이어 통합 서비스들을 등록합니다.
 * - 동일 키 중복 등록은 금지 (ServiceManager가 경고를 낼 수 있음) → 본 함수는 단일 키만 등록합니다.
 * - 하위 호환을 위해 "다른" 식별자의 alias 키만 동일 인스턴스로 추가 등록합니다(중복 아님).
 * - 검증: test/unit/shared/services/service-initialization.dedupe.red.test.ts
 */
export async function registerCoreServices(): Promise<void> {
  const { SERVICE_KEYS } = await import('../../constants');

  // ====================================
  // 통합된 핵심 서비스들
  // ====================================

  // 통합 미디어 서비스
  const mediaService = await getMediaService();
  serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);

  // 기존 키들과의 호환성을 위해 alias 키로 추가 등록(동일 인스턴스 공유)
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, mediaService);

  // 개별 UI 서비스들
  const { ThemeService } = await import('./ThemeService');
  const { ToastController } = await import('./ToastController');

  const themeService = new ThemeService();
  const toastController = new ToastController();

  serviceManager.register(SERVICE_KEYS.THEME, themeService);
  serviceManager.register(SERVICE_KEYS.TOAST, toastController);

  // 하위 호환성을 위한 alias 키 등록 (테스트/레거시 경로에서 사용)
  serviceManager.register('theme.service', themeService);
  serviceManager.register('toast.controller', toastController);

  // ====================================
  // 독립 유지 서비스들
  // ====================================

  // 대량 다운로드 서비스 (독립 유지)
  const bulkDownloadService = await getBulkDownloadService();
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, bulkDownloadService);
  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, bulkDownloadService); // 호환성

  // 파일명 서비스 (barrel 제거로 순환 단축)
  const { FilenameService } = await import('../media/FilenameService');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, new FilenameService());

  logger.info('Core services registered successfully');
}
