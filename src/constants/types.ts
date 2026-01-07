/**
 * @fileoverview Shared type definitions extracted from constant values
 *
 * @description
 * Provides utility types derived from constant objects and arrays defined elsewhere
 * in the constants directory. These types enable type-safe access to constant values
 * without hardcoding literal types in multiple locations.
 *
 * @module constants/types
 *
 * @remarks
 * **Type Extraction Pattern**:
 * This module uses TypeScript's `typeof` and indexed access operators to extract
 * literal types from constant definitions. This pattern ensures type safety while
 * maintaining a single source of truth for constant values.
 *
 * **Design Benefits**:
 * - **Single Source of Truth**: Types automatically reflect constant value changes
 * - **Type Safety**: Compile-time validation of literal values
 * - **Maintainability**: No manual synchronization between types and constants
 * - **IntelliSense Support**: Auto-completion for valid constant values
 *
 * **Usage Pattern**:
 * Import these types when you need to accept or validate constant values in
 * function parameters, component props, or service interfaces.
 *
 * @example
 * ```typescript
 * // Function parameter with ViewMode type
 * import type { ViewMode } from '@constants/types';
 *
 * function setGalleryView(mode: ViewMode): void {
 *   // TypeScript ensures mode is 'vertical' | 'horizontal' | 'grid'
 *   console.log(`Switching to ${mode} view`);
 * }
 *
 * setGalleryView('vertical');  // ✅ Valid
 * setGalleryView('invalid');   // ❌ TypeScript error
 * ```
 *
 * @example
 * ```typescript
 * // Component props with extracted type
 * import type { ViewMode } from '@constants/types';
 * import type { JSXElement } from '@shared/external/vendors';
 *
 * interface GalleryProps {
 *   readonly mode: ViewMode;
 *   readonly onModeChange: (mode: ViewMode) => void;
 * }
 *
 * export function Gallery(props: GalleryProps): JSXElement {
 *   return <div data-mode={props.mode}>Gallery content</div>;
 * }
 * ```
 *
 * @see {@link VIEW_MODES} Source constant array for ViewMode type
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
