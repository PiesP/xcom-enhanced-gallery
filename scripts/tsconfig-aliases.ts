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

export type { ViteAliasEntry };

export interface TsconfigAliasOptions {
  /** Absolute project root (usually process.cwd()) */
  readonly rootDir: string;
  /** Absolute path to the tsconfig.json file */
  readonly tsconfigPath: string;
}

/**
 * Create Vite-compatible alias entries from tsconfig.json `compilerOptions.paths`.
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
    resolveReplacement: (normalizedTarget) => resolve(rootDir, normalizedTarget),
  });
}
