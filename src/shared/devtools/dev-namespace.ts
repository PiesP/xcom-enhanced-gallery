/**
 * @fileoverview Expose development namespace (`__XEG__`) for diagnostics.
 * @description Centralized namespace creation to prevent duplicate logic.
 */

interface DevNamespace {
  main?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  tracing?: Record<string, unknown>;
  [segment: string]: unknown;
}

type DevNamespaceHost = typeof globalThis & {
  __XEG__?: DevNamespace;
};

const _env = {
  get DEV(): boolean {
    return import.meta.env.DEV;
  },
} as const;

/**
 * Ensure development namespace exists on globalThis (dev builds only).
 * @returns The development namespace, or `undefined` in production
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
 * Mutate the global development namespace in dev mode.
 * Allows diagnostic modules to expose data to `window.__XEG__`. No-op in production.
 * @param mutator - Callback to modify the namespace object
 */
export function mutateDevNamespace(mutator: (namespace: DevNamespace) => void): void {
  const namespace = ensureDevNamespace();
  if (!namespace) {
    return;
  }

  mutator(namespace);
}
