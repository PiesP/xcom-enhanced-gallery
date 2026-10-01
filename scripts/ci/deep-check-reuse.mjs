#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

export const SCHEMA = 2;
export const GATES = ['duplication', 'mutation'];

function assertGate(gate) {
  if (!GATES.includes(gate)) throw new Error(`Unknown deep gate: ${gate}`);
}

export function runnerIdentity(env = process.env) {
  const { RUNNER_OS, RUNNER_ARCH, ImageOS, ImageVersion, DEEP_RUNNER_LABEL } = env;
  if (![RUNNER_OS, RUNNER_ARCH, ImageOS, ImageVersion, DEEP_RUNNER_LABEL].every(Boolean))
    return null;
  // Record ImageVersion in the marker while allowing pinned source-based checks
  // to reuse success across weekly runner image refreshes.
  return { os: RUNNER_OS, arch: RUNNER_ARCH, image: ImageOS, label: DEEP_RUNNER_LABEL };
}

export function fingerprint(gate, cwd = process.cwd(), env = process.env) {
  assertGate(gate);
  const runner = runnerIdentity(env);
  if (!runner) return null; // Unknown runner image must run the gate.

  const manifest = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'));
  if (!manifest.volta?.node || !manifest.volta?.pnpm || !manifest.packageManager) return null;

  const hash = createHash('sha256');
  hash.update(
    JSON.stringify({
      schema: SCHEMA,
      gate,
      runner,
      tools: {
        node: manifest.volta.node,
        pnpm: manifest.volta.pnpm,
        packageManager: manifest.packageManager,
      },
    })
  );

  // Hash the checked-out bytes, not just the index object IDs. A gitlink is
  // represented by its pinned commit; ordinary files include their mode and bytes.
  const entries = execFileSync('git', ['ls-files', '--stage', '-z'], { cwd })
    .toString('utf8')
    .split('\0');
  for (const entry of entries) {
    if (!entry) continue;
    const match = /^(\d{6}) ([0-9a-f]{40,64}) 0\t(.+)$/.exec(entry);
    if (!match) throw new Error(`Invalid or unmerged Git index entry: ${entry}`);
    const [, mode, object, path] = match;
    hash.update(`\0${mode}\0${path}\0`);
    if (mode === '160000') {
      hash.update(object);
    } else if (mode === '120000') {
      hash.update(readlinkSync(`${cwd}/${path}`));
    } else {
      const file = `${cwd}/${path}`;
      const stat = statSync(file);
      const bytes = readFileSync(file);
      hash.update(String(stat.size));
      hash.update('\0');
      hash.update(bytes);
    }
  }
  return hash.digest('hex');
}

export function validMarker(markerPath, gate, expectedFingerprint) {
  assertGate(gate);
  if (!expectedFingerprint || !/^[0-9a-f]{64}$/.test(expectedFingerprint)) return false;
  try {
    const marker = JSON.parse(readFileSync(markerPath, 'utf8'));
    return (
      marker.schema === SCHEMA &&
      marker.gate === gate &&
      marker.fingerprint === expectedFingerprint &&
      marker.result === 'success' &&
      typeof marker.imageVersion === 'string' &&
      marker.imageVersion.length > 0
    );
  } catch {
    return false;
  }
}

export function shouldReuse(valid, cacheHit, restoreOutcome, eventName, reuseSuccess) {
  return (
    valid &&
    cacheHit === 'true' &&
    restoreOutcome === 'success' &&
    (eventName === 'schedule' || (eventName === 'workflow_dispatch' && reuseSuccess === 'true'))
  );
}

export function writeMarker(markerPath, gate, expectedFingerprint, env = process.env) {
  assertGate(gate);
  if (!/^[0-9a-f]{64}$/.test(expectedFingerprint)) throw new Error('Invalid fingerprint');
  if (!env.ImageVersion) throw new Error('Runner image version is required');
  mkdirSync(dirname(markerPath), { recursive: true });
  writeFileSync(
    markerPath,
    `${JSON.stringify({
      schema: SCHEMA,
      gate,
      fingerprint: expectedFingerprint,
      result: 'success',
      imageVersion: env.ImageVersion,
    })}\n`
  );
}

function output(line) {
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
  appendFileSync(process.env.GITHUB_OUTPUT, `${line}\n`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [, , command, gate, value, markerPath] = process.argv;
  assertGate(gate);
  if (command === 'fingerprint') {
    const value = fingerprint(gate);
    output(`cacheable=${Boolean(value)}`);
    output(`fingerprint=${value ?? 'unavailable'}`);
  } else if (command === 'verify') {
    const valid = validMarker(markerPath, gate, value);
    output(
      `reuse=${shouldReuse(
        valid,
        process.env.CACHE_HIT,
        process.env.RESTORE_OUTCOME,
        process.env.GITHUB_EVENT_NAME,
        process.env.REUSE_SUCCESS
      )}`
    );
  } else if (command === 'mark') {
    writeMarker(markerPath, gate, value);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}
