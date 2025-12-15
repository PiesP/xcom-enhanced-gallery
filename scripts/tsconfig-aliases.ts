/**
 * @fileoverview Resolve bundler aliases from tsconfig.json
 *
 * This module exists to keep path alias definitions DRY.
 * - TypeScript uses `compilerOptions.paths`
 * - Vite needs `resolve.alias`
 *
 * We parse tsconfig.json via the TypeScript API (supports JSONC comments).
 */

import { resolve } from "node:path";
import * as ts from "typescript";

export interface TsconfigAliasOptions {
  /** Absolute project root (usually process.cwd()) */
  readonly rootDir: string;
  /** Absolute path to the tsconfig.json file */
  readonly tsconfigPath: string;
}

export type ViteAliasEntry = {
  readonly find: string | RegExp;
  readonly replacement: string;
};

type TsconfigPaths = Record<string, readonly string[]>;

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toViteFind(key: string): string | RegExp | null {
  // Ignore catch-all mappings (not meaningful for bundler aliasing)
  if (key === "*") {
    return null;
  }

  // Convert TS-style wildcard aliases into prefix aliases
  // - "@shared/*" -> "@shared/"
  // - "@/*" -> "@/"
  if (key.endsWith("/*")) {
    return key.slice(0, -1);
  }

  // Exact match aliases must not match subpaths in Vite (string aliases are
  // prefix-based). Use a regex to preserve TypeScript semantics.
  return new RegExp(`^${escapeRegExp(key)}$`);
}

function normalizeAliasTarget(target: string): string {
  // Remove leading "./" for stable path resolution.
  let out = target.replace(/^\.\//, "");

  // Convert TS-style wildcard targets into directory targets.
  // - "src/shared/*" -> "src/shared/"
  if (out.endsWith("/*")) {
    out = out.slice(0, -1);
  }

  return out;
}

/**
 * Create Vite-compatible alias entries from tsconfig.json `compilerOptions.paths`.
 */
export function resolveViteAliasesFromTsconfig(
  options: TsconfigAliasOptions
): ViteAliasEntry[] {
  const { tsconfigPath, rootDir } = options;

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    return [];
  }

  const paths = (configFile.config?.compilerOptions?.paths ?? {}) as TsconfigPaths;
  const alias: ViteAliasEntry[] = [];

  for (const [key, targets] of Object.entries(paths)) {
    const find = toViteFind(key);
    if (!find) continue;

    const first = targets?.[0];
    if (!first) continue;

    const normalizedTarget = normalizeAliasTarget(first);
    // Skip pathological mappings (e.g. "./*")
    if (normalizedTarget === "*") continue;

    const baseReplacement = resolve(rootDir, normalizedTarget);
    const replacement =
      typeof find === "string" && find.endsWith("/") && !baseReplacement.endsWith("/")
        ? `${baseReplacement}/`
        : baseReplacement;

    alias.push({ find, replacement });
  }

  return alias;
}
