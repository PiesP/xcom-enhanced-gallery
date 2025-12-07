/**
 * @fileoverview Minimal Vendor Type Layer
 * @version 6.0.0 - Deprecated all runtime APIs, types-only module
 *
 * Direct solid-js imports are strongly preferred across the codebase.
 * This module only re-exports types for backward compatibility.
 * All functions are no-ops and will be removed in a future major version.
 *
 * Migration:
 * ```typescript
 * // Before
 * import { getSolid } from '@shared/external/vendors';
 * const { createSignal } = getSolid();
 *
 * // After
 * import { createSignal } from 'solid-js';
 * ```
 */

import type { JSX } from 'solid-js';

// Re-export types only - all runtime imports should use solid-js directly
export type { JSX };
export type JSXElement = JSX.Element;
export type VNode = JSX.Element;
export type ComponentChildren = JSX.Element;

/**
 * @deprecated Use direct solid-js imports instead.
 *             This function is a no-op and will be removed in a future major version.
 *
 * Migration: Replace `await initializeVendors()` with direct solid-js imports.
 */
export async function initializeVendors(): Promise<void> {
  // No-op: vendors are loaded via direct imports
}

/**
 * @deprecated No cleanup needed with direct imports.
 *             This function is a no-op and will be removed in a future major version.
 */
export function cleanupVendors(): void {
  // No-op
}

/**
 * @deprecated No cleanup registration needed.
 *             This function is a no-op and will be removed in a future major version.
 */
export function registerVendorCleanupOnUnload(): void {
  // No-op
}

/**
 * @deprecated Vendors are always available with bundled imports.
 *             This function is a no-op and will be removed in a future major version.
 *             Always returns true.
 */
export function isVendorsInitialized(): boolean {
  return true;
}
