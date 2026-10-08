import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const gateWorkflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/dependabot-auto-merge.yaml'),
  'utf8',
);
const applyWorkflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/dependabot-auto-merge-apply.yaml'),
  'utf8',
);

describe('Dependabot auto-merge security', () => {
  it('evaluates only Dependabot events with read-only permissions', () => {
    expect(gateWorkflow).toContain("github.event.sender.login == 'dependabot[bot]'");
    expect(gateWorkflow).toContain('contents: read');
    expect(gateWorkflow).toContain('pull-requests: read');
    expect(gateWorkflow).toContain('maintainer-changes');
    expect(gateWorkflow).toContain('dependabot-auto-merge-gate');
    expect(gateWorkflow).not.toContain('AUTO_MERGE_TOKEN');
    expect(gateWorkflow).not.toContain('actions/checkout');
  });

  it('keeps apply read-only and revalidates exact provenance before manual review', () => {
    expect(applyWorkflow).toContain('workflow_run:');
    expect(applyWorkflow).toContain('workflows: ["🤖 Dependabot Auto-Merge Gate"]');
    expect(applyWorkflow).toContain("workflow_run.conclusion == 'success'");
    expect(applyWorkflow).toContain("workflow_run.actor.login == 'dependabot[bot]'");
    expect(applyWorkflow).toContain("workflow_run.event == 'pull_request_target'");
    expect(applyWorkflow).toContain('run-id: ${{ github.event.workflow_run.id }}');
    expect(applyWorkflow).toContain('digest-mismatch: error');
    expect(applyWorkflow).not.toMatch(/(?:contents|pull-requests|actions): write/);
    const modes = [...applyWorkflow.matchAll(/run: node --experimental-strip-types scripts\/ci\/dependabot-apply\.ts (\w+)/g)].map(match => match[1]);
    expect(modes).toEqual(['gate', 'validate', 'manual']);
    expect(applyWorkflow).toContain('persist-credentials: false');
    expect(applyWorkflow).toContain("install-dependencies: 'false'");
    expect(applyWorkflow).toContain('HEAD_SHA: ${{ steps.gate.outputs.head_sha }}');
    expect(applyWorkflow).toContain('BASE_REF: ${{ steps.gate.outputs.base_ref }}');
    expect(applyWorkflow).not.toContain('AUTO_MERGE_TOKEN');
    expect(applyWorkflow).not.toContain('--admin');
    expect(gateWorkflow).toContain('schema_version: 2, policy_id: "maintainer-review-v1"');
  });

  it.each([
    ['github-actions', 'version-update:semver-patch', 'actions/checkout', ''],
    ['github-actions', 'version-update:semver-minor', 'foreign/action', 'open'],
    ['npm', 'version-update:semver-patch', 'vite', ''],
    ['npm_and_yarn', 'version-update:semver-minor', 'solid-js', 'OPEN'],
    ['npm', 'version-update:semver-patch', 'typescript,unknown-tool', 'open'],
    ['npm', 'version-update:semver-major', 'vitest', 'open'],
    ['pip', 'unknown', 'unknown-tool', 'open'],
    ['', '', '', ''],
    ['npm', '', '', ''],
    ['npm', 'malformed', '$(exit 42)', 'open'],
  ])('requires review for actual gate metadata %s / %s / %s / %s', (ecosystem, update, dependencies, alert) => {
    const script = gateWorkflow.match(/id: decide[\s\S]*?run: \|\n([\s\S]*?)\n      - name:/)?.[1];
    expect(script).toBeDefined();
    const root = mkdtempSync(join(tmpdir(), 'dependabot-policy-'));
    try {
      const output = join(root, 'output');
      const result = spawnSync('bash', ['-c', script ?? 'exit 99'], {
        encoding: 'utf8', timeout: 5_000,
        env: { ...process.env, GITHUB_OUTPUT: output, ECOSYSTEM: ecosystem,
          UPDATE_TYPE: update, DEPENDENCIES: dependencies, ALERT_STATE: alert, MAINTAINER_CHANGES: '' },
      });
      expect(result.status, result.stderr).toBe(0);
      const decision = readFileSync(output, 'utf8');
      expect(decision).toContain('should_merge=false');
      expect(decision).not.toContain('should_merge=true');
      expect(decision).toContain(alert.toLowerCase() === 'open'
        ? 'reason=security update requires prioritized maintainer review'
        : 'reason=maintainer review required for all dependency updates');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
