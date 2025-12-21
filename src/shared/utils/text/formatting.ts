/**
 * @fileoverview Class name helpers.
 */

/**
 * ClassValue type for cx function.
 */
export type ClassValue = string | number | boolean | undefined | null | ClassRecord | ClassArray;

/**
 * Object mapping class names to boolean conditions
 */
export type ClassRecord = Record<string, boolean | undefined | null>;

/**
 * Array of class values (can be nested).
 */
export interface ClassArray extends Array<ClassValue> {}

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

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cx(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
