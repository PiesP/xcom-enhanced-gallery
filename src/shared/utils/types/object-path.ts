/**
 * @fileoverview Nested object path utilities for deep property access
 * @description Provides type-safe nested property resolution and assignment.
 *              Simplified from original implementation - only exports what's actually used.
 * @version 2.1.0 - Added prototype pollution protection
 */

/**
 * Keys that are forbidden to prevent prototype pollution attacks.
 * These keys can be used to modify Object.prototype and affect all objects.
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Check if a key is safe to use for property access/assignment.
 * Prevents prototype pollution by blocking dangerous keys.
 *
 * @param key - The key to validate
 * @returns True if the key is safe to use
 */
function isSafeKey(key: string): boolean {
  return !FORBIDDEN_KEYS.has(key);
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
  if (!path) return undefined;

  const keys = path.split('.');

  let current: unknown = source;

  for (const key of keys) {
    // Guard against prototype pollution
    if (!isSafeKey(key)) {
      return undefined;
    }
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
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

  // Guard against prototype pollution - check all keys upfront
  for (const key of keys) {
    if (!isSafeKey(key)) {
      return false;
    }
  }

  const createIntermediate = options?.createIntermediate !== false;

  let current: Record<string, unknown> = target as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key || !isSafeKey(key)) continue;

    // Use Object.getOwnPropertyDescriptor to avoid prototype chain traversal
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    const hasOwnKey = descriptor !== undefined;
    const existingValue = hasOwnKey ? descriptor.value : undefined;

    if (!hasOwnKey || typeof existingValue !== 'object' || existingValue === null) {
      if (!createIntermediate) {
        return false;
      }
      // Create a clean object without prototype pollution risk
      const newObj = Object.create(null);
      Object.defineProperty(current, key, {
        value: newObj,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      current = newObj;
    } else {
      current = existingValue as Record<string, unknown>;
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey && isSafeKey(lastKey)) {
    // Use Object.defineProperty to safely assign without prototype pollution
    Object.defineProperty(current, lastKey, {
      value: value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return true;
  }

  return false;
}
