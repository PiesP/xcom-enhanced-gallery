import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { beginBuildFootprint, captureBuildInputs, writeBuildFootprint } from './footprint.ts';

const root = resolve(import.meta.dirname, '..', '..');

/** Run each existing production target once, then bind the resulting files to this invocation. */
export function buildAll(): void {
  const start = captureBuildInputs();
  if (!start.sourceClean) {
    throw new Error('Production footprint requires a clean source before building');
  }
  const runId = randomUUID();
  beginBuildFootprint(runId);
  for (const script of [
    'check:versions',
    'build:ci',
    'build:extension:ci',
    'build:extension:firefox:ci',
  ]) {
    const result = spawnSync('pnpm', ['-s', script], {
      cwd: root,
      env: { ...process.env, XCOM_FOOTPRINT_RUN_ID: runId },
      stdio: 'inherit',
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(
        `${script} did not complete successfully (${result.signal ?? result.status})`
      );
    }
  }
  writeBuildFootprint(start, runId);
}

if (import.meta.main) {
  buildAll();
}
