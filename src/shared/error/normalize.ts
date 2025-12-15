/**
 * @fileoverview Error message normalization helpers.
 *
 * This module centralizes the "unknown -> string" conversion policy.
 * Different layers can select different strategies (e.g. logs vs. UI strings)
 * while sharing the same core implementation.
 */

export type NullishStrategy = 'empty' | 'literal';
export type ObjectStrategy = 'json' | 'string';
export type MessagePropertyNonStringStrategy = 'ignore' | 'stringify';

export type NormalizeErrorMessageOptions = Readonly<{
  /**
   * How to represent null/undefined values.
   * - 'empty': return ''
   * - 'literal': return 'null' or 'undefined'
   */
  nullish?: NullishStrategy;
  /**
   * How to represent plain objects when they have no usable string message.
   * - 'json': JSON.stringify with String() fallback
   * - 'string': String(value)
   */
  object?: ObjectStrategy;
  /**
   * How to handle object values with a `message` property when the message is not a string.
   * - 'ignore': fall back to the object strategy
   * - 'stringify': return String(message ?? '')
   */
  messagePropertyNonString?: MessagePropertyNonStringStrategy;
  /**
   * Whether Error instances without a message should fall back to their name.
   */
  errorFallbackToName?: boolean;
  /**
   * Fallback when an Error has neither message nor name (extremely rare).
   */
  errorUnknownFallback?: string;
}>;

const DEFAULT_OPTIONS: Required<NormalizeErrorMessageOptions> = {
  nullish: 'literal',
  object: 'json',
  messagePropertyNonString: 'ignore',
  errorFallbackToName: true,
  errorUnknownFallback: 'Error',
} as const;

function resolveOptions(
  options?: NormalizeErrorMessageOptions
): Required<NormalizeErrorMessageOptions> {
  return {
    nullish: options?.nullish ?? DEFAULT_OPTIONS.nullish,
    object: options?.object ?? DEFAULT_OPTIONS.object,
    messagePropertyNonString:
      options?.messagePropertyNonString ?? DEFAULT_OPTIONS.messagePropertyNonString,
    errorFallbackToName: options?.errorFallbackToName ?? DEFAULT_OPTIONS.errorFallbackToName,
    errorUnknownFallback: options?.errorUnknownFallback ?? DEFAULT_OPTIONS.errorUnknownFallback,
  };
}

function stringifyObject(value: object, strategy: ObjectStrategy): string {
  if (strategy === 'string') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Normalize unknown error values into a message string with configurable behavior.
 */
export function normalizeErrorMessageWithOptions(
  error: unknown,
  options?: NormalizeErrorMessageOptions
): string {
  const o = resolveOptions(options);

  if (error instanceof Error) {
    if (error.message) {
      return error.message;
    }

    if (o.errorFallbackToName) {
      return error.name || o.errorUnknownFallback;
    }

    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error == null) {
    return o.nullish === 'empty' ? '' : String(error);
  }

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;

    if ('message' in record) {
      const message = record.message;
      if (typeof message === 'string') {
        return message;
      }

      if (o.messagePropertyNonString === 'stringify') {
        return String(message ?? '');
      }
    }

    return stringifyObject(record, o.object);
  }

  return String(error);
}

/**
 * Standard log-oriented normalizer used across the app.
 *
 * Behavior matches the legacy implementation from app-error-reporter:
 * - Error: message or name
 * - object: message (string) or JSON.stringify fallback
 * - null/undefined: literal 'null'/'undefined'
 */
export function normalizeErrorMessage(error: unknown): string {
  return normalizeErrorMessageWithOptions(error, {
    nullish: 'literal',
    object: 'json',
    messagePropertyNonString: 'ignore',
    errorFallbackToName: true,
    errorUnknownFallback: 'Error',
  });
}

/**
 * UI/service-oriented error message extractor.
 *
 * Behavior matches the legacy implementation from error/utils.ts:
 * - Error: message only
 * - object with message: string(message ?? '')
 * - object: String(object)
 * - null/undefined: ''
 */
export function getErrorMessage(error: unknown): string {
  return normalizeErrorMessageWithOptions(error, {
    nullish: 'empty',
    object: 'string',
    messagePropertyNonString: 'stringify',
    errorFallbackToName: false,
    errorUnknownFallback: '',
  });
}
