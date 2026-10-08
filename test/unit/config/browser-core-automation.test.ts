import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(resolve(import.meta.dirname, '../../../.github/workflows/update-browser-core.yaml'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../../package.json'), 'utf8')) as { scripts: Record<string, string> };

describe('browser-core workflow composition', () => {
  it('runs local policy from the trusted default branch after runtime setup', () => {
    const checkout = workflow.indexOf('ref: master');
    const runtime = workflow.indexOf('automation/actions/setup-project@279124fa998847bd0184d2de12bdaadcd6d2f969');
    const prepare = workflow.indexOf('run: node --experimental-strip-types scripts/ci/update-browser-core.ts prepare');
    expect(checkout).toBeGreaterThan(-1);
    expect(runtime).toBeGreaterThan(checkout);
    expect(prepare).toBeGreaterThan(runtime);
    expect(workflow).toContain("install-dependencies: 'false'");
    expect(workflow).toContain('submodules: false');
  });

  it('classifies before publication and passes the exact prepared revisions', () => {
    const impact = workflow.indexOf('automation/actions/consumer-impact@49969d6847f1a7c5130304d4aa25455fdd87e4eb');
    expect(impact).toBeGreaterThan(workflow.indexOf('scripts/ci/update-browser-core.ts prepare'));
    expect(workflow.indexOf('scripts/ci/update-browser-core.ts publish')).toBeGreaterThan(impact);
    expect(workflow).toContain('base-sha: ${{ steps.prepare.outputs.base }}');
    expect(workflow).toContain('head-sha: ${{ steps.prepare.outputs.head }}');
    expect(workflow).toContain('CONSUMER_IMPACT: ${{ steps.impact.outputs.impact }}');
    expect(workflow.match(/if: steps\.prepare\.outputs\.ready == 'true'/g)).toHaveLength(3);
    expect(workflow).toContain('paths-ignore:\n      - packages/core');
  });

  it('keeps dry-run and diagnostics explicit and registers actual CLI tests', () => {
    const classify = workflow.slice(workflow.indexOf('  classify:'), workflow.indexOf('  publish:'));
    const publish = workflow.slice(workflow.indexOf('  publish:'));
    expect(workflow.slice(0, workflow.indexOf('jobs:'))).not.toMatch(/(?:actions|contents|pull-requests): write/);
    expect(classify).not.toMatch(/(?:actions|contents|pull-requests): write/);
    expect(classify).toContain("DRY_RUN: 'true'");
    expect(classify).toContain('persist-credentials: false');
    expect(publish).not.toContain('automation/actions/consumer-impact');
    expect(publish).toContain('needs: classify');
    expect(publish).toContain('INPUT_CORE_SHA: ${{ needs.classify.outputs.head }}');
    expect(publish).toContain('CLASSIFIED_BASE_SHA: ${{ needs.classify.outputs.base }}');
    expect(publish).toContain('CLASSIFIED_CORE_SHA: ${{ needs.classify.outputs.head }}');
    expect(publish).toContain('persist-credentials: false');
    expect(publish).toContain("install-dependencies: 'false'");
    expect(workflow).toContain('PREFLIGHT: ${{ inputs.preflight }}');
    expect(workflow).not.toContain('AUTO_MERGE_TOKEN');
    expect(workflow).not.toContain('gh pr merge');
    expect(manifest.scripts['test:ci']).toContain('scripts/ci/repository-authority.test.ts');
  });
});
