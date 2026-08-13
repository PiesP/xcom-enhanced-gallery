import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const cliPackagePath = resolve(root, '.github/codex-security/package.json');
const cliLockPath = resolve(root, '.github/codex-security/package-lock.json');
const workflow = readFileSync(resolve(root, '.github/workflows/codex-security.yaml'), 'utf8');
const helper = readFileSync(resolve(root, 'scripts/security/codex-security.sh'), 'utf8');
const patcherPath = resolve(root, 'scripts/security/patch-codex-security.mjs');
const osvConfig = readFileSync(resolve(root, '.github/codex-security/osv-scanner.toml'), 'utf8');
const pinnedToolsCheck = readFileSync(resolve(root, 'scripts/ci/check-pinned-tools.sh'), 'utf8');

type CliPackage = {
  dependencies: Record<string, string>;
  overrides?: Record<string, unknown>;
};

type LockPackage = {
  integrity?: string;
  link?: boolean;
  version?: string;
  dependencies?: Record<string, string>;
};

type CliLock = {
  lockfileVersion: number;
  packages: Record<string, LockPackage>;
};

describe('Codex Security CLI supply-chain controls', () => {
  it('locks the exact CLI version and every installed registry package', () => {
    const cliPackage = JSON.parse(readFileSync(cliPackagePath, 'utf8')) as CliPackage;
    const cliLock = JSON.parse(readFileSync(cliLockPath, 'utf8')) as CliLock;
    const declaredVersion = cliPackage.dependencies['@openai/codex-security'];

    expect(declaredVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(cliLock.lockfileVersion).toBe(3);
    expect(cliLock.packages['']?.dependencies?.['@openai/codex-security']).toBe(
      declaredVersion
    );
    expect(cliLock.packages['node_modules/@openai/codex-security']?.version).toBe(
      declaredVersion
    );

    for (const [packagePath, metadata] of Object.entries(cliLock.packages)) {
      if (packagePath === '' || metadata.link) continue;
      expect(metadata.integrity, `${packagePath} is missing an integrity digest`).toMatch(
        /^sha512-/
      );
    }
  });

  it('uses the upstream PDF parser fix without a local compatibility patch', () => {
    const cliPackage = JSON.parse(readFileSync(cliPackagePath, 'utf8')) as CliPackage;
    const cliLock = JSON.parse(readFileSync(cliLockPath, 'utf8')) as CliLock;

    expect(cliPackage.overrides).toBeUndefined();
    expect(cliLock.packages['node_modules/pdfjs-dist']?.version).toBe('6.2.108');
    expect(workflow).not.toContain('patch-codex-security.mjs');
    expect(helper).not.toContain('patch-codex-security.mjs');
    expect(existsSync(patcherPath)).toBe(false);
  });

  it('scopes the unpatched extract-zip advisory exception to the CLI lock', () => {
    expect(osvConfig).toContain('id = "GHSA-jmr9-qjv8-65gv"');
    expect(osvConfig).toContain('ignoreUntil = 2026-09-13');
    expect(osvConfig).toContain('rejects all symlink ZIP entries before extraction');
  });

  it('installs the trusted base lock before checking out pull-request source', () => {
    const trustedCheckout = workflow.indexOf('name: Check out trusted CLI lock');
    const lockedInstall = workflow.indexOf('name: Install locked Codex Security');
    const sourceCheckout = workflow.indexOf('name: Check out exact source revision');

    expect(trustedCheckout).toBeGreaterThan(-1);
    expect(lockedInstall).toBeGreaterThan(trustedCheckout);
    expect(sourceCheckout).toBeGreaterThan(lockedInstall);
    expect(workflow).toContain(
      "ref: ${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha || github.sha }}"
    );
    expect(workflow).toContain('npm ci \\\n');
    expect(workflow).toContain('.github/codex-security/package-lock.json');
    expect(workflow).not.toMatch(/\bnpm install\b/);
  });

  it('keys the local cache by the complete install recipe and uses the frozen install', () => {
    expect(helper).toContain('.github/codex-security/package.json');
    expect(helper).toContain('.github/codex-security/package-lock.json');
    expect(helper).toContain('install_digest=');
    expect(helper).toContain('cli-$cli_version-$install_digest');
    expect(helper).toContain('.install-recipe.sha256');
    expect(helper).toContain('npm ci \\\n');
    expect(helper).not.toMatch(/\bnpm install\b/);
    expect(helper).not.toContain('--package-lock=false');
  });

  it('rejects Node.js release lines outside the package engine contract', () => {
    expect(helper).toContain('case "$node_major" in');
    expect(helper).toContain('22)');
    expect(helper).toContain('24 | 26)');
    expect(helper).toContain('if ((node_minor < 13))');
  });

  it('checks release maturity from the locked CLI manifest', () => {
    expect(pinnedToolsCheck).toContain('.github/codex-security/package.json');
    expect(pinnedToolsCheck).toContain('.github/codex-security/package-lock.json');
    expect(pinnedToolsCheck).toContain(
      'check_npm_mature_release codex-security @openai/codex-security'
    );
    expect(pinnedToolsCheck).not.toContain(
      "CODEX_SECURITY_VERSION: \"([^\"]+)\""
    );
  });
});
