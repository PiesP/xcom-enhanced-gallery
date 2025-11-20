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

import { type ComponentChildren, type JSXElement } from '@shared/external/vendors';
import { Button, type ButtonProps, type ButtonSize } from './Button';

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed icon button sizes
 * @description Size options validated by TDD: icon-button.size-map
 * Centrally managed to ensure consistency across tests
 */
const ALLOWED_ICON_SIZES = new Set<ButtonProps['size']>(['sm', 'md', 'lg', 'toolbar']);

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
export function IconButton(props: IconButtonProps): JSXElement {
  // Compute safe size by reading props.size if present, fallback to 'md'
  const sizeValue =
    typeof (props as Record<string, unknown>).size === 'function'
      ? ((props as Record<string, () => unknown>).size as () => unknown)()
      : (props as Record<string, unknown>).size;

  // Type guard: validate size is one of allowed ButtonSize values
  const isValidSize = (value: unknown): value is ButtonSize =>
    typeof value === 'string' && ALLOWED_ICON_SIZES.has(value as ButtonSize);

  const safeSize: IconButtonProps['size'] = isValidSize(sizeValue) ? sizeValue : 'md';

  // Debugging: capture whether props contain accessor functions or primitive values (dev only)
  const passedDisabledType = __DEV__
    ? typeof (props as Record<string, unknown>).disabled
    : undefined;

  const passedDisabledValue = __DEV__
    ? passedDisabledType === 'function'
      ? ((props as Record<string, () => unknown>).disabled as () => unknown)?.()
      : (props as Record<string, unknown>).disabled
    : undefined;
  const passedLoadingType = __DEV__ ? typeof (props as Record<string, unknown>).loading : undefined;

  const passedLoadingValue = __DEV__
    ? passedLoadingType === 'function'
      ? ((props as Record<string, () => unknown>).loading as () => unknown)?.()
      : (props as Record<string, unknown>).loading
    : undefined;

  // Ensure disabled/loading are passed as accessors (functions returning current value)
  // to prevent Solid runtime from unwrapping them during props spread/merge.

  const passedDisabled =
    typeof (props as Record<string, unknown>).disabled === 'function'
      ? ((props as Record<string, () => unknown>).disabled as () => boolean | undefined)
      : () => (props as Record<string, unknown>).disabled as boolean | undefined;

  const passedLoading =
    typeof (props as Record<string, unknown>).loading === 'function'
      ? ((props as Record<string, () => unknown>).loading as () => boolean | undefined)
      : () => (props as Record<string, unknown>).loading as boolean | undefined;

  // Build rest props without disabled/loading to ensure explicit accessor forwarding
  const restProps: Record<string, unknown> = { ...props } as Record<string, unknown>;
  // Avoid mutating original prop container if it's a proxied reactive object
  delete restProps.disabled;
  delete restProps.loading;
  delete restProps.size; // Remove size to use safeSize explicitly

  return (
    // Explicitly pass in disabled/loading accessors to ensure preservation into Button
    <Button
      {...(restProps as IconButtonProps)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      disabled={passedDisabled as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loading={passedLoading as any}
      variant='icon'
      size={safeSize as ButtonSize}
      iconOnly
      data-debug-prop-disabled-type={passedDisabledType}
      data-debug-prop-disabled-value={String(passedDisabledValue)}
      data-debug-prop-loading-type={passedLoadingType}
      data-debug-prop-loading-value={String(passedLoadingValue)}
    />
  );
}
