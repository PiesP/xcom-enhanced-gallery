/**
 * @fileoverview Icon Component Exports
 * @version 2.0.0 - Heroicons 어댑터 기반 + 레거시(Tabler) 아이콘 공존 단계
 */

export { Icon } from './Icon';
export type { IconProps } from './Icon';

// Heroicons 어댑터를 기존 이름으로 재노출 (점진 이행 중)
// Hero* 정적 재노출 제거 (ICN-R4).
// 모든 아이콘 소비는 LazyIcon + iconRegistry 동적 로딩 경유.
