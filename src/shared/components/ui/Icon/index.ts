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
 * - Navigation: ChevronLeft, ChevronRight
 * - Actions: Download, Settings, X (Close), ZoomIn
 * - Files: DocumentText, FileZip
 * - Sizing: ArrowAutofitWidth, ArrowAutofitHeight, ArrowsMaximize
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
 * - ArrowAutofitWidth: Horizontal expand/collapse
 * - ArrowAutofitHeight: Vertical expand/collapse
 * - ArrowsMaximize: Bidirectional expand (fullscreen)
 */

// Navigation
export { HeroChevronLeft as ChevronLeft } from './hero/HeroChevronLeft';
export { HeroChevronRight as ChevronRight } from './hero/HeroChevronRight';

// Actions
export { HeroDownload as Download } from './hero/HeroDownload';
export { HeroSettings as Settings } from './hero/HeroSettings';
export { HeroX as X } from './hero/HeroX';
export { HeroZoomIn as ZoomIn } from './hero/HeroZoomIn';

// Files
export { HeroFileZip as FileZip } from './hero/HeroFileZip';
export { HeroDocumentText as DocumentText } from './hero/HeroDocumentText';

// Sizing
export { HeroArrowAutofitWidth as ArrowAutofitWidth } from './hero/HeroArrowAutofitWidth';
export { HeroArrowAutofitHeight as ArrowAutofitHeight } from './hero/HeroArrowAutofitHeight';
export { HeroArrowsMaximize as ArrowsMaximize } from './hero/HeroArrowsMaximize';

/**
 * @deprecated Phase 215: Tabler Icons removed completely
 * Use Heroicons adapters instead (all icons available above)
 */
