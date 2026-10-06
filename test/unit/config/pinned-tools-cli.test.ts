import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const source = resolve(import.meta.dirname, '../../../scripts/ci');
const roots: string[] = [];
const installerBody = '#!/bin/sh\necho fixture installer\n';

type Pins = {
  nose: { version: string; installerSha256: string };
  osv: { version: string; image: string };
  semgrep: { version: string; image: string };
};

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'pinned tools cli '));
  roots.push(root);
  const scripts = join(root, 'scripts/ci');
  const bin = join(root, 'bin');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(bin);
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n');
  for (const name of ['pinned-tools.ts', 'check-pinned-tools.ts', 'install-nose.ts'])
    copyFileSync(join(source, name), join(scripts, name));
  const pins = JSON.parse(readFileSync(join(source, 'pinned-tools.json'), 'utf8')) as Pins;
  pins.nose.installerSha256 = createHash('sha256').update(installerBody).digest('hex');
  writeFileSync(join(scripts, 'pinned-tools.json'), JSON.stringify(pins));
  const stub = join(bin, 'mock');
  writeFileSync(stub, `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const command = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const root = process.env.FAKE_ROOT;
const scenario = process.env.MOCK_SCENARIO || '';
const pins = JSON.parse(fs.readFileSync(path.join(root, 'scripts/ci/pinned-tools.json'), 'utf8'));
fs.appendFileSync(path.join(root, 'calls.jsonl'), JSON.stringify({ command, args,
  tokens: command === 'sh' ? [process.env.GH_TOKEN, process.env.GITHUB_TOKEN, process.env.NOSE_CLI_GITHUB_TOKEN] : undefined }) + '\\n');
if (command === 'gh') {
  if (scenario === 'api-fail') process.exit(7);
  const target = args[1];
  if (target.endsWith('/releases?per_page=100')) {
    const version = target.includes('corca-ai/nose') ? pins.nose.version :
      target.includes('google/osv-scanner') ? pins.osv.version : pins.semgrep.version;
    const old = new Date(Date.now() - 48 * 3600000).toISOString();
    const young = new Date(Date.now() - 3600000).toISOString();
    const list = scenario === 'no-mature' ? [{ tag_name: 'v' + version, published_at: young, draft: false, prerelease: false }] :
      scenario === 'young-first' ? [
        { tag_name: 'v9.9.9', published_at: young, draft: false, prerelease: false },
        { tag_name: 'v' + version, published_at: old, draft: false, prerelease: false },
      ] : [{ tag_name: 'v' + (scenario === 'update' ? '9.9.9' : version), published_at: old, draft: false, prerelease: false }];
    process.stdout.write(JSON.stringify(scenario === 'malformed-api' ? { error: 'bad' } : list));
  } else {
    const assets = scenario === 'no-asset' ? [] : [{ name: 'nose-cli-installer.sh',
      digest: 'sha256:' + (scenario === 'digest-mismatch' ? '0'.repeat(64) : pins.nose.installerSha256) }];
    process.stdout.write(JSON.stringify({ assets }));
  }
} else if (command === 'curl') {
  if (scenario === 'download-fail' && args.includes('--location')) process.exit(7);
  if (scenario === 'manifest-fail' && args.includes('--dump-header')) process.exit(7);
  if (args.includes('--location')) fs.writeFileSync(args[args.indexOf('--output') + 1], ${JSON.stringify(installerBody)});
  else if (args.some((arg) => arg.includes('ghcr.io/token')))
    process.stdout.write(JSON.stringify(scenario === 'no-token' ? {} : { token: 'fixture-token' }));
  else if (scenario !== 'no-image-digest')
    process.stdout.write('Docker-Content-Digest: ' + (scenario === 'image-mismatch' ? 'sha256:' + '0'.repeat(64) : pins.osv.image.split('@')[1]) + '\\r\\n');
} else if (command === 'sh') {
  if (scenario === 'installer-fail') process.exit(7);
}
`);
  chmodSync(stub, 0o755);
  for (const name of ['gh', 'curl', 'sh']) copyFileSync(stub, join(bin, name));
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH ?? ''}`,
    FAKE_ROOT: root,
    RUNNER_TEMP: root,
    HOME: join(root, 'home with spaces'),
    GITHUB_PATH: join(root, 'github path'),
    GH_TOKEN: 'secret-gh',
    GITHUB_TOKEN: 'secret-github',
    NOSE_CLI_GITHUB_TOKEN: 'secret-nose',
  };
  const run = (name: string, scenario = '') => {
    const result = spawnSync(process.execPath, ['--experimental-strip-types', join(scripts, name)], {
      cwd: root,
      env: { ...env, MOCK_SCENARIO: scenario },
      encoding: 'utf8',
    });
    const calls = existsSync(join(root, 'calls.jsonl'))
      ? readFileSync(join(root, 'calls.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line) as { command: string; args: string[]; tokens?: (string | null)[] })
      : [];
    return { result, calls };
  };
  return { root, scripts, pins, env, run };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('pinned tool checker CLI', () => {
  it('checks exact release, asset and image endpoints in API order', () => {
    const { run, pins } = fixture();
    const { result, calls } = run('check-pinned-tools.ts', 'young-first');
    expect(result.status).toBe(0);
    expect(calls.map((call) => [call.command, ...call.args])).toEqual([
      ['gh', 'api', 'repos/corca-ai/nose/releases?per_page=100'],
      ['gh', 'api', `repos/corca-ai/nose/releases/tags/v${pins.nose.version}`],
      ['gh', 'api', 'repos/google/osv-scanner/releases?per_page=100'],
      ['curl', '--fail', '--silent', '--show-error', 'https://ghcr.io/token?scope=repository:google/osv-scanner-action:pull'],
      ['curl', '--fail', '--silent', '--show-error', '--dump-header', '-', '--output', '/dev/null', '--header', 'Authorization: Bearer fixture-token', '--header', 'Accept: application/vnd.docker.distribution.manifest.v2+json', `https://ghcr.io/v2/google/osv-scanner-action/manifests/v${pins.osv.version}`],
      ['gh', 'api', 'repos/semgrep/semgrep/releases?per_page=100'],
    ]);
  });

  it('warns on a mature update without failing the pin integrity checks', () => {
    const { run } = fixture();
    const { result } = run('check-pinned-tools.ts', 'update');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('::warning title=nose update available::');
  });

  for (const [scenario, message] of [
    ['no-mature', 'No stable'], ['api-fail', 'check-pinned-tools:'],
    ['malformed-api', 'Invalid'], ['no-asset', 'digest mismatch'],
    ['digest-mismatch', 'digest mismatch'], ['no-token', 'Invalid GHCR token'],
    ['no-image-digest', 'digest mismatch'], ['image-mismatch', 'digest mismatch'],
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
});

