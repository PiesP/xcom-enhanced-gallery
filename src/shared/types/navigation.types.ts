/**
 * Navigation Types
 *
 * Common type definitions for gallery navigation
 *
 * @version 2.0.0 - Phase 195: Location integration (state/types → types/)
 */

/**
 * Navigation source type.
 *
 * Tracks the source of navigation to distinguish auto-focus from manual navigation.
 */
export type NavigationSource = 'button' | 'keyboard' | 'scroll' | 'auto-focus';
