#!/usr/bin/env node
/** Run the optional local Nose check without a shell. */
import { spawnSync } from 'node:child_process';
import { realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import process, { argv, env, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

export function runOptionalNose(root: string): number | NodeJS.Signals {
  try {
    if (!statSync(root).isDirectory()) throw new Error('not a directory');
  } catch (error) {
    console.error(`[nose] could not run in project directory: ${String(error)}`);
    return 1;
  }
  const result = spawnSync(
    'nose',
    ['query', 'src', '--baseline', '.nose-baseline.json', '--fail-on', 'new'],
    {
      cwd: root,
      env,
      stdio: 'inherit',
    }
  );
  if (result.error) {
    if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('[nose] not installed — skipping');
      return 0;
    }
    console.error(`[nose] could not run: ${result.error.message}`);
    return 1;
  }
  if (result.signal) return result.signal;
  return result.status ?? 1;
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
  const result = runOptionalNose(resolve(import.meta.dirname, '../..'));
  if (typeof result === 'number') {
    exit(result);
  } else {
    // The browser type environment narrows the global process shape.
    const nodeProcess = process as NodeJS.Process;
    nodeProcess.kill(nodeProcess.pid, result);
  }
}
