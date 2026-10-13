import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const source = resolve(import.meta.dirname, '../../../scripts/ci');
const root = resolve(import.meta.dirname, '../../..');
const reviewedScannerHelper = 'd5fdf58387e43dec380331a1ab6577c0a2cb8f6a';
const roots: string[] = [];

type Pins = {
  osv: { version: string; image: string };
  semgrep: { version: string; image: string };
};

it('keeps scanner pins in a reviewed private three-file closure', () => {
  const workflow = readFileSync(join(root, '.github/workflows/security.yaml'), 'utf8');
  const pins = JSON.parse(readFileSync(join(source, 'pinned-tools.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  expect(Object.keys(pins).sort()).toEqual(['osv', 'semgrep']);
  expect(workflow.match(new RegExp(`ref: ${reviewedScannerHelper}`, 'gu'))).toHaveLength(2);
  expect(
    workflow.match(/for name in pinned-tools\.json pinned-tools\.ts check-pinned-tools\.ts; do/gu)
  ).toHaveLength(2);
  expect(workflow).toContain('"$pinned_dir/check-pinned-tools.ts"');

  const block = workflow
    .split('      - name: 🔐 Export validated scanner images\n')[1]
    ?.split('\n      - name: ')[0];
  const script = block?.match(/ {8}run: \|\n((?: {10}.*\n)*)/u)?.[1]?.replace(/^ {10}/gmu, '');
  expect(script).toBeDefined();
  const temporary = mkdtempSync(join(tmpdir(), 'scanner pins workflow '));
  try {
    const output = join(temporary, 'output');
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script ?? ''], {
      cwd: root,
      env: { ...process.env, RUNNER_TEMP: temporary, GITHUB_OUTPUT: output },
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    const copy = join(
      temporary,
      readdirSync(temporary).find((entry) => entry.startsWith('pinned-tools.')) ?? ''
    );
    expect(readdirSync(copy).sort()).toEqual([
      'check-pinned-tools.ts',
      'pinned-tools.json',
      'pinned-tools.ts',
    ]);
    for (const name of readdirSync(copy)) {
      expect(readFileSync(join(copy, name))).toEqual(readFileSync(join(source, name)));
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pinned tools cli '));
  roots.push(root);
  const scripts = join(root, 'scripts/ci');
  const bin = join(root, 'bin');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(bin);
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  for (const name of ['pinned-tools.ts', 'check-pinned-tools.ts']) {
    copyFileSync(join(source, name), join(scripts, name));
  }
  const pins = JSON.parse(readFileSync(join(source, 'pinned-tools.json'), 'utf8')) as Pins;
  writeFileSync(join(scripts, 'pinned-tools.json'), JSON.stringify(pins));
  const stub = join(bin, 'mock');
  writeFileSync(
    stub,
    `#!${process.execPath}
import fs from 'node:fs';
import path from 'node:path';
const command = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const root = process.env.FAKE_ROOT;
const scenario = process.env.MOCK_SCENARIO || '';
const pins = JSON.parse(fs.readFileSync(path.join(root, 'scripts/ci/pinned-tools.json'), 'utf8'));
fs.appendFileSync(path.join(root, 'calls.jsonl'), JSON.stringify({ command, args }) + '\\n');
if (command === 'gh') {
  if (scenario === 'api-fail') process.exit(7);
  const target = args[1];
  if (target.endsWith('/releases?per_page=100')) {
    const version = target.includes('google/osv-scanner') ? pins.osv.version : pins.semgrep.version;
    const old = new Date(Date.now() - 48 * 3600000).toISOString();
    const young = new Date(Date.now() - 3600000).toISOString();
    const list = scenario === 'no-mature' ? [{ tag_name: 'v' + version, published_at: young, draft: false, prerelease: false }] :
      scenario === 'young-first' ? [
        { tag_name: 'v9.9.9', published_at: young, draft: false, prerelease: false },
        { tag_name: 'v' + version, published_at: old, draft: false, prerelease: false },
      ] : [{ tag_name: 'v' + (scenario === 'update' ? '9.9.9' : version), published_at: old, draft: false, prerelease: false }];
    process.stdout.write(JSON.stringify(scenario === 'malformed-api' ? { error: 'bad' } : list));
  }
} else if (command === 'curl') {
  if (scenario === 'manifest-fail' && args.includes('--dump-header')) process.exit(7);
  if (args.some((arg) => arg.includes('ghcr.io/token')))
    process.stdout.write(JSON.stringify(scenario === 'no-token' ? {} : { token: 'fixture-token' }));
  else if (scenario !== 'no-image-digest')
    process.stdout.write('Docker-Content-Digest: ' + (scenario === 'image-mismatch' ? 'sha256:' + '0'.repeat(64) : pins.osv.image.split('@')[1]) + '\\r\\n');
}
`
  );
  chmodSync(stub, 0o755);
  for (const name of ['gh', 'curl']) {
    copyFileSync(stub, join(bin, name));
  }
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH ?? ''}`,
    FAKE_ROOT: root,
    RUNNER_TEMP: root,
    GITHUB_ENV: join(root, 'github env'),
    GH_TOKEN: 'secret-gh',
    GITHUB_TOKEN: 'secret-github',
  };
  const run = (name: string, scenario = '', args: string[] = []) => {
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', join(scripts, name), ...args],
      {
        cwd: root,
        env: { ...env, MOCK_SCENARIO: scenario },
        encoding: 'utf8',
      }
    );
    const calls = existsSync(join(root, 'calls.jsonl'))
      ? readFileSync(join(root, 'calls.jsonl'), 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as { command: string; args: string[] })
      : [];
    return { result, calls };
  };
  return { root, scripts, pins, env, run };
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('pinned tool checker CLI', () => {
  it('checks exact scanner release and image endpoints in API order', () => {
    const { run, pins } = fixture();
    const { result, calls } = run('check-pinned-tools.ts', 'young-first');
    expect(result.status).toBe(0);
    expect(calls.map((call) => [call.command, ...call.args])).toEqual([
      ['gh', 'api', 'repos/google/osv-scanner/releases?per_page=100'],
      [
        'curl',
        '--fail',
        '--silent',
        '--show-error',
        'https://ghcr.io/token?scope=repository:google/osv-scanner-action:pull',
      ],
      [
        'curl',
        '--fail',
        '--silent',
        '--show-error',
        '--dump-header',
        '-',
        '--output',
        '/dev/null',
        '--header',
        'Authorization: Bearer fixture-token',
        '--header',
        'Accept: application/vnd.docker.distribution.manifest.v2+json',
        `https://ghcr.io/v2/google/osv-scanner-action/manifests/v${pins.osv.version}`,
      ],
      ['gh', 'api', 'repos/semgrep/semgrep/releases?per_page=100'],
    ]);
  });

  it('warns on a mature update without failing the pin integrity checks', () => {
    const { run } = fixture();
    const { result } = run('check-pinned-tools.ts', 'update');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('::warning title=osv-scanner update available::');
  });

  for (const [scenario, message] of [
    ['no-mature', 'No stable'],
    ['api-fail', 'check-pinned-tools:'],
    ['malformed-api', 'Invalid'],
    ['no-token', 'Invalid GHCR token'],
    ['no-image-digest', 'digest mismatch'],
    ['image-mismatch', 'digest mismatch'],
    ['manifest-fail', 'curl request failed (exit 7)'],
  ]) {
    it(`fails closed on ${scenario}`, () => {
      const { run } = fixture();
      const { result } = run('check-pinned-tools.ts', scenario);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(message);
    });
  }

  it('does not disclose the GHCR bearer token on a manifest failure', () => {
    const { run } = fixture();
    const { result } = run('check-pinned-tools.ts', 'manifest-fail');
    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toContain('fixture-token');
  });

  it('continues checking every pin after an API failure', () => {
    const { run } = fixture();
    const { result, calls } = run('check-pinned-tools.ts', 'api-fail');
    expect(result.status).toBe(1);
    expect(calls.filter((call) => call.command === 'gh').map((call) => call.args[1])).toEqual([
      'repos/google/osv-scanner/releases?per_page=100',
      'repos/semgrep/semgrep/releases?per_page=100',
    ]);
    expect(result.stdout).toContain('runtime digest matches GHCR');
  });
});

