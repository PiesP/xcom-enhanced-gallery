/**
 * @fileoverview Shared logic for deriving Vite alias entries from tsconfig `compilerOptions.paths`.
 *
 * This module is intentionally pure and reusable across different workspaces.
 * Callers are responsible for reading tsconfig.json and providing a resolver that
 * maps normalized tsconfig targets to absolute filesystem paths.
 */

export type TsconfigPaths = Record<string, readonly string[]>;

export type ViteAliasEntry = {
  readonly find: string | RegExp;
  readonly replacement: string;
};

/**
 * Escape special regex characters in a string for use in RegExp patterns.
 * @param input - The string to escape
 * @returns The escaped string safe for regex use
 */
function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert a TypeScript path alias key to a Vite-compatible find pattern.
 * Handles wildcards and exact matches appropriately.
 *
 * @param key - The TypeScript path alias key (e.g., "@shared/*" or "@core")
 * @returns A string for prefix matching or RegExp for exact matching; null to skip
 *
 * Conversions:
 * - "*" (catch-all) → null (skipped, not meaningful for bundler)
 * - "@shared/*" → "@shared/" (prefix match)
 * - "@core" → /^@core$/ (exact match with regex)
 */
function toViteFind(key: string): string | RegExp | null {
  // Ignore catch-all mappings (not meaningful for bundler aliasing)
  if (key === '*') {
    return null;
  }

  // Convert TS-style wildcard aliases into prefix aliases.
  // - "@shared/*" -> "@shared/"
  // - "@/*" -> "@/"
  if (key.endsWith('/*')) {
    return key.slice(0, -1);
  }

  // Exact match aliases must not match subpaths in Vite (string aliases are
  // prefix-based). Use a regex to preserve TypeScript semantics.
  return new RegExp(`^${escapeRegExp(key)}$`);
}

/**
 * Normalize a TypeScript path alias target to a consistent format.
 * Removes leading "./" and converts wildcard patterns to directory paths.
 *
 * @param target - The TypeScript path target (e.g., "./src/shared/*" or "src/shared")
 * @returns The normalized target suitable for further processing
 */
function normalizeAliasTarget(target: string): string {
  // Remove leading "./" for stable path resolution.
  let out = target.replace(/^\.\//, '');

  // Convert TS-style wildcard targets into directory targets.
  // - "src/shared/*" -> "src/shared/"
  if (out.endsWith('/*')) {
    out = out.slice(0, -1);
  }

  return out;
}

/**
 * Ensure replacement path has a trailing slash if the find pattern is a prefix.
 * Maintains consistency between find patterns and replacement paths.
 *
 * @param find - The find pattern (string for prefix, RegExp for exact match)
 * @param replacement - The replacement path
 * @returns The replacement path, potentially with added trailing slash
 */
function ensureTrailingSlashIfNeeded(find: string | RegExp, replacement: string): string {
  if (typeof find !== 'string') {
    return replacement;
  }

  if (!find.endsWith('/')) {
    return replacement;
  }

  return replacement.endsWith('/') ? replacement : `${replacement}/`;
}

interface BuildViteAliasesOptions {
  /**
   * Convert a normalized tsconfig target (e.g. "src/shared/") into an absolute path.
   * Return null to skip the mapping.
   */
  readonly resolveReplacement: (normalizedTarget: string) => string | null;
}

/**
 * Build Vite-compatible alias entries from a tsconfig `paths` record.
 *
 * Transforms TypeScript path aliases into Vite-compatible format, handling:
 * - Wildcard patterns ("@shared/*" → "@shared/")
 * - Exact matches ("@core" → /^@core$/)
 * - Path normalization and trailing slash consistency
 *
 * @param paths - The TypeScript compilerOptions.paths record
 * @param options - Configuration with a resolver function for absolute paths
 * @returns Array of Vite alias entries ready for use in vite.config.ts
 */
export function buildViteAliasesFromTsconfigPaths(
  paths: TsconfigPaths,
  options: BuildViteAliasesOptions
): ViteAliasEntry[] {
  const alias: ViteAliasEntry[] = [];

  for (const [key, targets] of Object.entries(paths)) {
    const find = toViteFind(key);
    if (!find) continue;

    const first = targets?.[0];
    if (!first) continue;

    const normalizedTarget = normalizeAliasTarget(first);
    // Skip pathological mappings (e.g. "./*")
    if (normalizedTarget === '*') continue;

    const baseReplacement = options.resolveReplacement(normalizedTarget);
    if (!baseReplacement) continue;

    alias.push({
      find,
      replacement: ensureTrailingSlashIfNeeded(find, baseReplacement),
    });
  }

  return alias;
}
