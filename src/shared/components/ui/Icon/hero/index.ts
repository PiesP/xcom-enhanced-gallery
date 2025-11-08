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
 * - Navigation: ArrowSmallLeft, ArrowSmallRight, ChevronLeft, ChevronRight
 * - Fit Controls: ArrowsPointingIn, ArrowsRightLeft, ArrowsUpDown, ArrowsPointingOut
 * - Actions: ArrowDownTray, ArrowDownOnSquareStack, Settings, Cog6Tooth, X (Close), ArrowLeftOnRectangle, ZoomIn
 * - Communication: ChatBubbleLeftRight, DocumentText
 * - Files: FileZip
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

export { HeroArrowDownOnSquareStack } from './HeroArrowDownOnSquareStack';
export { HeroArrowSmallLeft } from './HeroArrowSmallLeft';
export { HeroArrowSmallRight } from './HeroArrowSmallRight';
export { HeroArrowLeftOnRectangle } from './HeroArrowLeftOnRectangle';
export { HeroArrowsPointingIn } from './HeroArrowsPointingIn';
export { HeroArrowsPointingOut } from './HeroArrowsPointingOut';
export { HeroArrowsRightLeft } from './HeroArrowsRightLeft';
export { HeroArrowsUpDown } from './HeroArrowsUpDown';
export { HeroChatBubbleLeftRight } from './HeroChatBubbleLeftRight';
export { HeroChevronLeft } from './HeroChevronLeft';
export { HeroChevronRight } from './HeroChevronRight';
export { HeroCog6Tooth } from './HeroCog6Tooth';
export { HeroDocumentText } from './HeroDocumentText';
export { HeroDownload } from './HeroDownload';
export { HeroFileZip } from './HeroFileZip';
export { HeroSettings } from './HeroSettings';
export { HeroX } from './HeroX';
export { HeroZoomIn } from './HeroZoomIn';
