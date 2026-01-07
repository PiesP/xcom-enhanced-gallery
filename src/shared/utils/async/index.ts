/**
 * @fileoverview Async utilities index
 * @description
 * This module provides utilities for async operations and promise handling.
 *
 * ⚠️ DIRECT IMPORTS PREFERRED
 * Import directly from individual modules instead of using this index:
 *
 * @example
 * ```typescript
 * import { promisifyCallback } from '@shared/utils/async/promise-helpers';
 * import { attachAbortListener } from '@shared/utils/async/abort-helpers';
 * ```
 *
 * Barrel exports are discouraged per coding standards.
 * See: CODING_STANDARDS.md § 3.2 "No Barrel Imports"
 */

export { attachAbortListener, isSignalAborted, onSignalAbort } from './abort-helpers';
// Re-exports for backward compatibility (migration in progress)
export { createDeferred, promisifyCallback, promisifyVoidCallback } from './promise-helpers';
export type {
  Deferred,
  PromisifyOptions,
  ResultCallback,
  VoidCallback,
} from './promise-helpers.types';
