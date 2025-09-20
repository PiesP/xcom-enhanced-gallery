#!/usr/bin/env node
/* eslint-env node */
/**
 * Smart pretest hook to reduce redundant builds and speed up local/CI tests.
 * Behavior:
 * - Skips build when VITEST or TEST_FAST=true (unit-only fast path)
 * - Skips build when CI=true and TEST_SKIP_BUILD=true (for matrix steps explicitly running build elsewhere)
 * - Otherwise runs `npm run build` once so postbuild validation runs.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';
import { statSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const env = process.env;
const isCI = env.CI === 'true' || env.GITHUB_ACTIONS === 'true';
const isVitest = !!env.VITEST;
const testFast = String(env.TEST_FAST || '').toLowerCase() === 'true';
const skipBuild = String(env.TEST_SKIP_BUILD || '').toLowerCase() === 'true';

if (isVitest || testFast || (isCI && skipBuild)) {
  console.log('[pretest-hook] Skipping build for fast tests');
  process.exit(0);
}

// Heuristic: Skip build if dist outputs are newer than sources
function getLatestMtime(dir) {
  let latest = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    try {
      if (ent.isDirectory()) {
        latest = Math.max(latest, getLatestMtime(full));
      } else if (ent.isFile()) {
        const st = statSync(full);
        latest = Math.max(latest, st.mtimeMs);
      }
    } catch {
      // ignore fs errors during mtime scan
      void 0;
    }
  }
  return latest;
}

function maybeSkipBuildByMtime() {
  try {
    const cwd = process.cwd();
    const dist = resolve(cwd, 'dist');
    const devJs = resolve(dist, 'xcom-enhanced-gallery.dev.user.js');
    const prodJs = resolve(dist, 'xcom-enhanced-gallery.user.js');
    const devMap = resolve(dist, 'xcom-enhanced-gallery.dev.user.js.map');
    const prodMap = resolve(dist, 'xcom-enhanced-gallery.user.js.map');
    if (!existsSync(devJs) || !existsSync(prodJs) || !existsSync(devMap) || !existsSync(prodMap)) {
      return false;
    }
    const distMtime = Math.min(
      statSync(devJs).mtimeMs,
      statSync(prodJs).mtimeMs,
      statSync(devMap).mtimeMs,
      statSync(prodMap).mtimeMs
    );

    const srcDir = resolve(cwd, 'src');
    const latestSrc = getLatestMtime(srcDir);
    const criticalFiles = ['package.json', 'vite.config.ts', 'tsconfig.json'];
    const latestCritical = criticalFiles
      .filter(f => existsSync(resolve(cwd, f)))
      .map(f => statSync(resolve(cwd, f)).mtimeMs)
      .reduce((a, b) => Math.max(a, b), 0);

    const latestInput = Math.max(latestSrc, latestCritical);
    if (latestInput <= distMtime) {
      console.log('[pretest-hook] Build up-to-date. Skipping build.');
      return true;
    }
  } catch {
    // ignore probe errors; fall back to building
    void 0;
  }
  return false;
}

if (maybeSkipBuildByMtime()) {
  process.exit(0);
}

console.log('[pretest-hook] Running full build before tests...');
const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  console.error('[pretest-hook] Build failed before tests.');
  process.exit(result.status ?? 1);
}
console.log('[pretest-hook] Build completed.');
