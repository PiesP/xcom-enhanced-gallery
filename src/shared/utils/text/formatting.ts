/**
 * @fileoverview Utilities for text formatting and class name composition.
 */

/**
 * Class name record mapping strings to conditional values.
 */
type ClassRecord = Record<string, boolean | undefined | null>;

/**
 * Supported class value types for conditional class composition.
 *
 * Supports: strings, numbers, conditional values (boolean, undefined, null),
 * conditional objects, and nested arrays (recursive).
 */
type ClassValue = string | number | boolean | undefined | null | ClassRecord | ClassValue[];

/**
 * Escapes special regex characters in strings.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Combines class names with conditional logic, handling strings, arrays, and objects.
 */
export function cx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cx(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input as ClassRecord)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}
