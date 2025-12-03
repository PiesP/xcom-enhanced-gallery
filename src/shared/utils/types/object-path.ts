/**
 * @fileoverview Nested object path utilities for deep property access
 * @description Extracted from SettingsService for reusability across the codebase.
 *              Provides type-safe nested property resolution and assignment.
 * @version 1.0.0
 */

/**
 * Result of a nested value resolution
 */
export interface NestedValueResult<T> {
  /** Whether the path was successfully resolved */
  readonly found: boolean;
  /** The resolved value, or undefined if not found */
  readonly value: T | undefined;
}

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
  return resolveNestedValue<T>(source, keys);
}

/**
 * Resolve a nested value from an object using an array of keys.
 *
 * @param source - Source object to traverse
 * @param keys - Array of property keys to traverse
 * @returns The resolved value or undefined if path doesn't exist
 *
 * @example
 * ```typescript
 * const obj = { display: { theme: { mode: 'dark' } } };
 * resolveNestedValue(obj, ['display', 'theme', 'mode']); // 'dark'
 * ```
 */
export function resolveNestedValue<T = unknown>(source: unknown, keys: string[]): T | undefined {
  if (!source || typeof source !== 'object' || keys.length === 0) {
    return source as T | undefined;
  }

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
  options?: AssignOptions,
): boolean {
  if (!target || typeof target !== 'object' || !path) {
    return false;
  }

  const keys = path.split('.');
  return assignNestedValue(target, keys, value, options);
}

/**
 * Assign a value to a nested path in an object using an array of keys.
 *
 * @param target - Target object to modify (mutates in place)
 * @param keys - Array of property keys to traverse
 * @param value - Value to assign at the path
 * @param options - Assignment options
 * @returns True if assignment was successful
 *
 * @example
 * ```typescript
 * const obj = { display: { theme: {} } };
 * assignNestedValue(obj, ['display', 'theme', 'mode'], 'dark');
 * ```
 */
export function assignNestedValue<T = unknown>(
  target: unknown,
  keys: string[],
  value: T,
  options?: AssignOptions,
): boolean {
  if (!target || typeof target !== 'object' || keys.length === 0) {
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

/**
 * Check if a nested path exists in an object.
 *
 * @param source - Source object to check
 * @param path - Dot-separated path string
 * @returns True if the path exists (value may still be undefined)
 *
 * @example
 * ```typescript
 * const obj = { display: { theme: { mode: undefined } } };
 * hasNestedPath(obj, 'display.theme.mode'); // true
 * hasNestedPath(obj, 'display.missing'); // false
 * ```
 */
export function hasNestedPath(source: unknown, path: string): boolean {
  if (!source || typeof source !== 'object' || !path) {
    return false;
  }

  const keys = path.split('.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = source;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key) continue;

    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }

    if (!(key in current)) {
      return false;
    }

    current = current[key];
  }

  return true;
}

/**
 * Delete a nested path from an object.
 *
 * @param target - Target object to modify
 * @param path - Dot-separated path string
 * @returns True if the path was deleted
 *
 * @example
 * ```typescript
 * const obj = { display: { theme: { mode: 'dark' } } };
 * deleteNestedPath(obj, 'display.theme.mode');
 * // obj is now { display: { theme: {} } }
 * ```
 */
export function deleteNestedPath(target: unknown, path: string): boolean {
  if (!target || typeof target !== 'object' || !path) {
    return false;
  }

  const keys = path.split('.');
  if (keys.length === 0) {
    return false;
  }

  if (keys.length === 1) {
    const key = keys[0];
    if (key && key in (target as Record<string, unknown>)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (target as any)[key];
      return true;
    }
    return false;
  }

  const parentPath = keys.slice(0, -1);
  const lastKey = keys[keys.length - 1];

  const parent = resolveNestedValue<Record<string, unknown>>(target, parentPath);

  if (parent && typeof parent === 'object' && lastKey && lastKey in parent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (parent as any)[lastKey];
    return true;
  }

  return false;
}
