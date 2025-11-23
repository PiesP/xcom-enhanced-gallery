/**
 * @fileoverview Component common utilities
 * @description Phase 2-3A: Common utility functions separated from StandardProps
 * @version 1.0.0
 */

/**
 * Create standard class names
 */
export function createClassName(
  ...classes: (string | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}
