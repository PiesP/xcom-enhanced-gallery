import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const installer = readFileSync(resolve(root, 'scripts/ci/install-nose.sh'), 'utf8');
const pinnedToolsCheck = readFileSync(resolve(root, 'scripts/ci/check-pinned-tools.sh'), 'utf8');
const workflowFiles = [
  '.github/workflows/ci.yaml',
  '.github/workflows/deep-checks.yaml',
  '.github/workflows/release.yaml',
];
const workflows = workflowFiles
  .map((path) => readFileSync(resolve(root, path), 'utf8'))
  .join('\n');

describe('Nose installer supply-chain controls', () => {
  it('verifies a repository-pinned installer digest before execution', () => {
    const digest = installer.match(/^nose_installer_sha256="([0-9a-f]{64})"$/m)?.[1];
    const verification = installer.indexOf('sha256sum --check --status');
    const execution = installer.indexOf(
      'env -u GH_TOKEN -u GITHUB_TOKEN -u NOSE_CLI_GITHUB_TOKEN sh "$installer"'
    );

    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(verification).toBeGreaterThan(-1);
    expect(execution).toBeGreaterThan(verification);
    expect(installer).not.toContain('expected_digest="$(gh api');
    expect(installer).not.toContain(': "${GH_TOKEN:?GH_TOKEN is required}"');
  });

  it('detects upstream replacement without trusting the live digest for execution', () => {
    expect(pinnedToolsCheck).toContain(
      'nose_installer_sha256="$(sed -nE'
    );
    expect(pinnedToolsCheck).toContain(
      'check_release_asset_digest nose-installer corca-ai/nose'
    );
    expect(pinnedToolsCheck).toContain('nose-cli-installer.sh "$nose_installer_sha256"');
  });

  it('does not expose the job token to the installer step', () => {
    expect(workflows).not.toMatch(
      /env:\n\s+GH_TOKEN: \$\{\{ github\.token \}\}\n\s+run: bash scripts\/ci\/install-nose\.sh/
    );
  });
});
