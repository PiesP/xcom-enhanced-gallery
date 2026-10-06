import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Parser, scanner, reporter, and private-copy behavior is exercised by the
// pinned browser-core provider. This consumer test protects its workflow wiring.
const workflow = readFileSync(
  resolve(import.meta.dirname, '../../../.github/workflows/security.yaml'),
  'utf8'
);
const providerPin = '9a9471ad301e439bcd1ebc52334cf6b4399510e7';
const runtimePin = '279124fa998847bd0184d2de12bdaadcd6d2f969';
const active = "${{ needs.changes.result != 'success' || needs.changes.outputs.osv != 'false' }}";
const inactive = "${{ needs.changes.result == 'success' && needs.changes.outputs.osv == 'false' }}";
const upload = "${{ !cancelled() && steps.osv-report.outputs.sarif-upload == 'true' && (needs.changes.result != 'success' || needs.changes.outputs.osv != 'false') }}";

function job(name: string): string {
  const start = workflow.search(new RegExp(`^  ${name}:$`, 'm'));
  if (start < 0) throw new Error(`Missing OSV job: ${name}`);
  const remaining = workflow.slice(start + name.length + 4);
  const end = remaining.search(/^  [a-z][a-z-]*:/m);
  return workflow.slice(start, end < 0 ? undefined : start + name.length + 4 + end);
}

function step(jobBody: string, name: string): string {
  const lines = jobBody.split('\n');
  const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  if (start < 0) throw new Error(`Missing step: ${name}`);
  let end = start + 1;
  while (end < lines.length && !lines[end]?.startsWith('      - name: ')) end += 1;
  return lines.slice(start, end).join('\n');
}

function inOrder(body: string, names: string[]): void {
  const positions = names.map((name) => body.indexOf(`- name: ${name}`));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
}

