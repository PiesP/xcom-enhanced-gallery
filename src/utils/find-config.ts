/**
 * Browser-safe config path helpers.
 *
 * This module intentionally avoids Node.js built-ins (node:fs/node:path) so it
 * can never break the browser bundle if imported by mistake.
 *
 * The Node-only implementation lives in `scripts/utils/find-config.ts`.
 */

const DEFAULT_BASE = '.';

function normalizeSlash(input: string): string {
  return input.replaceAll('\\\\', '/');
}

function joinPaths(base: string, relative: string): string {
  const a = normalizeSlash(base).replace(/\/+$/, '');
  const b = normalizeSlash(relative).replace(/^\/+/, '');
  if (!a) return b;
  if (!b) return a;
  return `${a}/${b}`;
}

/**
 * Return a deterministic, browser-safe path-like string.
 *
 * Note: This does not probe the filesystem. If you need real discovery,
 * use the Node-only implementation in `scripts/utils/find-config.ts`.
 */
export function findConfig(relative: string, base?: string): string {
  const effectiveBase = typeof base === 'string' && base.trim() ? base : DEFAULT_BASE;
  return joinPaths(effectiveBase, relative);
}

export function findConfigAny(candidates: string[], base?: string): string {
  const first = candidates[0];
  if (!first) {
    throw new Error('findConfigAny requires at least one candidate');
  }
  return findConfig(first, base);
}
