/**
 * @fileoverview Core 서비스 초기화 로직
 * @description Phase 2: 통합된 서비스들 등록
 * @version 2.0.0 - Service Consolidation
 */

import { CoreService } from './service-manager';
import { logger } from '@shared/logging';
import { getMediaService } from './service-factories';

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
  const { toastManager } = await import('./unified-toast-manager');

  const themeService = new ThemeService();

  serviceManager.register(SERVICE_KEYS.THEME, themeService);
  serviceManager.register(SERVICE_KEYS.TOAST, toastManager);

  // Phase 268-3: 하위 호환성 키 조건부 등록
  // 테스트 환경에서만 등록하여 프로덕션 경고 제거
  if (import.meta.env.MODE === 'test') {
    // 테스트 전용 키 (하위 호환성)
    serviceManager.register('theme.service', themeService);
    serviceManager.register('toast.manager', toastManager);
  }

  // ====================================
  // 독립 유지 서비스들
  // ====================================

  // Phase 308: BulkDownloadService를 lazy registration으로 이동
  // 앱 시작 시 등록하지 않고, 첫 다운로드 시 동적 로드
  // 파일명 서비스 (구체 모듈로 import)
  const { FilenameService } = await import('./file-naming/filename-service');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, new FilenameService());

  logger.info('Core services registered successfully');
}
