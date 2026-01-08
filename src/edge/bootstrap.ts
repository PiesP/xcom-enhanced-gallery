/**
 * @fileoverview Edge layer bootstrap initialization for development command runtime.
 * Initializes and manages lifecycle of the command runtime for keyboard shortcuts.
 * @module edge/bootstrap
 */

import type { CommandRuntimeHandle } from '@edge/runtime';
import { startCommandRuntime } from '@edge/runtime';

/**
 * Module-level runtime instance storage for singleton pattern.
 * @internal
 */
let runtime: CommandRuntimeHandle | null = null;

/**
 * Start the development command runtime and return cleanup function.
 * Initializes global command runtime (idempotent). Returns a cleanup function
 * that must be called to stop the runtime.
 * @returns Cleanup function that stops runtime and resets module state.
 */
export function startDevCommandRuntime(): () => void {
  if (!runtime) {
    runtime = startCommandRuntime();
  }

  return () => {
    runtime?.stop();
    runtime = null;
  };
}
