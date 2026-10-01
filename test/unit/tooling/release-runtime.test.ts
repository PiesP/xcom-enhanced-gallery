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

  it('resolves a historical source manifest for older tagged setup actions', () => {
    const workflow = readFileSync(resolve(import.meta.dirname, '../../../.github/workflows/release.yaml'), 'utf8');
    const selection = workflow.match(/node - "\$release_sha" <<'JS'\n([\s\S]*?)\n          JS/)?.[1];
    if (!selection) throw new Error('Release provenance runtime selector is missing');
    const fixture = mkdtempSync(join(tmpdir(), 'historical-release-runtime-'));
    try {
      execFileSync('git', ['init', '-q'], { cwd: fixture });
      writeFileSync(join(fixture, 'package.json'), JSON.stringify({ volta: { node: '24.15.0' } }));
      execFileSync('git', ['add', 'package.json'], { cwd: fixture });
      execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'historical source'], { cwd: fixture });
      const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fixture, encoding: 'utf8' }).trim();
      const output = join(fixture, 'output');
      execFileSync(process.execPath, ['-', sha], {
        cwd: fixture,
        input: selection,
        env: { ...process.env, GITHUB_OUTPUT: output },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      expect(readFileSync(output, 'utf8')).toBe('node-version=24.15.0\n');
      expect(workflow.match(/node-version: \$\{\{ needs.provenance.outputs.node-version \}\}/g)).toHaveLength(5);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it.each([undefined, 26, '26', 'latest', '26.9.0\nextra=value'])(
    'rejects missing, moving or malformed release pins: %s',
    (pin) => expect(() => resolveRuntime(pin)).toThrow()
  );
});
