/**
 * @fileoverview Core 서비스 초기화 로직
 * @description Phase 2: 통합된 서비스들 등록
 * @version 2.0.0 - Service Consolidation
 */

import { serviceManager } from './service-manager';
import { logger } from '@shared/logging';

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
  const { MediaService } = await import('./media-service');
  const mediaService = new MediaService();
  serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);

  // 기존 키들과의 호환성을 위해 중복 등록
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, mediaService);

  // 개별 UI 서비스들
  const { ThemeService } = await import('./theme-service');
  const { ToastService } = await import('./toast-service');

  const themeService = new ThemeService();
  const toastService = new ToastService();

  serviceManager.register(SERVICE_KEYS.THEME, themeService);
  serviceManager.register(SERVICE_KEYS.TOAST_CONTROLLER, toastService);

  // 하위 호환성을 위한 추가 키 등록
  serviceManager.register('theme.service', themeService); // 테스트에서 사용하는 키
  serviceManager.register('toast.controller', toastService); // 테스트에서 사용하는 키

  // 기존 키들과의 호환성을 위해 중복 등록
  serviceManager.register(SERVICE_KEYS.AUTO_THEME, themeService);
  // TOAST_CONTROLLER는 이미 위에서 등록됨

  // ====================================
  // 독립 유지 서비스들
  // ====================================

  // 대량 다운로드 기능은 MediaService로 통합됨
  serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, mediaService);
  serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, mediaService); // 호환성

  // 파일명 서비스
  const { FilenameService } = await import('../media');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, new FilenameService());

  logger.info('Core services registered successfully');
}
