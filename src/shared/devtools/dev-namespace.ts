/**
 * @fileoverview Shared helper for exposing the development namespace (`__XEG__`).
 *
 * Ensures that we only create and mutate the global namespace while running in
 * development builds, preventing duplicate exposure logic across modules.
 *
 * @module devtools/dev-namespace
 */

/**
 * Development namespace structure exposed as `window.__XEG__`.
 *
 * Contains diagnostic segments for debugging and development tools.
 * Properties are mutable to allow dynamic configuration at runtime.
 */
interface DevNamespace {
  /** Main application diagnostic data */
  main?: Record<string, unknown>;
  /** Diagnostic and health check data */
  diagnostics?: Record<string, unknown>;
  /** Tracing and performance monitoring data */
  tracing?: Record<string, unknown>;
  /** Additional extensible diagnostic segments */
  [segment: string]: unknown;
}

/**
 * Global host type extended with development namespace.
 */
type DevNamespaceHost = typeof globalThis & {
  /** Development namespace (dev builds only) */
  __XEG__?: DevNamespace;
};

/**
 * Internal helper to allow mocking in tests.
 *
 * @internal
 */
const _env = {
  get DEV(): boolean {
    return import.meta.env.DEV;
  },
} as const;

/**
 * Ensure development namespace exists on globalThis.
 *
 * Creates the namespace if it doesn't exist (dev builds only).
 *
 * @returns The development namespace, or `undefined` in production builds
 * @internal
 */
function ensureDevNamespace(): DevNamespace | undefined {
  if (!_env.DEV) {
    return undefined;
  }

  const host = globalThis as DevNamespaceHost;
  host.__XEG__ = host.__XEG__ ?? {};
  return host.__XEG__;
}

/**
 * Mutate the global development namespace when running in dev mode.
 *
 * Allows diagnostic modules to expose data to `window.__XEG__` for
 * debugging purposes. No-op in production builds.
 *
 * @param mutator - Callback to modify the namespace object
 *
 * @example
 * ```typescript
 * mutateDevNamespace((ns) => {
 *   ns.main = { version: '1.0.0', buildDate: Date.now() };
 * });
 * ```
 */
export function mutateDevNamespace(mutator: (namespace: DevNamespace) => void): void {
  const namespace = ensureDevNamespace();
  if (!namespace) {
    return;
  }

  mutator(namespace);
}
