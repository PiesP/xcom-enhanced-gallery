import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const cliRoot = resolve(root, 'scripts/security/codex-security');
const cliPackagePath = resolve(cliRoot, 'package.json');
const cliLockPath = resolve(cliRoot, 'package-lock.json');
const legacyCliPackagePath = resolve(root, '.github/codex-security/package.json');
const legacyCliLockPath = resolve(root, '.github/codex-security/package-lock.json');
const dependabot = readFileSync(resolve(root, '.github/dependabot.yaml'), 'utf8');
const workflow = readFileSync(resolve(root, '.github/workflows/codex-security.yaml'), 'utf8');
const securityWorkflow = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
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
  it('separates the updateable CLI closure from repository security policy', () => {
    expect(existsSync(cliPackagePath)).toBe(true);
    expect(existsSync(cliLockPath)).toBe(true);
    expect(existsSync(legacyCliPackagePath)).toBe(false);
    expect(existsSync(legacyCliLockPath)).toBe(false);

    for (const policyFile of ['osv-scanner.toml', 'scan.md', 'threat-model.md']) {
      expect(existsSync(resolve(root, '.github/codex-security', policyFile))).toBe(true);
    }
  });

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

  it('keeps the CLI closure under daily Dependabot monitoring', () => {
    expect(dependabot).toMatch(
      /package-ecosystem: "npm"\n\s+directory: "\/scripts\/security\/codex-security"[\s\S]*?interval: "daily"/
    );
    expect(dependabot).not.toContain('directory: "/.github/codex-security"');
    expect(dependabot).toContain('prefix: "chore(deps-security)"');
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

    const recursiveScanCount = securityWorkflow.match(/\s-r \\\n/g)?.length ?? 0;
    const configuredScanCount =
      securityWorkflow.match(/--config=\/results\/osv-scanner\.toml/g)?.length ?? 0;
    expect(recursiveScanCount).toBeGreaterThan(0);
    expect(configuredScanCount).toBe(recursiveScanCount);
    expect(securityWorkflow).not.toContain(
      '--config=/src/.github/codex-security/osv-scanner.toml'
    );
  });

  it('uses one base-pinned policy for both pull-request OSV scans', () => {
    const prJob =
      securityWorkflow.match(/\n  osv-scan-pr:[\s\S]*?\n  osv-scan-dispatch:/)?.[0] ?? '';
    const baseCheckout = prJob.indexOf('git switch --force --detach "$BASE_SHA"');
    const policyCopy = prJob.indexOf(
      'install -m 0600 .github/codex-security/osv-scanner.toml "$RUNNER_TEMP/osv-results/osv-scanner.toml"'
    );
    const oldScan = prJob.indexOf('--output-file=/results/old-results.json');
    const headCheckout = prJob.indexOf('git switch --force --detach "$GITHUB_SHA"');
    const newScan = prJob.indexOf('--output-file=/results/new-results.json');

    expect(prJob).toContain('fetch-depth: 0');
    expect(prJob).toContain('BASE_SHA: ${{ github.event.pull_request.base.sha }}');
    expect(baseCheckout).toBeGreaterThan(-1);
    expect(policyCopy).toBeGreaterThan(baseCheckout);
    expect(oldScan).toBeGreaterThan(policyCopy);
    expect(headCheckout).toBeGreaterThan(oldScan);
    expect(newScan).toBeGreaterThan(headCheckout);
    expect(prJob.match(/--config=\/results\/osv-scanner\.toml/g)).toHaveLength(2);
  });

  it('pins merge-queue OSV policy to its validated base revision', () => {
    const dispatchJob =
      securityWorkflow.match(/\n  osv-scan-dispatch:[\s\S]*?\n  codeql:/)?.[0] ?? '';
    const checkout = dispatchJob.indexOf('name: 📥 Checkout code');
    const policySha = dispatchJob.indexOf(
      'POLICY_SHA: ${{ github.event.merge_group.base_sha || github.sha }}'
    );
    const shaValidation = dispatchJob.indexOf(
      '[[ "$POLICY_SHA" =~ ^[0-9a-f]{40}$ ]]'
    );
    const missingShaCheck = dispatchJob.indexOf(
      'if ! git cat-file -e "$POLICY_SHA^{commit}" 2>/dev/null; then'
    );
    const fullFetch = dispatchJob.indexOf(
      'git fetch --no-tags --prune --unshallow origin'
    );
    const shaVerification = dispatchJob.indexOf(
      'git cat-file -e "$POLICY_SHA^{commit}"',
      fullFetch
    );
    const policyCopy = dispatchJob.indexOf(
      'git show "$POLICY_SHA:.github/codex-security/osv-scanner.toml" > "$RUNNER_TEMP/osv-results/osv-scanner.toml"'
    );
    const scan = dispatchJob.indexOf('name: 🛡️ Run OSV scan');

    expect(dispatchJob).toContain("github.event_name == 'push'");
    expect(dispatchJob).toContain("github.event_name == 'workflow_dispatch'");
    expect(dispatchJob).toContain("github.event_name == 'schedule'");
    expect(dispatchJob).toContain('if [[ "$GITHUB_EVENT_NAME" == "merge_group" ]]');
    expect(dispatchJob).toContain(
      'install -m 0600 .github/codex-security/osv-scanner.toml "$RUNNER_TEMP/osv-results/osv-scanner.toml"'
    );
    expect(policySha).toBeGreaterThan(checkout);
    expect(shaValidation).toBeGreaterThan(policySha);
    expect(missingShaCheck).toBeGreaterThan(shaValidation);
    expect(fullFetch).toBeGreaterThan(missingShaCheck);
    expect(shaVerification).toBeGreaterThan(fullFetch);
    expect(policyCopy).toBeGreaterThan(shaVerification);
    expect(scan).toBeGreaterThan(policyCopy);
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
    expect(workflow).toContain('scripts/security/codex-security/package-lock.json');
    expect(workflow).not.toContain('.github/codex-security/package-lock.json');
    expect(workflow).not.toMatch(/\bnpm install\b/);
  });

  it('triggers for both CLI closure and repository security policy changes', () => {
    expect(workflow).toContain('- ".github/codex-security/**"');
    expect(workflow).toContain('- "scripts/security/codex-security/**"');
  });

  it('keys the local cache by the complete install recipe and uses the frozen install', () => {
    expect(helper).toContain('scripts/security/codex-security/package.json');
    expect(helper).toContain('scripts/security/codex-security/package-lock.json');
    expect(helper).not.toContain('.github/codex-security/package.json');
    expect(helper).not.toContain('.github/codex-security/package-lock.json');
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
    expect(pinnedToolsCheck).toContain('scripts/security/codex-security/package.json');
    expect(pinnedToolsCheck).toContain('scripts/security/codex-security/package-lock.json');
    expect(pinnedToolsCheck).not.toContain('.github/codex-security/package.json');
    expect(pinnedToolsCheck).not.toContain('.github/codex-security/package-lock.json');
    expect(pinnedToolsCheck).toContain(
      'check_npm_mature_release codex-security @openai/codex-security'
    );
    expect(pinnedToolsCheck).not.toContain(
      "CODEX_SECURITY_VERSION: \"([^\"]+)\""
    );
  });
});
