/**
 * @fileoverview Shared type definitions extracted from constant values.
 *
 * Provides utility types derived from constants using `typeof` operators.
 * Types automatically reflect constant value changes (single source of truth).
 *
 * @module constants/types
 */

import type { VIEW_MODES } from '@constants/video-controls';

/**
 * Gallery view mode literal type
 *
 * @remarks
 * Extracted from {@link VIEW_MODES} constant array to provide type-safe
 * access to supported gallery view modes. This type automatically reflects
 * any additions or removals in the source VIEW_MODES array.
 *
 * **Supported Modes**:
 * - `'vertical'` - Vertical scrolling gallery (default)
 * - `'horizontal'` - Horizontal scrolling gallery
 * - `'grid'` - Grid layout gallery
 *
 * **Type Extraction Technique**:
 * ```typescript
 * // Source constant (simplified)
 * const VIEW_MODES = ['vertical', 'horizontal', 'grid'] as const;
 *
 * // Type extraction using indexed access
 * type ViewMode = (typeof VIEW_MODES)[number];
 * // Results in: 'vertical' | 'horizontal' | 'grid'
 * ```
 *
 * **Usage Contexts**:
 * - Gallery component props for mode selection
 * - Settings service for persisting user preferences
 * - Toolbar controls for view mode switching
 * - State management for active view mode tracking
 *
 * @example
 * ```typescript
 * // Type guard for runtime validation
 * import { VIEW_MODES } from '@constants/video-controls';
 * import type { ViewMode } from '@constants/types';
 *
 * function isValidViewMode(value: string): value is ViewMode {
 *   return VIEW_MODES.includes(value as ViewMode);
 * }
 *
 * const userInput = 'vertical';
 * if (isValidViewMode(userInput)) {
 *   // TypeScript knows userInput is ViewMode here
 *   setGalleryMode(userInput);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // State signal with ViewMode type
 * import { createSignal } from 'solid-js';
 * import type { ViewMode } from '@constants/types';
 *
 * const [viewMode, setViewMode] = createSignal<ViewMode>('vertical');
 *
 * // Type-safe mode switching
 * function switchToGrid(): void {
 *   setViewMode('grid');  // ✅ Valid
 * }
 * ```
 *
 * @see {@link VIEW_MODES} Source constant array in video-controls.ts
 * @see {@link GalleryRenderer} Gallery rendering service using ViewMode
 * @see {@link ToolbarView} Toolbar component with view mode controls
 */
export type ViewMode = (typeof VIEW_MODES)[number];
