/**
 * @fileoverview Shared helper for exposing the development namespace (`__XEG__`).
 *
 * Ensures that we only create and mutate the global namespace while running in
 * development builds, preventing duplicate exposure logic across modules.
 */

export interface DevNamespace {
  main?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  tracing?: Record<string, unknown>;
  [segment: string]: unknown;
}

type DevNamespaceHost = typeof globalThis & {
  __XEG__?: DevNamespace;
};

function ensureDevNamespace(): DevNamespace | undefined {
  if (!import.meta.env.DEV) {
    return undefined;
  }

  const host = globalThis as DevNamespaceHost;
  host.__XEG__ = host.__XEG__ ?? {};
  return host.__XEG__;
}

/**
 * Mutate the global development namespace when running in dev mode.
 */
export function mutateDevNamespace(
  mutator: (namespace: DevNamespace) => void,
): void {
  const namespace = ensureDevNamespace();
  if (!namespace) {
    return;
  }

  mutator(namespace);
}

/**
 * Retrieve the current development namespace (dev mode only).
 */
export function getDevNamespace(): DevNamespace | undefined {
  if (!import.meta.env.DEV) {
    return undefined;
  }

  const host = globalThis as DevNamespaceHost;
  return host.__XEG__;
}