describe('Nose installer CLI', () => {
  it('verifies a downloaded installer before one token-scrubbed shell invocation', () => {
    const { run, root, pins } = fixture();
    const { result, calls } = run('install-nose.ts');
    expect(result.status).toBe(0);
    expect(calls.map((call) => call.command)).toEqual(['curl', 'sh']);
    expect(calls[0]?.args).toContain(`https://github.com/corca-ai/nose/releases/download/v${pins.nose.version}/nose-cli-installer.sh`);
    expect(calls[0]?.args).toContain('=https');
    expect(calls[1]?.tokens).toEqual([null, null, null]);
    expect(readFileSync(join(root, 'github path'), 'utf8')).toBe(`${join(root, 'home with spaces/.cargo/bin')}\n`);
  });

  for (const scenario of ['download-fail', 'installer-fail']) {
    it(`propagates ${scenario} without publishing PATH`, () => {
      const { run, root } = fixture();
      const { result, calls } = run('install-nose.ts', scenario);
      expect(result.status).not.toBe(0);
      expect(existsSync(join(root, 'github path'))).toBe(false);
      expect(calls.map((call) => call.command)).toEqual(scenario === 'download-fail' ? ['curl'] : ['curl', 'sh']);
    });
  }

  it('rejects a checksum mismatch before execution', () => {
    const { run, scripts, root, pins } = fixture();
    pins.nose.installerSha256 = '0'.repeat(64);
    writeFileSync(join(scripts, 'pinned-tools.json'), JSON.stringify(pins));
    const { result, calls } = run('install-nose.ts');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('SHA-256 mismatch');
    expect(calls.map((call) => call.command)).toEqual(['curl']);
    expect(existsSync(join(root, 'github path'))).toBe(false);
  });
});

it('rejects missing or malformed metadata before external calls', () => {
  for (const value of ['{}', '{', '{"nose":{"version":"bad"}}']) {
    const { run, scripts } = fixture();
    writeFileSync(join(scripts, 'pinned-tools.json'), value);
    const { result, calls } = run('check-pinned-tools.ts');
    expect(result.status).not.toBe(0);
    expect(calls).toEqual([]);
  }
});

it('does no reads, writes, or subprocess calls on module import', () => {
  const { scripts, root, env } = fixture();
  for (const name of ['pinned-tools.ts', 'check-pinned-tools.ts', 'install-nose.ts']) {
    const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `await import(${JSON.stringify(join(scripts, name))})`], { env, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(existsSync(join(root, 'calls.jsonl'))).toBe(false);
    expect(existsSync(join(root, 'github path'))).toBe(false);
  }
});
