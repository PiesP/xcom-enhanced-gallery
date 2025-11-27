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
  return isNaN(result) ? 0 : result;
}

/**
 * Safe parseFloat function
 */
export function safeParseFloat(value: string | undefined | null): number {
  const result = parseFloat(value as string);
  return isNaN(result) ? 0 : result;
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
 * Clamp a number between 0 and 1
 */
export function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
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

// ========== DOM/Event type guards ==========

/**
 * EventListener-compatible function wrapper (for TypeScript strict mode)
 */
export function createEventListener<T extends Event = Event>(
  handler: (this: EventTarget, event: T) => void
): EventListener {
  return handler as unknown as EventListener;
}

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
