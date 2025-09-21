/**
 * Accessibility utilities module
 * 명시적 re-export로 테스트/번들러 해석 이슈를 방지한다.
 */
export * from './accessibility-utils';
export * from './focus-restore-manager';
// Live region 매니저는 명시적으로 내보내기 (vitest 번들러에서의 디렉토리 import 호환성 강화)
export {
  ensurePoliteLiveRegion,
  ensureAssertiveLiveRegion,
  getLiveRegionElements,
  announcePolite,
  announceAssertive,
} from './live-region-manager';
