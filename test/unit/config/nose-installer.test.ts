import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const installer = readFileSync(resolve(root, 'scripts/ci/install-nose.ts'), 'utf8');
const checker = readFileSync(resolve(root, 'scripts/ci/check-pinned-tools.ts'), 'utf8');
const metadata = readFileSync(resolve(root, 'scripts/ci/pinned-tools.json'), 'utf8');
const security = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
const deep = readFileSync(resolve(root, '.github/workflows/deep-checks.yaml'), 'utf8');
const release = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');
const publishedSha = 'a1fd01821cab105c6a6430ee81e18030532843e8';
const pinnedFiles = ['pinned-tools.json', 'pinned-tools.ts', 'check-pinned-tools.ts', 'install-nose.ts'];

function stepScript(workflow: string, name: string): string {
  const section = workflow.split(`      - name: ${name}\n`)[1]?.split('\n      - name: ')[0] ?? '';
  const block = section.match(/        run: \|\n((?:          .*\n)*)/u)?.[1] ?? '';
  if (!block) throw new Error(`Missing ${name} run block`);
  return block.replace(/^          /gmu, '');
}

describe('Nose and scanner pin workflow contracts', () => {
  it('uses structured metadata for the installer hash before execution', () => {
    const pins = JSON.parse(metadata) as { nose: { installerSha256: string } };
    expect(pins.nose.installerSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(installer.indexOf("const actual = createHash('sha256')")).toBeLessThan(
      installer.indexOf("run('sh', [installer], cleanEnv)")
    );
    expect(installer).toContain('actual !== nose.installerSha256');
    for (const secret of ['GH_TOKEN', 'GITHUB_TOKEN', 'NOSE_CLI_GITHUB_TOKEN']) {
      expect(installer).toContain(`delete cleanEnv.${secret};`);
    }
    expect(checker).toContain('pins.nose.installerSha256');
    expect(checker).toContain('::warning title=${name} update available::');
  });

  it('resolves both scanner images before any security container or scan job', () => {
    const metadataJob = security.match(/\n  pin-metadata:[\s\S]*?\n  changes:/u)?.[0] ?? '';
    expect(metadataJob).toContain(`ref: ${publishedSha}`);
    expect(metadataJob).toContain('submodules: false');
    expect(metadataJob).toContain("install-dependencies: 'false'");
    expect(metadataJob).toContain('GITHUB_ENV="$GITHUB_OUTPUT" node --experimental-strip-types');
    expect(metadataJob).toContain('pinned-tools.ts" env');
    expect(security).toContain("needs['pin-metadata'].outputs.OSV_SCANNER_IMAGE");
    expect(security).toContain("needs['pin-metadata'].outputs.SEMGREP_IMAGE");
    expect(security).not.toContain('ghcr.io/google/osv-scanner-action@sha256:');
    expect(security).not.toContain('semgrep/semgrep:1.178.0@sha256:');
  });

  it('runs checkers and installers only from the reviewed private copy', () => {
    const pinnedJob = security.match(/\n  pinned-tools:[\s\S]*?\n  osv-scan-pr:/u)?.[0] ?? '';
    expect(pinnedJob).toContain(`ref: ${publishedSha}`);
    expect(pinnedJob).toContain('"$pinned_dir/check-pinned-tools.ts"');
    for (const workflow of [deep, release]) {
      expect(workflow).toContain(`trusted_sha=${publishedSha}`);
      expect(workflow).toContain('git show "$trusted_sha:scripts/ci/$name"');
      expect(workflow).toContain('"$pinned_dir/install-nose.ts"');
      expect(workflow).not.toContain('install-nose.sh');
      const installStep = workflow.match(/      - name: 🔧 Install nose\n[\s\S]*?(?=\n      - name:|$)/u)?.[0] ?? '';
      expect(installStep).not.toContain('GH_TOKEN:');
    }
    expect(security).not.toContain('check-pinned-tools.sh');
  });

  it('executes the scanner image adapter from a private four-file copy', () => {
    const temp = mkdtempSync(join(tmpdir(), 'pin workflow '));
    try {
      const output = join(temp, 'output');
      const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', stepScript(security, '🔐 Export validated scanner images')], {
        cwd: root,
        env: { ...process.env, RUNNER_TEMP: temp, GITHUB_OUTPUT: output },
        encoding: 'utf8',
      });
      expect(result.status, result.stderr).toBe(0);
      const pins = JSON.parse(metadata) as { osv: { image: string }; semgrep: { image: string } };
      expect(readFileSync(output, 'utf8')).toBe(
        `OSV_SCANNER_IMAGE=${pins.osv.image}\nSEMGREP_IMAGE=${pins.semgrep.image}\n`
      );
      const copy = join(temp, readdirSync(temp).find((entry) => entry.startsWith('pinned-tools.')) ?? '');
      for (const name of pinnedFiles)
        expect(readFileSync(join(copy, name))).toEqual(readFileSync(resolve(root, 'scripts/ci', name)));
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it('retrieves the exact reviewed installer files in both duplication jobs', () => {
    const temp = mkdtempSync(join(tmpdir(), 'pin workflow '));
    try {
      const bin = join(temp, 'bin');
      mkdirSync(bin);
      const node = join(bin, 'node');
      writeFileSync(node, '#!/bin/sh\nprintf "%s\\n" "$@" > "$TEST_NODE_LOG"\n');
      chmodSync(node, 0o755);
      for (const workflow of [deep, release]) {
        const output = join(temp, `node-${workflow === deep ? 'deep' : 'release'}.log`);
        const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', stepScript(workflow, '🔧 Install nose')], {
          cwd: root,
          env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH ?? ''}`,
            RUNNER_TEMP: temp,
            TEST_NODE_LOG: output,
          },
          encoding: 'utf8',
        });
        expect(result.status, result.stderr).toBe(0);
        const invocation = readFileSync(output, 'utf8');
        expect(invocation).toMatch(/--experimental-strip-types\n.*\/install-nose\.ts\n/u);
        const copy = dirname(invocation.trim().split('\n').at(-1) ?? '');
        for (const name of pinnedFiles) {
          const published = execFileSync('git', ['show', `${publishedSha}:scripts/ci/${name}`], { cwd: root });
          expect(readFileSync(join(copy, name))).toEqual(published);
        }
      }
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
