import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = resolve(import.meta.dirname, '../../../.github/actions/setup-release/resolve-runtime.mjs');

function resolveRuntime(pin: unknown, requested = ''): string {
  const fixture = mkdtempSync(join(tmpdir(), 'release-runtime-'));
  try {
    const output = join(fixture, 'output');
    writeFileSync(join(fixture, 'package.json'), JSON.stringify({ volta: { node: pin } }));
    execFileSync(process.execPath, [script], {
      cwd: fixture,
      env: {
        ...process.env,
        GITHUB_OUTPUT: output,
        NODE_VERSION_OVERRIDE: '22',
        REQUESTED_NODE_VERSION: requested
      },
      stdio: 'pipe'
    });
    return readFileSync(output, 'utf8');
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

describe('release runtime selection', () => {
  it('uses the official manifest pin even when a compatibility override is present', () => {
    expect(resolveRuntime('26.9.0')).toBe('version=26.9.0\n');
    expect(resolveRuntime('26.10.1')).toBe('version=26.10.1\n');
  });

  it('requires the workflow-provided version to match the tagged source', () => {
    expect(resolveRuntime('26.9.0', '26.9.0')).toBe('version=26.9.0\n');
    expect(() => resolveRuntime('26.9.0', '26')).toThrow();
    expect(() => resolveRuntime('26.9.0', '26.10.1')).toThrow();
  });

  it('runs the trusted provenance helper before tagged release setup', () => {
    const workflow = readFileSync(resolve(import.meta.dirname, '../../../.github/workflows/release.yaml'), 'utf8');
    const provenance = workflow.split('  provenance:\n')[1]?.split('\n  quality:')[0] ?? '';
    const checkout = provenance.indexOf('name: 📥 Checkout protected workflow source');
    const runtime = provenance.indexOf('name: 📦 Setup trusted provenance runtime');
    const verify = provenance.indexOf('run: node --experimental-strip-types scripts/release/verify-source.ts');
    expect(checkout).toBeGreaterThan(-1);
    expect(runtime).toBeGreaterThan(checkout);
    expect(verify).toBeGreaterThan(runtime);
    expect(provenance).toContain("install-dependencies: 'false'");
    expect(workflow.match(/node-version: \$\{\{ needs.provenance.outputs.node-version \}\}/g)).toHaveLength(5);
  });

  it.each([undefined, 26, '26', 'latest', '26.9.0\nextra=value'])(
    'rejects missing, moving or malformed release pins: %s',
    (pin) => expect(() => resolveRuntime(pin)).toThrow()
  );
});
