/**
 * @fileoverview Icon Component Barrel Export
 * @version 2.2.0 - Phase 387: Enhanced documentation, icon catalog
 * @description Public API for icon system (Phase 224 LazyIcon integration)
 * @module shared/components/ui/Icon
 *
 * **Icon System Overview**:
 * - Base Icon component: SVG wrapper with design system integration
 * - Lazy Icon component: Async loading with fallback support
 * - Icon Registry: Dynamic import caching system
 * - Heroicons: 11 adapted SVG icons from Heroicons library
 *
 * **Export Categories**:
 * 1. Core Components: Icon, LazyIcon (base infrastructure)
 * 2. Lazy Loading: useIconPreload, useCommonIconPreload (Solid.js hooks)
 * 3. Heroicons Adapters: Direct imports (for static usage)
 *
 * **Usage Patterns**:
 * ```typescript
 * // Static import (bundle always includes)
 * import { Icon, Download } from '@shared/components/ui/Icon';
 *
 * // Lazy loading (dynamic imports, tree-shaking)
 * import { LazyIcon, useCommonIconPreload } from '@shared/components/ui/Icon';
 * useCommonIconPreload();
 *
 * // Render
 * <LazyIcon name="Download" size={20} />
 * <Download /> // Static variant
 * ```
 *
 * **Icon Catalog** (Heroicons adapted):
 * - Navigation: ArrowSmallLeft, ArrowSmallRight, ChevronLeft, ChevronRight
 * - Fit Controls: ArrowsPointingIn, ArrowsRightLeft, ArrowsUpDown, ArrowsPointingOut
 * - Actions: ArrowDownTray, ArrowDownOnSquareStack, Settings, Cog6Tooth, X (Close), ArrowLeftOnRectangle, ZoomIn
 * - Communication: ChatBubbleLeftRight, DocumentText
 * - Files: FileZip
 *
 * **Phase Timeline**:
 * - Phase 224: LazyIcon integration, path optimization
 * - Phase 387: Full documentation, 11 icons support
 */

// ============================================================================
// Core Icon Components
// ============================================================================

/**
 * Base SVG icon container component
 * Provides design system integration and accessibility support
 * @see Icon.tsx for full documentation
 */
export { Icon } from './Icon';
export type { IconProps } from './Icon';

// ============================================================================
// Lazy Loading System
// ============================================================================

/**
 * Lazy-loaded icon component with async loading
 * Supports custom fallback and error handling
 * Uses icon-registry for dynamic imports and caching
 * @see lazy-icon.tsx for full documentation
 */
export { LazyIcon, useIconPreload, useCommonIconPreload } from './lazy-icon';
export type { LazyIconProps } from './lazy-icon';

// ============================================================================
// Heroicons Adapters
// ============================================================================

/**
 * Exported with aliases for convenience
 * All icons follow Heroicons SVG format (24x24, stroke-based)
 *
 * **Navigation Icons**:
 * - ChevronLeft: Left arrow for previous/back navigation
 * - ChevronRight: Right arrow for next/forward navigation
 *
 * **Action Icons**:
 * - Download: Download arrow pointing to tray
 * - Settings: Gear icon for configuration/preferences
 * - X: X-mark for close/dismiss actions
 * - ZoomIn: Magnifying glass with plus for zoom in
 *
 * **File Icons**:
 * - DocumentText: Document page with text lines
 * - FileZip: Archive box with download arrow
 *
 * **Sizing Icons**:
 * - ArrowsPointingIn: Original size
 * - ArrowsPointingOut: Fit to container
 */

// Navigation
export { HeroArrowSmallLeft as ArrowSmallLeft } from './hero/HeroArrowSmallLeft';
export { HeroArrowSmallRight as ArrowSmallRight } from './hero/HeroArrowSmallRight';
export { HeroChevronLeft as ChevronLeft } from './hero/HeroChevronLeft';
export { HeroChevronRight as ChevronRight } from './hero/HeroChevronRight';

// Actions
export { HeroDownload as Download } from './hero/HeroDownload';
export { HeroDownload as ArrowDownTray } from './hero/HeroDownload';
export { HeroArrowDownOnSquareStack as ArrowDownOnSquareStack } from './hero/HeroArrowDownOnSquareStack';
export { HeroSettings as Settings } from './hero/HeroSettings';
export { HeroCog6Tooth as Cog6Tooth } from './hero/HeroCog6Tooth';
export { HeroX as X } from './hero/HeroX';
export { HeroArrowLeftOnRectangle as ArrowLeftOnRectangle } from './hero/HeroArrowLeftOnRectangle';
export { HeroZoomIn as ZoomIn } from './hero/HeroZoomIn';

// Communication
export { HeroChatBubbleLeftRight as ChatBubbleLeftRight } from './hero/HeroChatBubbleLeftRight';
export { HeroDocumentText as DocumentText } from './hero/HeroDocumentText';

// Files
export { HeroFileZip as FileZip } from './hero/HeroFileZip';

// Sizing
export { HeroArrowsPointingIn as ArrowsPointingIn } from './hero/HeroArrowsPointingIn';
export { HeroArrowsRightLeft as ArrowsRightLeft } from './hero/HeroArrowsRightLeft';
export { HeroArrowsUpDown as ArrowsUpDown } from './hero/HeroArrowsUpDown';
export { HeroArrowsPointingOut as ArrowsPointingOut } from './hero/HeroArrowsPointingOut';

/**
 * @deprecated Phase 215: Tabler Icons removed completely
 * Use Heroicons adapters instead (all icons available above)
 */
