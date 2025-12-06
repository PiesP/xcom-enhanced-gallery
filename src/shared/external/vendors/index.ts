/**
 * @fileoverview Minimal Vendor Type Layer
 * @version 5.0.0 - Types-only exports, no runtime API wrapper
 *
 * Direct solid-js imports are preferred across the codebase.
 * This module only re-exports types for backward compatibility.
 */

import type { JSX } from 'solid-js';

// Re-export types only - all runtime imports should use solid-js directly
export type { JSX };
export type JSXElement = JSX.Element;
export type VNode = JSX.Element;
export type ComponentChildren = JSX.Element;

/**
 * @deprecated Use direct solid-js imports instead.
 * Kept for backward compatibility with existing code.
 */
export async function initializeVendors(): Promise<void> {
  // No-op: vendors are loaded via direct imports
}

/**
 * @deprecated No cleanup needed with direct imports.
 */
export function cleanupVendors(): void {
  // No-op
}

/**
 * @deprecated No cleanup registration needed.
 */
export function registerVendorCleanupOnUnload(): void {
  // No-op
}

/**
 * @deprecated Vendors are always available with bundled imports.
 */
export function isVendorsInitialized(): boolean {
  return true;
}
