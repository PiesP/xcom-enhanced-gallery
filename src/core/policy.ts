/**
 * @fileoverview Runtime policy constants and error handling utilities
 * @module core/policy
 */

import { normalizeErrorMessage } from '@shared/error/normalize';

/** Storage key for persisting command runtime state. */
export const COMMAND_RUNTIME_STORAGE_KEY = 'xeg:command-runtime:v1';

/** Default tick interval in milliseconds for scheduled tasks (30 seconds). */
export const COMMAND_RUNTIME_DEFAULT_TICK_MS = 30_000;

/** Formats error message with normalization. */
export function formatErrorMessage(error: unknown): string {
  return normalizeErrorMessage(error);
}

// ============================================================================
// Type Helpers
// ============================================================================

/** Policy constant keys union type. */
export type PolicyConstantKey = 'COMMAND_RUNTIME_STORAGE_KEY' | 'COMMAND_RUNTIME_DEFAULT_TICK_MS';

/** Storage key pattern validation type. */
export type StorageKeyPattern = `xeg:${string}:v${number}`;

/** Branded type for timing policy values in milliseconds. */
export type TimingPolicyMs = number & { readonly __brand: 'TimingPolicyMs' };

/** Error formatter function signature. */
export type ErrorFormatter = (error: unknown) => string;