describe('pinned image environment CLI', () => {
  it('appends only validated pinned images without external commands', () => {
    const { run, pins, root } = fixture();
    writeFileSync(join(root, 'github env'), 'EXISTING=value\n');
    const { result, calls } = run('pinned-tools.ts', '', ['env']);
    expect(result.status).toBe(0);
    expect(calls).toEqual([]);
    expect(readFileSync(join(root, 'github env'), 'utf8')).toBe(
      `EXISTING=value\nOSV_SCANNER_IMAGE=${pins.osv.image}\nSEMGREP_IMAGE=${pins.semgrep.image}\n`
    );
  });

  it('rejects other modes and malformed images before writing', () => {
    const { run, pins, scripts, root } = fixture();
    expect(run('pinned-tools.ts', '', ['other']).result.status).toBe(1);
    pins.osv.image += '\nINJECTED=value';
    writeFileSync(join(scripts, 'pinned-tools.json'), JSON.stringify(pins));
    expect(run('pinned-tools.ts', '', ['env']).result.status).toBe(1);
    expect(existsSync(join(root, 'github env'))).toBe(false);
  });

  it('requires the workflow environment output path', () => {
    const { env, scripts } = fixture();
    const result = spawnSync(
      process.execPath,
      ['--experimental-strip-types', join(scripts, 'pinned-tools.ts'), 'env'],
      {
        env: { ...env, GITHUB_ENV: '' },
        encoding: 'utf8',
      }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GITHUB_ENV is required');
  });
});

it('rejects missing or malformed metadata before external calls', () => {
  for (const value of ['{}', '{', '{"osv":{"version":"bad"}}']) {
    const { run, scripts } = fixture();
    writeFileSync(join(scripts, 'pinned-tools.json'), value);
    const { result, calls } = run('check-pinned-tools.ts');
    expect(result.status).not.toBe(0);
    expect(calls).toEqual([]);
  }
});

it('does no reads, writes, or subprocess calls on module import', () => {
  const { scripts, root, env } = fixture();
  for (const name of ['pinned-tools.ts', 'check-pinned-tools.ts']) {
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        `await import(${JSON.stringify(join(scripts, name))})`,
      ],
      { env, encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    expect(existsSync(join(root, 'calls.jsonl'))).toBe(false);
  }
});
