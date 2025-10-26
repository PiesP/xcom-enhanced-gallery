/**
 * @fileoverview Container Module - 공개 API 배럴 export
 * @description
 * 서비스 컨테이너의 공개 인터페이스를 제공합니다.
 *
 * **공개 API**:
 * - 서비스 접근자: `getToastController()`, `getThemeService()` 등
 * - 서비스 등록: `registerGalleryRenderer()`, `registerSettingsManager()` 등
 * - 설정 접근: `getSetting()`, `setSetting()`, `tryGetSettingsService()`
 * - 테스트 하네스: `createTestHarness()` (테스트 전용)
 * - 브릿지 함수: `bridgeGetService()`, `bridgeRegister()` (내부 전용)
 *
 * **금지 사항**:
 * - ❌ `CoreServiceRegistry` 직접 import (내부용)
 * - ❌ `SERVICE_KEYS` 직접 참조 (접근자 사용)
 * - ❌ `ServiceManager`/`CoreService` 직접 import
 * - ❌ `AppContainer` 타입 runtime import (테스트 헬퍼만)
 *
 * @example
 * ```typescript
 * // ✅ Features에서
 * import {
 *   getToastController,
 *   getThemeService,
 *   getSetting,
 * } from '@shared/container';
 *
 * const toast = getToastController();
 * const theme = getThemeService();
 * const autoDownload = getSetting('autoDownload', false);
 *
 * // ✅ 테스트 헬퍼에서
 * import { createTestHarness } from '@shared/container';
 * const harness = createTestHarness();
 * ```
 */

// ============================================================================
// Service Accessors (공개 API - Features 레이어 권장)
// ============================================================================
export {
  // Service Getters
  getToastController,
  getThemeService,
  getMediaFilenameService,
  getBulkDownloadServiceFromContainer,
  getGalleryDownloadService,
  getMediaServiceFromContainer,
  getGalleryRenderer,
  // Service Registrations
  registerGalleryRenderer,
  registerSettingsManager,
  registerTwitterTokenExtractor,
  tryGetSettingsManager,
  // BaseService
  initializeBaseServices,
  registerBaseService,
  registerCoreBaseServices,
  // Warmup
  warmupCriticalServices,
  warmupNonCriticalServices,
} from './service-accessors';

// ============================================================================
// Service Bridge (내부 전용 - Features 레이어에서는 service-accessors 사용)
// ============================================================================
export {
  // Generic Service Bridge
  bridgeGetService,
  bridgeTryGet,
  bridgeRegister,
  // BaseService Bridge
  bridgeRegisterBaseService,
  bridgeGetBaseService,
  bridgeTryGetBaseService,
  bridgeInitializeBaseService,
  bridgeInitializeAllBaseServices,
} from './service-bridge';

// ============================================================================
// Settings Access (공개 API - Features 레이어 권장)
// ============================================================================
export { tryGetSettingsService, getSetting, setSetting } from './settings-access';

// ============================================================================
// Test Harness (테스트 전용)
// ============================================================================
export {
  createTestHarness,
  TestHarness,
  // 호환성: 레거시 이름
  createServiceHarness,
  ServiceHarness,
} from './harness';
