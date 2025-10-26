/**
 * @fileoverview Settings Feature Exports (Feature barrel)
 * @version 2.3.0 - Phase 193: 타입-서비스 분리 강화, 문서화 개선
 *
 * @description
 * Settings feature를 위한 타입과 서비스 초기화 진입점.
 * - 타입은 `./types/settings.types.ts`에서 정의됨
 * - 서비스는 lazy import로 제공 (bootstrap 최적화)
 *
 * @example
 * ```typescript
 * // 1. 타입 사용 (type-only import 권장)
 * import type { AppSettings } from '@/features/settings';
 *
 * // 2. 서비스 초기화 (동적 import로 tree-shaking 최적화)
 * const service = await initializeSettingsService();
 * await service.initialize();
 * ```
 */

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

/**
 * Settings 타입 재익스포트 (type-only)
 * - AppSettings: 전체 설정 구조
 * - GallerySettings, DownloadSettings 등 카테고리별 타입
 *
 * 기본값(DEFAULT_SETTINGS)은 @/constants에서 직접 임포트:
 * @example `import { DEFAULT_SETTINGS } from '@/constants'`
 */
export * from './types/settings.types';

// ─────────────────────────────────────────
// Service Initialization (Lazy Import Pattern)
// ─────────────────────────────────────────

/**
 * Settings 서비스 초기화 (동적 import)
 *
 * @description
 * SettingsService 인스턴스를 생성하고 반환합니다.
 * 동적 import를 사용하여 번들 크기 최적화.
 *
 * @returns 초기화된 SettingsService 인스턴스
 *
 * @example
 * ```typescript
 * // bootstrap/features.ts에서 사용
 * const { SettingsService } = await import('@/features/settings/services/settings-service');
 * const service = new SettingsService();
 * await service.initialize();
 * ```
 */
export async function initializeSettingsService() {
  const { SettingsService } = await import('./services/settings-service');
  return new SettingsService();
}
