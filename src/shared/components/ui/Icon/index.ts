/**
 * @fileoverview Icon Component Exports
 * @version 2.2.0 - Phase 224: LazyIcon 통합 및 경로 최적화
 */

// 기본 Icon 컴포넌트
export { Icon } from './Icon';
export type { IconProps } from './Icon';

// 지연 로딩 아이콘 시스템 (Phase 224)
export { LazyIcon, useIconPreload, useCommonIconPreload } from './lazy-icon';
export type { LazyIconProps } from './lazy-icon';

// Heroicons 어댑터 export
export { HeroChevronLeft as ChevronLeft } from './hero/HeroChevronLeft';
export { HeroChevronRight as ChevronRight } from './hero/HeroChevronRight';
export { HeroDownload as Download } from './hero/HeroDownload';
export { HeroSettings as Settings } from './hero/HeroSettings';
export { HeroX as X } from './hero/HeroX';
export { HeroZoomIn as ZoomIn } from './hero/HeroZoomIn';
export { HeroFileZip as FileZip } from './hero/HeroFileZip';
export { HeroArrowAutofitWidth as ArrowAutofitWidth } from './hero/HeroArrowAutofitWidth';
export { HeroArrowAutofitHeight as ArrowAutofitHeight } from './hero/HeroArrowAutofitHeight';
export { HeroArrowsMaximize as ArrowsMaximize } from './hero/HeroArrowsMaximize';
// Note: 레거시 Tabler Icons는 완전히 제거되었습니다. (Phase 215 완료)