describe('shared consumer OSV workflow composition', () => {
  const pr = job('osv-scan-pr');
  const full = job('osv-scan-dispatch');

  it('retains the required event contexts and fail-closed scan selection', () => {
    expect(pr).toContain("github.event_name == 'pull_request'");
    for (const event of ['push', 'workflow_dispatch', 'merge_group', 'schedule']) {
      expect(full).toContain(`github.event_name == '${event}'`);
    }
    for (const body of [pr, full]) {
      expect(body).toContain('name: pr-gate/osv / osv-scan');
      expect(step(body, '⏭️ No dependency-relevant changes')).toContain(`if: ${inactive}`);
      expect(step(body, '📊 Upload OSV SARIF to GitHub Security')).toContain(`if: ${upload}`);
      expect(step(body, '📊 Upload OSV SARIF to GitHub Security')).toContain(
        'sarif_file: ${{ runner.temp }}/osv-results/osv-results.sarif'
      );
      expect(body).not.toContain('continue-on-error:');
      expect(body).toContain('needs: [changes, pin-metadata]');
      expect(step(body, '❌ Require reviewed scanner image')).toContain(
        "if: ${{ needs['pin-metadata'].result != 'success' }}"
      );
      expect(body).toContain("OSV_SCANNER_IMAGE: ${{ needs['pin-metadata'].outputs.OSV_SCANNER_IMAGE }}");
      const names = [...body.matchAll(/^      - name: (.+)$/gm)].map((match) => match[1]);
      for (const name of names.slice(2, -1)) expect(step(body, name ?? '')).toContain(`if: ${active}`);
    }
  });

  it('pins PR runtime and helper to the base before scanning, then restores the target', () => {
    inOrder(pr, [
      '📥 Checkout PR result and history', '⏪ Checkout the trusted PR base',
      '📦 Setup trusted OSV runtime', '🔒 Prepare pinned OSV helper',
      '📁 Prepare private OSV result directory', '🛡️ Scan dependencies before the PR',
      '⏩ Checkout the PR result', '🛡️ Scan dependencies after the PR',
      '📋 Report newly introduced vulnerabilities', '📊 Upload OSV SARIF to GitHub Security',
    ]);
    const checkout = step(pr, '📥 Checkout PR result and history');
    expect(checkout).toContain('ref: ${{ github.sha }}');
    expect(checkout).toContain('fetch-depth: 0');
    expect(checkout).toContain('submodules: false');
    expect(checkout).toContain('persist-credentials: false');
    const base = step(pr, '⏪ Checkout the trusted PR base');
    expect(base).toContain('BASE_SHA: ${{ github.event.pull_request.base.sha }}');
    expect(base).toContain('git switch --force --detach "$BASE_SHA"');
    expect(base).toContain('git submodule update --init --recursive');
    expect(step(pr, '⏩ Checkout the PR result')).toContain('git switch --force --detach "$GITHUB_SHA"');
    expect(step(pr, '⏩ Checkout the PR result')).toContain('git submodule update --init --recursive');
  });

  it('selects the merge-group base manifest before setup and restores the exact target', () => {
    inOrder(full, [
      '📥 Checkout target and history', '🔒 Select trusted OSV runtime manifest',
      '📦 Setup trusted OSV runtime', '🔒 Prepare pinned OSV helper',
      '📁 Prepare private OSV result directory', '⏩ Restore target for the full scan',
      '🛡️ Run OSV scan', '📋 Convert OSV results to SARIF and enforce the vulnerability gate',
      '📊 Upload OSV SARIF to GitHub Security',
    ]);
    expect(step(full, '📥 Checkout target and history')).toContain('ref: ${{ github.sha }}');
    expect(step(full, '📥 Checkout target and history')).toContain('fetch-depth: 0');
    expect(step(full, '📥 Checkout target and history')).toContain('submodules: false');
    const policy = step(full, '🔒 Select trusted OSV runtime manifest');
    expect(policy).toContain('POLICY_SHA: ${{ github.event.merge_group.base_sha || github.sha }}');
    expect(policy).toContain('[[ "$(git rev-parse HEAD)" == "$GITHUB_SHA" ]]');
    expect(policy).toContain('git switch --force --detach "$POLICY_SHA"');
    expect(policy).toContain('[[ "$POLICY_SHA" == "$GITHUB_SHA" ]]');
    expect(step(full, '⏩ Restore target for the full scan')).toContain('git switch --force --detach "$GITHUB_SHA"');
    expect(step(full, '⏩ Restore target for the full scan')).toContain('git submodule update --init --recursive');
  });

  it('uses a private provider-owned helper with the consumer profile in every mode', () => {
    for (const body of [pr, full]) {
      expect(step(body, '📦 Setup trusted OSV runtime')).toContain(`setup-project@${runtimePin}`);
      expect(step(body, '📦 Setup trusted OSV runtime')).toContain("install-dependencies: 'false'");
      expect(step(body, '🔒 Prepare pinned OSV helper')).toContain(`prepare-osv@${providerPin}`);
      expect(step(body, '🔒 Prepare pinned OSV helper')).toContain('id: osv-helper');
      const directory = step(body, '📁 Prepare private OSV result directory');
      expect(directory).toContain('umask 077');
      expect(directory).toContain('install -d -m 0700 "$RUNNER_TEMP/osv-results"');
      expect(directory).toContain('osv-empty.toml');
      expect(body).not.toContain('scripts/security/validate-osv-results.py');
      expect(body).not.toContain('python3');
    }
    const commands: Array<[string, string, string]> = [
      [pr, '🛡️ Scan dependencies before the PR', 'scan-old'],
      [pr, '🛡️ Scan dependencies after the PR', 'scan-new'],
      [pr, '📋 Report newly introduced vulnerabilities', 'report-pr'],
      [full, '🛡️ Run OSV scan', 'scan-full'],
      [full, '📋 Convert OSV results to SARIF and enforce the vulnerability gate', 'report-full'],
    ];
    for (const [body, name, mode] of commands) {
      const command = step(body, name);
      expect(command).toContain(`if: ${active}`);
      expect(command).toContain('OSV_HELPER: ${{ steps.osv-helper.outputs.helper-path }}');
      expect(command).toContain(`run: node --strip-types "$OSV_HELPER" ${mode} consumer`);
    }
  });
});
