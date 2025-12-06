/**
 * @fileoverview Type Safety Helper Functions
 * @version 4.0.0 - Optimized: Only actively used functions (Phase 326.5 Quick Wins)
 * @description Helper functions for exactOptionalPropertyTypes and strict type checking
 */

// ========== Number/String parsing utilities ==========

/**
 * Safe parseInt function
 * @param value - String to parse (null/undefined allowed)
 * @param radix - Radix (default: 10)
 * @returns Parsed integer or 0 (on parse failure)
 */
export function safeParseInt(value: string | undefined | null, radix: number = 10): number {
  const result = parseInt(value as string, radix);
  return Number.isNaN(result) ? 0 : result;
}

/**
 * Safe parseFloat function
 */
export function safeParseFloat(value: string | undefined | null): number {
  const result = parseFloat(value as string);
  return Number.isNaN(result) ? 0 : result;
}

// ========== Type conversion utilities ==========

/**
 * Convert undefined to null
 */
export function undefinedToNull<T>(value: T | undefined): T | null {
  return value ?? null;
}

/**
 * Apply string default value
 */
export function stringWithDefault(value: string | undefined, defaultValue: string = ''): string {
  return value ?? defaultValue;
}

// ========== Number utilities ==========

/**
 * Clamp a number within a range
 * @param value - Number to clamp
 * @param min - Minimum value (default: 0)
 * @param max - Maximum value (default: 1)
 * @returns Clamped value
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamp an index within array bounds (0 to length-1)
 * @param index - Index to clamp
 * @param length - Array length (must be > 0)
 * @returns Valid index, or 0 if length <= 0
 */
export function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index) || length <= 0) {
    return 0;
  }
  return clamp(Math.floor(index), 0, length - 1);
}

// ========== Element validation utilities ==========

/**
 * Safe HTMLElement validation
 */
export function safeElementCheck<T extends Element>(element: T | undefined | null): element is T {
  return element != null;
}

// ========== Domain-specific utilities ==========

/**
 * Safe tweet ID generation - prioritize crypto.randomUUID()
 */
export function safeTweetId(value: string | undefined): string {
  if (!value || value.trim() === '') {
    try {
      // Use crypto.randomUUID() (Node.js 16+, modern browsers)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `generated_${crypto.randomUUID()}`;
      }
    } catch {
      // Fallback on crypto.randomUUID() failure
    }

    // Fallback: enhanced random generation
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `generated_${timestamp}_${random}`;
  }
  return value;
}

// ========== Userscript type guards ==========

/**
 * Validate that global object has required properties
 */
export function isGlobalLike(obj: unknown): obj is typeof globalThis {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const objRecord = obj as Record<string, unknown>;
  return (
    typeof objRecord.requestIdleCallback === 'function' ||
    typeof objRecord.setTimeout === 'function'
  );
}

/**
 * Check if GM_info object has valid script info
 */
export function isGMUserScriptInfo(obj: unknown): obj is { scriptHandler?: string } {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const objRecord = obj as Record<string, unknown>;
  return 'scriptHandler' in objRecord || Object.keys(objRecord).length > 0;
}

// ========== Deep clone utilities ==========

/**
 * Deep clone a value using structuredClone or JSON fallback
 * @param value - Value to clone
 * @returns Deep cloned value
 */
export function cloneDeep<T>(value: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}
