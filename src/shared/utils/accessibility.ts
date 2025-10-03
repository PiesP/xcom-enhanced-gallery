/**
 * @fileoverview 접근성 관련 유틸리티 함수들 (레거시 호환 레이어)
 * @description Epic CODE-DEDUP-CONSOLIDATION - 중복 제거 완료
 * @version 2.0.0 - Consolidated (Re-exports only)
 *
 * 모든 구현은 `./accessibility/accessibility-utils.ts`에 통합되었습니다.
 * 이 파일은 기존 import 경로 호환성을 위한 re-export 레이어입니다.
 */

/**
 * Re-export all accessibility utilities from consolidated module
 * Epic CODE-DEDUP-CONSOLIDATION: 중복 함수 제거, 단일 소스로 통합
 */
export {
  // Core utilities
  getRelativeLuminance,
  parseColor,
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  detectActualBackgroundColor,
  isLightBackground,
} from './accessibility/accessibility-utils';

/**
 * Re-export live region helpers for barrel collision fix
 * Tests and some features import without '/index'
 */
export {
  ensurePoliteLiveRegion,
  ensureAssertiveLiveRegion,
  getLiveRegionElements,
} from './accessibility/live-region-manager';
