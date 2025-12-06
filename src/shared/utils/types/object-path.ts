/**
 * @fileoverview Nested object path utilities for deep property access
 * @description Provides type-safe nested property resolution and assignment.
 *              Simplified from original implementation - only exports what's actually used.
 * @version 2.0.0 - Simplified (removed unused hasNestedPath, deleteNestedPath)
 */

/**
 * Options for nested value assignment
 */
export interface AssignOptions {
  /** Create intermediate objects if they don't exist (default: true) */
  readonly createIntermediate?: boolean;
}

/**
 * Resolve a nested value from an object using a dot-separated path.
 *
 * @param source - Source object to traverse
 * @param path - Dot-separated path string (e.g., 'display.theme.mode')
 * @returns The resolved value or undefined if path doesn't exist
 *
 * @example
 * ```typescript
 * const obj = { display: { theme: { mode: 'dark' } } };
 * resolveNestedPath(obj, 'display.theme.mode'); // 'dark'
 * resolveNestedPath(obj, 'display.missing'); // undefined
 * ```
 */
export function resolveNestedPath<T = unknown>(source: unknown, path: string): T | undefined {
  if (!source || typeof source !== 'object' || !path) {
    return undefined;
  }

  const keys = path.split('.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = source;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }

  return current as T | undefined;
}

/**
 * Assign a value to a nested path in an object using a dot-separated path.
 *
 * @param target - Target object to modify (mutates in place)
 * @param path - Dot-separated path string (e.g., 'display.theme.mode')
 * @param value - Value to assign at the path
 * @param options - Assignment options
 * @returns True if assignment was successful
 *
 * @example
 * ```typescript
 * const obj = { display: { theme: {} } };
 * assignNestedPath(obj, 'display.theme.mode', 'dark');
 * // obj is now { display: { theme: { mode: 'dark' } } }
 * ```
 */
export function assignNestedPath<T = unknown>(
  target: unknown,
  path: string,
  value: T,
  options?: AssignOptions
): boolean {
  if (!target || typeof target !== 'object' || !path) {
    return false;
  }

  const keys = path.split('.');
  if (keys.length === 0) {
    return false;
  }

  const createIntermediate = options?.createIntermediate !== false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue;

    if (!current[key] || typeof current[key] !== 'object') {
      if (!createIntermediate) {
        return false;
      }
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
    return true;
  }

  return false;
}
