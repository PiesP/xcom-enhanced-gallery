/**
 * @fileoverview Icon Component Exports
 * @version 2.0.0 - Heroicons 어댑터 기반 + 레거시(Tabler) 아이콘 공존 단계
 */

export { Icon } from './Icon';
export type { IconProps } from './Icon';

// Heroicons 어댑터를 기존 이름으로 재노출 (점진 이행 중)
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
