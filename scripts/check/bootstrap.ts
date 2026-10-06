#!/usr/bin/env node
/** Check the submodule before package dependencies can be installed. */
import { realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

export function hasInitializedCore(root: string): boolean {
  try {
    return statSync(resolve(root, 'packages/core/package.json')).isFile();
  } catch {
    return false;
  }
}

function isDirectInvocation(): boolean {
  if (!argv[1]) return false;
  try {
    return realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectInvocation()) {
  const root = resolve(import.meta.dirname, '../..');
  if (!hasInitializedCore(root)) {
    console.error(
      '⚠️  Submodule not initialized (packages/core/package.json is missing). Run: git submodule sync --recursive && git submodule update --init --recursive'
    );
    exit(1);
  }
}
