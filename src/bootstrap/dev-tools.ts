/**
 * Development tools initialization and debugging utilities.
 *
 * Provides diagnostic tools exposed to browser console during development.
 * Tree-shaken in production builds and only operates when `__DEV__` is true.
 *
 * Initialization conditions:
 * - Running in development mode (`import.meta.env.DEV`)
 * - NOT in test mode (unless under Vitest runtime)
 * - Not already registered (idempotent via `devToolsRegistered` flag)
 *
 * Non-critical system: failures are logged as warnings and do not prevent startup.
 *
 * @see {@link reportBootstrapError} for error reporting
 */

import { reportBootstrapError } from '@bootstrap/types';
import { logger } from '@shared/logging/logger';

let devToolsRegistered = false;

// Determine if dev tools should initialize
const isDevMode = import.meta.env.DEV;
const isTestMode = import.meta.env.MODE === 'test';
const isVitestEnv = !!(typeof process !== 'undefined' && process?.env?.VITEST);

/**
 * Initialize development environment debugging tools.
 *
 * Loads and registers diagnostic utilities for debugging services and performance profiling.
 * Safe to call multiple times (idempotent).
 *
 * Behavior in different modes:
 * - **Production**: Tree-shaken (dead code elimination)
 * - **Development**: Full initialization, exposes diagnostic API
 * - **Test Mode (standard)**: Skipped
 * - **Test Mode (Vitest)**: Initializes for debugging test scenarios
 *
 * Failures result in warning logs but do not prevent application startup.
 *
 * @example
 * ```typescript
 * await initializeDevTools();
 * window.__XEG__.diagnostics.run()
 * ```
 */
export async function initializeDevTools(): Promise<void> {
  const shouldInit = isDevMode && (!isTestMode || isVitestEnv);

  if (!shouldInit) {
    if (isDevMode && isTestMode) {
      logger.debug('[dev-tools] Skipped in test mode');
    }
    return;
  }

  if (devToolsRegistered) {
    return;
  }

  try {
    devToolsRegistered = true;

    if (__DEV__) {
      logger.info('🛠️ Development diagnostics ready (run window.__XEG__.diagnostics.run())');
    }
  } catch (error) {
    reportBootstrapError(error, { context: 'dev-tools', logger });
  }
}
