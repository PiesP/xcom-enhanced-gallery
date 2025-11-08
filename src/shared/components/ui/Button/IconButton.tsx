/**
 * @fileoverview Icon Button - Unified Button wrapper for icon-only actions
 * @version 4.1.0 - Phase 385: Icon-only button variant
 * @description Convenience wrapper for creating icon-only buttons with size validation
 * @module @shared/components/ui/Button
 *
 * Features:
 * - Simplified interface for icon-only buttons
 * - Automatic size validation (defaults to 'md')
 * - Accessible by default (requires aria-label)
 * - Supports all Button variants for icon buttons
 *
 * @example
 * ```tsx
 * import { IconButton } from '@shared/components/ui/Button';
 *
 * <IconButton aria-label="Delete" variant="danger">
 *   <TrashIcon />
 * </IconButton>
 * ```
 */

import type { ComponentChildren, JSXElement } from '../../../external/vendors';
import { Button } from './Button';
import type { ButtonProps } from './Button';

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed icon button sizes
 * @description Size options validated by TDD: icon-button.size-map
 * Centrally managed to ensure consistency across tests
 */
export const ICON_BUTTON_SIZES: ReadonlyArray<'sm' | 'md' | 'lg' | 'toolbar'> = [
  'sm',
  'md',
  'lg',
  'toolbar',
] as const;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Icon button props
 * @description Configuration for IconButton (Button with variant='icon' and iconOnly=true)
 * Excludes variant and iconOnly as they're fixed, and children is always allowed
 */
export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'iconOnly' | 'children'> {
  /** Child icon element(s) */
  readonly children?: ComponentChildren;
}

// ============================================================================
// Icon Button Component
// ============================================================================

/**
 * Icon Button Component - Simplified icon-only button
 * @description Convenient wrapper around Button with preset icon-only configuration
 *
 * @param props - Icon button props (size, aria-label, etc.)
 * @returns Solid.js JSXElement button configured for icons
 *
 * @note Always requires aria-label for accessibility
 * @note Size validation ensures only valid sizes are used
 *
 * @example
 * ```tsx
 * // Save button
 * <IconButton aria-label="Save" onClick={handleSave}>
 *   <SaveIcon />
 * </IconButton>
 *
 * // With custom size
 * <IconButton size="lg" aria-label="Download">
 *   <DownloadIcon />
 * </IconButton>
 * ```
 */
export function IconButton({ size = 'md', ...props }: IconButtonProps): JSXElement {
  // Validate size is in allowed list, fallback to 'md'
  const safeSize: IconButtonProps['size'] = ICON_BUTTON_SIZES.includes(
    size as 'sm' | 'md' | 'lg' | 'toolbar'
  )
    ? size
    : 'md';

  return <Button {...props} variant='icon' size={safeSize} iconOnly />;
}

export default IconButton;
