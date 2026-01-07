/**
 * @fileoverview Development tools initialization and debugging utilities
 *
 * Provides development-only diagnostic tools and debugging utilities that are exposed
 * to the browser console during development. This module is tree-shaken in production
 * builds and only operates when `__DEV__` flag is true.
 *
 * ## Purpose
 *
 * - **Service Diagnostics**: Load and expose service diagnostic tools
 * - **Global API**: Register debugging API in browser console (window.__XEG__.diagnostics)
 * - **State Inspection**: Enable ServiceManager state diagnosis
 * - **Event Profiling**: Initialize listener profiler for performance analysis
 *
 * ## Initialization Conditions
 *
 * Dev tools are initialized only when:
 * 1. Running in development mode (`import.meta.env.DEV`)
 * 2. NOT in test mode (unless explicitly allowed via Vitest runtime detection)
 * 3. Not already registered (idempotent via `devToolsRegistered` flag)
 *
 * ## Error Handling Strategy
 *
 * This is a non-critical bootstrap system. Failures are logged as warnings but do not
 * prevent application startup. This ensures debugging tools never break the application.
 *
 * ## Historical Context
 *
 * - **Phase 2.1**: Initial development environment debugging tools
 * - **Phase 343**: Standardized error handling (non-critical, warn-only)
 * - **Phase 420.3**: Added listener profiler initialization
 *
 * @see {@link reportBootstrapError} for error reporting implementation
 */

import { reportBootstrapError } from '@bootstrap/types';
import { logger } from '@shared/logging/logger';

/**
 * Flag tracking whether dev tools have been registered
 *
 * Prevents duplicate initialization of diagnostic tools. Set to true after successful
 * registration of service diagnostic API.
 */
let devToolsRegistered = false;

/**
 * Detect if running in test mode
 *
 * Checks Vite environment mode to determine if the current execution context is a test
 * environment. Dev tools are typically disabled in test mode unless explicitly allowed.
 */
const isTestMode = import.meta.env.MODE === 'test';

/**
 * Detect if running under Vitest runtime
 *
 * Checks for Vitest-specific process environment variable to determine if tests are
 * executing under the Vitest test runner.
 */
const isVitestRuntime = !!(typeof process !== 'undefined' && process?.env?.VITEST);

/**
 * Allow dev tools in test environments when running under Vitest
 *
 * Enables debugging tools during Vitest test execution for development and debugging
 * of test scenarios.
 */
const allowDevToolsInTests = isTestMode && isVitestRuntime;

/**
 * Determine if dev tools should be initialized
 *
 * Dev tools are enabled in development mode, excluding test mode unless Vitest runtime
 * is detected (which allows debugging during test development).
 */
const shouldInitializeDevTools = import.meta.env.DEV && (allowDevToolsInTests || !isTestMode);

/**
 * Detect if running in development mode with test environment
 *
 * Used for conditional debug logging to avoid verbose output during standard test runs.
 */
const isDevTestRuntime = import.meta.env.DEV && isTestMode;

/**
 * Initialize development environment debugging tools
 *
 * Loads and registers diagnostic utilities for debugging services, state inspection,
 * and performance profiling. This function is safe to call multiple times due to
 * idempotency checks.
 *
 * The initialization process:
 * 1. **Condition Check**: Verify dev tools should initialize (dev mode, not test mode)
 * 2. **Duplicate Prevention**: Skip if already registered
 * 3. **Service Diagnostics**: Load diagnostic API (intentionally omitted in userscript bundle)
 * 4. **Global Registration**: Expose diagnostics via window.__XEG__.diagnostics
 * 5. **Confirmation Log**: Notify console that diagnostics are ready
 *
 * ## Behavior in Different Modes
 *
 * - **Production**: Entire function is tree-shaken (dead code elimination)
 * - **Development**: Full initialization, exposes diagnostic API
 * - **Test Mode (standard)**: Skipped, logs debug message
 * - **Test Mode (Vitest)**: Initializes for debugging test scenarios
 *
 * ## Error Handling
 *
 * This is a non-critical system. Failures result in warning logs but do not throw
 * exceptions or prevent application startup. The error is reported via the standardized
 * bootstrap error reporting mechanism.
 *
 * @returns Promise that resolves when dev tools initialization completes or is skipped
 *
 * @example
 * ```typescript
 * // During bootstrap sequence
 * await initializeDevTools();
 *
 * // After initialization, use in browser console
 * window.__XEG__.diagnostics.run()
 * ```
 *
 * @remarks
 * The diagnostic tools loaded by this function are intentionally excluded from the
 * userscript bundle to minimize bundle size. They exist only in development builds.
 */
export async function initializeDevTools(): Promise<void> {
  if (!shouldInitializeDevTools) {
    if (isDevTestRuntime) {
      logger.debug('[dev-tools] Initialization skipped (test mode)');
    }
    return;
  }

  if (devToolsRegistered) {
    return;
  }

  try {
    // Service diagnostic tools (intentionally omitted in the userscript bundle).
    devToolsRegistered = true;

    if (__DEV__) {
      logger.info('🛠️ Development diagnostics ready (run window.__XEG__.diagnostics.run())');
    }
  } catch (error) {
    // Phase 343: Standardized error handling (Non-Critical - warn only)
    reportBootstrapError(error, { context: 'dev-tools', logger });
  }
}
