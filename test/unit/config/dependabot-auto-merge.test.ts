import { readFileSync } from 'node:fs';
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

  it('grants write permissions only to the exact completed gate run', () => {
    expect(applyWorkflow).toContain('workflow_run:');
    expect(applyWorkflow).toContain('workflows: ["🤖 Dependabot Auto-Merge Gate"]');
    expect(applyWorkflow).toContain('types: [completed]');
    expect(applyWorkflow).toContain("workflow_run.conclusion == 'success'");
    expect(applyWorkflow).toContain("workflow_run.actor.login == 'dependabot[bot]'");
    expect(applyWorkflow).toContain('run-id: ${{ github.event.workflow_run.id }}');
    expect(applyWorkflow).toContain('digest-mismatch: error');
    expect(applyWorkflow).toMatch(
      /permissions:\n  actions: read\n  contents: read\n  pull-requests: read/,
    );
    expect(applyWorkflow).toMatch(
      /approve:\n[\s\S]*?needs: validate\n[\s\S]*?if: needs\.validate\.outputs\.eligible == 'true'[\s\S]*?permissions:\n      contents: write\n      pull-requests: write/,
    );
  });

  it('revalidates every commit and approves only the unchanged head', () => {
    expect(applyWorkflow).toContain('pulls/$PR_NUMBER/commits');
    expect(applyWorkflow).toContain('dependabot[bot]');
    expect(applyWorkflow).toContain('web-flow');
    expect(applyWorkflow).toContain('verification.verified');
    expect(applyWorkflow).toContain("while IFS=$'\\t' read -r SHA AUTHOR COMMITTER VERIFIED");
    expect(applyWorkflow).toContain('Commit $SHA was not created and verified by Dependabot.');
    expect(applyWorkflow).toContain('CURRENT_HEAD');
    expect(applyWorkflow).toContain('Pull request head changed during provenance validation.');
    expect(applyWorkflow).toContain('pulls/$PR_NUMBER/reviews');
    expect(applyWorkflow).toContain('--raw-field commit_id="$HEAD_SHA"');
    expect(applyWorkflow).toContain('--raw-field event="APPROVE"');
    expect(applyWorkflow).toContain('reason_base64');
    expect(applyWorkflow).not.toContain('gh pr review --approve');
    expect(applyWorkflow).not.toContain('AUTO_MERGE_TOKEN');
  });

  it('preserves eligible update auto-merge behind branch protection', () => {
    expect(gateWorkflow).toContain('version-update:semver-patch');
    expect(gateWorkflow).toContain('version-update:semver-minor');
    expect(applyWorkflow).toContain('gh pr merge "$PR_NUMBER"');
    expect(applyWorkflow).toContain('--match-head-commit "$HEAD_SHA"');
    expect(applyWorkflow).toContain('--auto');
    expect(applyWorkflow).toContain('--squash');
    expect(applyWorkflow).not.toContain('--admin');
  });
});
