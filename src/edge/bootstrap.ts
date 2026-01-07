/**
 * @fileoverview Edge layer bootstrap initialization for development command runtime
 *
 * Provides initialization and lifecycle management for the development command runtime
 * in the Edge layer (browser/userscript context). The command runtime handles keyboard
 * shortcuts and development utilities that require browser-level access.
 *
 * @remarks
 * **Purpose**:
 * - Initialize command runtime for keyboard shortcut handling
 * - Manage runtime lifecycle (start/stop)
 * - Provide cleanup mechanism for proper resource release
 *
 * **Architecture Pattern**:
 * - **Layer**: Edge (browser/userscript context)
 * - **Scope**: Global command runtime singleton
 * - **Lifecycle**: Start on demand, clean up via returned function
 * - **State**: Module-level variable tracks runtime instance
 *
 * **Design Principles**:
 * 1. **Lazy Initialization**: Runtime created only when startDevCommandRuntime() called
 * 2. **Single Instance**: Only one runtime per module (idempotent start)
 * 3. **Explicit Cleanup**: Caller gets cleanup function, responsible for calling it
 * 4. **Null Safety**: Handles null/undefined gracefully with optional chaining
 * 5. **Module Scope**: Runtime state isolated at module level
 *
 * **Initialization Flow**:
 * 1. Call startDevCommandRuntime() to initialize runtime
 * 2. If runtime doesn't exist, startCommandRuntime() creates it
 * 3. If runtime already exists, reuses existing instance
 * 4. Returns cleanup function for caller to use
 *
 * **Cleanup Strategy**:
 * - Caller must invoke returned function to stop runtime
 * - Cleanup function resets module-level runtime variable to null
 * - Allows re-initialization if needed later
 * - Optional chaining prevents errors if cleanup called multiple times
 *
 * **Related Components**:
 * - CommandRuntimeHandle: Runtime instance interface from @edge/runtime
 * - startCommandRuntime: Factory function that creates runtime instance
 * - Edge layer: Browser/userscript execution context
 *
 * @module edge/bootstrap
 * @see {@link CommandRuntimeHandle} for runtime interface
 * @see {@link startCommandRuntime} for runtime factory
 */

import type { CommandRuntimeHandle } from '@edge/runtime';
import { startCommandRuntime } from '@edge/runtime';

/**
 * Module-level runtime instance storage
 *
 * Maintains single CommandRuntimeHandle across multiple calls to
 * startDevCommandRuntime(). Initialized to null and updated when
 * runtime is created. Persists until explicitly reset via cleanup.
 *
 * @internal
 */
let runtime: CommandRuntimeHandle | null = null;

/**
 * Start the development command runtime and return cleanup function
 *
 * Initializes the global command runtime for development utilities and
 * keyboard shortcuts. If runtime already exists, reuses it. Returns a
 * cleanup function that must be called to stop the runtime and release
 * resources.
 *
 * @returns Cleanup function that stops runtime and resets module state
 *
 * @remarks
 * **Behavior**:
 * - Checks if runtime already initialized (null check)
 * - If not initialized, calls startCommandRuntime() to create instance
 * - Returns a function that caller can use to stop runtime
 * - Returned function clears module-level runtime variable
 *
 * **Idempotent Start**:
 * - Multiple calls to startDevCommandRuntime() safe
 * - Only first call actually initializes runtime
 * - Subsequent calls return different cleanup functions
 * - Each cleanup function works independently
 *
 * **Cleanup Responsibility**:
 * - Caller must invoke returned function when done
 * - Cleanup stops runtime via runtime.stop()
 * - Cleanup resets runtime to null (allows re-init)
 * - Safe to call cleanup multiple times (optional chaining)
 *
 * **Resource Management**:
 * - Command runtime may allocate keyboard listeners
 * - May create event handlers, timers, DOM observers
 * - Cleanup ensures all resources released
 * - Important for avoiding memory leaks
 *
 * **Side Effects**:
 * - Calls startCommandRuntime() (once, then cached)
 * - Creates global command runtime state
 * - Returns function with closure over module runtime variable
 *
 * **Type Safety**:
 * - Returns typed cleanup function: () => void
 * - Optional chaining (?.) prevents null reference errors
 * - runtime.stop() called only if runtime exists
 *
 * @example
 * Initialize and cleanup runtime:
 *
 * const cleanup = startDevCommandRuntime();
 * // ... use command runtime for shortcuts, etc.
 * cleanup(); // Stop runtime when done
 *
 * Multiple initializations (reuses same instance):
 *
 * const cleanup1 = startDevCommandRuntime();
 * const cleanup2 = startDevCommandRuntime(); // Same runtime, different cleanup
 * cleanup1(); // Stops runtime
 * cleanup2(); // Safe to call, optional chaining prevents error
 *
 * Conditional cleanup:
 *
 * const cleanup = startDevCommandRuntime();
 * try {
 *   // Use development features
 * } finally {
 *   cleanup(); // Ensures cleanup even if error occurs
 * }
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
