import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const providerFixtures = join(root, 'test/fixtures/scanner-provider');
const security = readFileSync(join(root, '.github/workflows/security.yaml'), 'utf8');
const metadata = readFileSync(join(root, 'scripts/ci/pinned-tools.json'));
const pins = JSON.parse(metadata.toString('utf8')) as {
  osv: { version: string; image: string };
  semgrep: { version: string; image: string };
};
const consumerSha = 'd5fdf58387e43dec380331a1ab6577c0a2cb8f6a';
const providerSha = '4ab0442d8d2e3cf640767b499b6444c92f6479b5';
const action = 'uses: PiesP/browser-core/automation/actions/prepare-scanner-pins@' + providerSha;
const files = [
  [
    'automation/actions/prepare-scanner-pins/action.yaml',
    'action.yaml.txt',
    'f37c9657f724fcc4b39cc28294618ac0ef09d949d94aa2e757507e1f830d2adf',
  ],
  [
    'automation/actions/prepare-scanner-pins/prepare.ts',
    'prepare.ts.txt',
    '0bb6ec52113c17e4cebe86e3da792a8b59c6125cc85cfda4d037741ce7dc812b',
  ],
  [
    'automation/security/scanner-pins.ts',
    'scanner-pins.ts.txt',
    '4975feec038d3969dc38fcd1de73afba04cb84e8cd8e176de9ed8a4a81f7b7a9',
  ],
] as const;
const roots: string[] = [];

