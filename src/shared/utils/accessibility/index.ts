/**
 * Accessibility utilities module
 * Phase 104: 3개 모듈로 분해 (color-contrast, keyboard-navigation, aria-helpers)
 */
export * from './color-contrast';
export * from './keyboard-navigation';
export * from './aria-helpers';
export * from './focus-restore-manager';
// Live region 매니저는 명시적으로 내보내기 (vitest 번들러에서의 디렉토리 import 호환성 강화)
export {
  ensurePoliteLiveRegion,
  ensureAssertiveLiveRegion,
  getLiveRegionElements,
} from './live-region-manager';
