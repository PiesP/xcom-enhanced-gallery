/**
 * @fileoverview Hero Icons Barrel Export
 * @version 1.0.0
 * @description Public API for all Hero icon components
 * @module shared/components/ui/Icon/hero
 *
 * **Hero Icons Library**:
 * SVG icons from Heroicons adapted for Solid.js framework
 * Type-safe components with full JSDoc documentation
 *
 * **Export Strategy**:
 * - All icons exported by name
 * - Lazy import supported (@see Icon lazy-icon.tsx)
 * - Type-safe IconProps interface
 *
 * **Icon Categories**:
 * - Navigation: ChevronLeft, ChevronRight
 * - Arrow: ArrowAutofitHeight, ArrowAutofitWidth, ArrowsMaximize
 * - Actions: Download, Settings, X (Close), ZoomIn
 * - Files: DocumentText, FileZip
 *
 * @example
 * ```tsx
 * // Direct import
 * import { HeroChevronLeft, HeroDownload } from '@shared/components/ui/Icon/hero';
 *
 * // Lazy import
 * const { HeroSettings } = await import('@shared/components/ui/Icon/hero');
 * ```
 */

export { HeroArrowAutofitHeight } from './HeroArrowAutofitHeight';
export { HeroArrowAutofitWidth } from './HeroArrowAutofitWidth';
export { HeroArrowsMaximize } from './HeroArrowsMaximize';
export { HeroChevronLeft } from './HeroChevronLeft';
export { HeroChevronRight } from './HeroChevronRight';
export { HeroDocumentText } from './HeroDocumentText';
export { HeroDownload } from './HeroDownload';
export { HeroFileZip } from './HeroFileZip';
export { HeroSettings } from './HeroSettings';
export { HeroX } from './HeroX';
export { HeroZoomIn } from './HeroZoomIn';