function job(name: string): string {
  return security.split('\n  ' + name + ':\n')[1]?.split(/\n  [a-z][a-z-]*:\n/u)[0] ?? '';
}

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'xeg scanner consumer '));
  roots.push(directory);
  const provider = join(directory, 'reviewed provider');
  const candidate = join(directory, 'candidate checkout');
  const trusted = join(directory, 'reviewed consumer');
  const runner = join(directory, 'runner temp');
  const bin = join(directory, 'bin');
  for (const path of [candidate, trusted, runner, bin]) {
    mkdirSync(path);
  }
  for (const [source, snapshot] of files) {
    const target = join(provider, source);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(providerFixtures, snapshot), target);
  }
  const trustedJson = join(trusted, 'pinned-tools.json');
  writeFileSync(trustedJson, metadata);
  writeFileSync(join(candidate, 'pinned-tools.json'), '{}');
  writeFileSync(join(candidate, 'scanner-pins.ts'), 'untrusted code\n');
  const mock = join(bin, 'mock');
  writeFileSync(
    mock,
    [
      '#!/bin/sh',
      'printf "%s %s\\n" "$0" "$*" >> "$CALLS"',
      'if [ "$(basename "$0")" = gh ]; then',
      '  case "$*" in *google/osv-scanner*) version="$OSV_VERSION";; *) version="$SEMGREP_VERSION";; esac',
      '  printf \'[{"draft":false,"prerelease":false,"tag_name":"v%s","published_at":"2020-01-01T00:00:00Z"}]\' "$version"',
      'else',
      '  case "$*" in',
      '    *ghcr.io/token*) printf \'{"token":"fixture-token"}\';;',
      '    *) printf "Docker-Content-Digest: %s\\r\\n" "$EXPECTED_DIGEST";;',
      '  esac',
      'fi',
      '',
    ].join('\n')
  );
  chmodSync(mock, 0o755);
  for (const name of ['gh', 'curl']) {
    copyFileSync(mock, join(bin, name));
  }
  const actionOutput = join(directory, 'action output');
  const envOutput = join(directory, 'environment output');
  const calls = join(directory, 'calls');
  const env = {
    ...process.env,
    RUNNER_TEMP: runner,
    GITHUB_OUTPUT: actionOutput,
    GITHUB_ENV: envOutput,
    GH_TOKEN: 'fixture-gh-token',
    PATH: bin + ':' + (process.env.PATH ?? ''),
    OSV_VERSION: pins.osv.version,
    SEMGREP_VERSION: pins.semgrep.version,
    EXPECTED_DIGEST: pins.osv.image.split('@')[1] ?? '',
    CALLS: calls,
  };
  const prepare = () =>
    spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        join(provider, 'automation/actions/prepare-scanner-pins/prepare.ts'),
      ],
      { cwd: candidate, env, encoding: 'utf8' }
    );
  const helper = () => {
    const output = readFileSync(actionOutput, 'utf8');
    expect(output.match(/^helper-path=/gmu)).toHaveLength(1);
    return output.slice('helper-path='.length).trimEnd();
  };
  const privateJson = () => {
    const directory = join(runner, 'reviewed metadata');
    mkdirSync(directory, { mode: 0o700 });
    chmodSync(directory, 0o700);
    const path = join(directory, 'pinned-tools.json');
    copyFileSync(trustedJson, path);
    chmodSync(path, 0o600);
    return path;
  };
  const run = (helperPath: string, mode: string, json: string) =>
    spawnSync(process.execPath, ['--experimental-strip-types', helperPath, mode, json], {
      cwd: candidate,
      env,
      encoding: 'utf8',
    });
  return { candidate, runner, envOutput, calls, prepare, helper, privateJson, run };
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('scanner pin consumer contract', () => {
  it('binds test snapshots and consumer metadata to the reviewed bytes', () => {
    expect(createHash('sha256').update(metadata).digest('hex')).toBe(
      '6272b8eb6806d92fcae67f4f1bba238b0955a08e7b5d544276b9fdb1006588b9'
    );
    for (const [, snapshot, hash] of files) {
      expect(
        createHash('sha256')
          .update(readFileSync(join(providerFixtures, snapshot)))
          .digest('hex')
      ).toBe(hash);
    }
  });

  it('loads provider code after the trusted checkout in both scanner jobs', () => {
    for (const [name, mode] of [
      ['pin-metadata', 'env'],
      ['pinned-tools', 'check'],
    ] as const) {
      const body = job(name);
      const checkout = body.indexOf('ref: ' + consumerSha);
      const runtime = body.indexOf("install-dependencies: 'false'");
      const helper = body.indexOf(action);
      const call = body.indexOf(' ' + mode + ' "$pin_metadata"');
      expect(checkout).toBeGreaterThan(0);
      expect(runtime).toBeGreaterThan(checkout);
      expect(helper).toBeGreaterThan(runtime);
      expect(call).toBeGreaterThan(helper);
      expect(body).toContain('id: scanner_helper');
      expect(body).toContain('chmod 0700 "$pinned_dir"');
      expect(body).toContain('pin_metadata="$pinned_dir/pinned-tools.json"');
      expect(body).toContain('install -m 0600 scripts/ci/pinned-tools.json "$pin_metadata"');
      expect(body).toContain('"$' + '{{ steps.scanner_helper.outputs.helper-path }}"');
      expect(body).not.toContain('check-pinned-tools.ts');
      expect(body).not.toContain('scripts/ci/pinned-tools.ts');
      expect(body).not.toContain('continue-on-error:');
      expect(body).toContain('contents: read');
    }
    expect(job('pin-metadata')).toContain('GITHUB_ENV="$GITHUB_OUTPUT"');
    expect(job('pin-metadata')).toContain(
      'OSV_SCANNER_IMAGE: $' + '{{ steps.pins.outputs.OSV_SCANNER_IMAGE }}'
    );
    expect(job('pin-metadata')).toContain(
      'SEMGREP_IMAGE: $' + '{{ steps.pins.outputs.SEMGREP_IMAGE }}'
    );
    expect(job('pinned-tools')).toContain('GH_TOKEN: $' + '{{ github.token }}');
    expect(security).toContain("needs['pin-metadata'].outputs.OSV_SCANNER_IMAGE");
    expect(security).toContain("needs['pin-metadata'].outputs.SEMGREP_IMAGE");
  });

  it('executes both prepared provider modes from an unrelated candidate checkout', () => {
    const f = fixture();
    const prepared = f.prepare();
    expect(prepared.status, prepared.stderr).toBe(0);
    const helper = f.helper();
    expect(readdirSync(dirname(helper))).toEqual(['scanner-pins.ts']);
    expect(statSync(dirname(helper)).mode & 0o777).toBe(0o700);
    expect(statSync(helper).mode & 0o777).toBe(0o600);
    const json = f.privateJson();
    expect(statSync(dirname(json)).mode & 0o777).toBe(0o700);
    expect(statSync(json).mode & 0o777).toBe(0o600);
    const exported = f.run(helper, 'env', json);
    expect(exported.status, exported.stderr).toBe(0);
    expect(readFileSync(f.envOutput, 'utf8')).toBe(
      'OSV_SCANNER_IMAGE=' + pins.osv.image + '\nSEMGREP_IMAGE=' + pins.semgrep.image + '\n'
    );
    const checked = f.run(helper, 'check', json);
    expect(checked.status, checked.stderr).toBe(0);
    expect(readFileSync(f.calls, 'utf8')).toContain('google/osv-scanner/releases?per_page=100');
    expect(readFileSync(join(f.candidate, 'scanner-pins.ts'), 'utf8')).toBe('untrusted code\n');
  });

  it('fails with a missing helper or invalid explicit metadata', () => {
    const f = fixture();
    expect(f.prepare().status).toBe(0);
    const helper = f.helper();
    const json = f.privateJson();
    expect(f.run(join(f.runner, 'missing.ts'), 'env', json).status).not.toBe(0);
    writeFileSync(json, '{}');
    expect(f.run(helper, 'env', json).status).not.toBe(0);
    expect(f.run(helper, 'check', json).status).not.toBe(0);
    expect(existsSync(f.envOutput)).toBe(false);
    expect(existsSync(f.calls)).toBe(false);
  });
});
