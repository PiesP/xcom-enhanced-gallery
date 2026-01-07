/**
 * @fileoverview Resolve bundler aliases from tsconfig.json
 *
 * This module exists to keep path alias definitions DRY.
 * - TypeScript uses `compilerOptions.paths`
 * - Vite needs `resolve.alias`
 *
 * We parse tsconfig.json via the TypeScript API (supports JSONC comments).
 */

import { resolve } from 'node:path';
import * as ts from 'typescript';

import {
  buildViteAliasesFromTsconfigPaths,
  type TsconfigPaths,
  type ViteAliasEntry,
} from './tsconfig-aliases-core';

/**
 * Options for resolving Vite aliases from tsconfig.json.
 */
interface TsconfigAliasOptions {
  /** Absolute project root (usually process.cwd()) */
  readonly rootDir: string;
  /** Absolute path to the tsconfig.json file */
  readonly tsconfigPath: string;
}

/**
 * Create Vite-compatible alias entries from tsconfig.json `compilerOptions.paths`.
 *
 * Reads and parses the tsconfig file using the TypeScript API (JSONC-aware),
 * then transforms `compilerOptions.paths` entries into Vite-compatible alias format.
 *
 * @param options Configuration object containing paths and root directory
 * @param options.rootDir Absolute project root for resolving relative targets
 * @param options.tsconfigPath Absolute path to tsconfig.json
 * @returns Array of Vite alias entries (e.g., `{ find: /@shared/, replacement: '/absolute/path/to/src/shared' }`)
 * @throws {Error} If tsconfig.json cannot be read or parsed
 */
export function resolveViteAliasesFromTsconfig(options: TsconfigAliasOptions): ViteAliasEntry[] {
  const { tsconfigPath, rootDir } = options;

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    const host: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => rootDir,
      getNewLine: () => ts.sys.newLine,
    };
    const details = ts.formatDiagnosticsWithColorAndContext([configFile.error], host);
    throw new Error(
      `[tsconfig-aliases] Failed to read tsconfig: ${tsconfigPath}\n` +
        `This previously returned an empty alias list and caused hard-to-debug build/runtime failures.\n\n` +
        details
    );
  }

  const paths = (configFile.config?.compilerOptions?.paths ?? {}) as TsconfigPaths;

  return buildViteAliasesFromTsconfigPaths(paths, {
    resolveReplacement: (normalizedTarget: string) => resolve(rootDir, normalizedTarget),
  });
}
