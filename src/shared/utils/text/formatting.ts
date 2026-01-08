/**
 * @fileoverview Utilities for text formatting and class name composition.
 */

/**
 * Object mapping class names to boolean conditions.
 */
type ClassRecord = Record<string, boolean | undefined | null>;

/**
 * ClassValue type for cx function.
 *
 * Supports:
 * - strings and numbers
 * - conditional values (boolean, undefined, null)
 * - nested objects with conditions
 * - nested arrays (recursive)
 */
type ClassValue = string | number | boolean | undefined | null | ClassRecord | ClassValue[];

/**
 * Escapes text for safe use in RegExp patterns.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Combines class names with conditional logic.
 */
export function cx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    const inputType = typeof input;
    if (inputType === 'string' || inputType === 'number') {
      classes.push(String(input));
      continue;
    }

    if (Array.isArray(input)) {
      const nested = cx(...input);
      if (nested) classes.push(nested);
      continue;
    }

    if (inputType === 'object' && input !== null && !Array.isArray(input)) {
      const record = input as ClassRecord;
      for (const key in record) {
        if (record[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
