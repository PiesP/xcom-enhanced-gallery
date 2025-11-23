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

import {
  getSolid,
  type ComponentChildren,
  type JSXElement,
} from "@shared/external/vendors";
import {
  Button,
  type ButtonProps,
  type ButtonSize,
} from "@shared/components/ui/Button/Button";
import { toAccessor } from "@shared/utils/solid-helpers";

const { splitProps, createMemo } = getSolid();

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed icon button sizes
 * @description Size options validated by TDD: icon-button.size-map
 * Centrally managed to ensure consistency across tests
 */
const ALLOWED_ICON_SIZES = new Set<ButtonSize>(["sm", "md", "lg", "toolbar"]);

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Icon button props
 * @description Configuration for IconButton (Button with variant='icon' and iconOnly=true)
 * Excludes variant and iconOnly as they're fixed, and children is always allowed
 */
export interface IconButtonProps
  extends Omit<ButtonProps, "variant" | "iconOnly" | "children"> {
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
  const [local, rest] = splitProps(props, ["size", "children"]);

  // Type guard: validate size is one of allowed ButtonSize values
  const isValidSize = (value: unknown): value is ButtonSize =>
    typeof value === "string" && ALLOWED_ICON_SIZES.has(value as ButtonSize);

  const sizeAccessor = toAccessor(local.size ?? "md");
  const safeSize = createMemo<ButtonSize>(() => {
    const current = sizeAccessor();
    return isValidSize(current) ? current : "md";
  });

  return (
    <Button {...rest} size={safeSize()} variant="icon" iconOnly>
      {local.children}
    </Button>
  );
}
