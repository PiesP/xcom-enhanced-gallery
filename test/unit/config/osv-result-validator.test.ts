import { spawnSync } from 'node:child_process';
import { existsSync, linkSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const helper = resolve(import.meta.dirname, '../../../scripts/security/validate-osv-results.py');
const directories: string[] = [];

function run(raw: string, options: { stale?: boolean; sameFile?: boolean; hardlink?: boolean } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'osv-validator-'));
  directories.push(directory);
  const input = join(directory, 'raw.json');
  const output = options.sameFile ? input : join(directory, 'validated.json');
  writeFileSync(input, raw);
  if (options.stale) writeFileSync(output, 'stale');
  if (options.hardlink) linkSync(input, output);
  const execution = spawnSync('python3', [helper, '--input', input, '--output', output], {
    encoding: 'utf8',
  });
  return { ...execution, input, output, outputExists: existsSync(output) };
}

const vulnerability = { id: 'GHSA-jmr9-qjv8-65gv', summary: 'retained' };
const report = {
  extra_metadata: { retained: true },
  results: [{
    source: { type: 'lockfile', path: '/src/pnpm-lock.yaml' },
    packages: [{
      package: { ecosystem: 'npm', name: 'example', version: '1.0.0' },
      vulnerabilities: [vulnerability],
      groups: [{ ids: [vulnerability.id], aliases: null }],
    }],
  }],
};

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('OSV result validator', () => {
  it('preserves vulnerabilities, aliases, and unknown scanner metadata', () => {
    const execution = run(JSON.stringify(report));
    expect(execution.status, execution.stderr).toBe(0);
    expect(JSON.parse(readFileSync(execution.output, 'utf8'))).toEqual(report);
  });

  it.each([
    ['malformed JSON', '{'],
    ['duplicate JSON key', '{"results":[],"results":[]}'],
    ['non-finite constant', '{"results":[],"metadata":NaN}'],
    ['overflowing JSON number', '{"results":[],"metadata":1e400}'],
    ['missing results', '{}'],
    ['invalid results', '{"results":{}}'],
    ['missing source', JSON.stringify({ results: [{ packages: [] }] })],
    ['invalid package', JSON.stringify({ results: [{ source: { type: 'lockfile', path: '/src/a' }, packages: [{ package: {}, vulnerabilities: {}, groups: [] }] }] })],
    ['missing vulnerability ID', JSON.stringify({ results: [{ source: { type: 'lockfile', path: '/src/a' }, packages: [{ package: {}, vulnerabilities: [{}], groups: [] }] }] })],
    ['invalid aliases', JSON.stringify({ results: [{ source: { type: 'lockfile', path: '/src/a' }, packages: [{ package: {}, vulnerabilities: [], groups: [{ ids: ['x'], aliases: 42 }] }] }] })],
  ])('rejects %s and clears stale output', (_name, raw) => {
    const execution = run(raw, { stale: true });
    expect(execution.status).toBe(2);
    expect(execution.outputExists).toBe(false);
  });

  it.each([{ sameFile: true }, { hardlink: true }])(
    'protects the input from output aliasing: %j',
    (options) => {
      const raw = JSON.stringify(report);
      const execution = run(raw, options);
      expect(execution.status).toBe(2);
      expect(readFileSync(execution.input, 'utf8')).toBe(raw);
    }
  );
});
