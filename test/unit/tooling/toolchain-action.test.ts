import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const centralSetupAction =
  'PiesP/browser-core/automation/actions/setup-project@38cd1cb18c9c37e57e8b53a98e811450bb1a18fc';
const centralWorkflowJobs = {
  'ci.yaml': ['quality', 'unit', 'e2e', 'build'],
} as const;
const releaseWorkflowJobs = ['quality', 'unit', 'e2e', 'build'] as const;

function jobBlock(workflow: string, job: string): string {
  return (
    workflow.match(new RegExp(`^  ${job}:\\n(?:(?!^  [A-Za-z0-9_-]+:\\n)[\\s\\S])*`, 'm'))?.[0] ??
    ''
  );
}

function topLevelBlock(workflow: string, key: string): string {
  const marker = `${key}:\n`;
  const start = workflow.indexOf(marker);
  if (start === -1) {
    throw new Error(`Workflow key not found: ${key}`);
  }

  const afterMarker = start + marker.length;
  const nextKey = workflow.slice(afterMarker).search(/\n[A-Za-z][A-Za-z0-9_-]*:\n/);
  return workflow.slice(start, nextKey === -1 ? undefined : afterMarker + nextKey).trimEnd();
}

describe('central setup-project action', () => {
  it('removes the local setup action', () => {
    expect(existsSync(resolve(root, '.github/actions/setup-toolchain/action.yaml'))).toBe(false);
  });

  it('uses the immutable central action in every project setup job', () => {
    for (const [filename, jobs] of Object.entries(centralWorkflowJobs)) {
      const workflow = readFileSync(resolve(root, '.github/workflows', filename), 'utf8');

      expect(workflow).not.toContain('./.github/actions/setup-toolchain');
      if (filename === 'ci.yaml') {
        const unit = jobBlock(workflow, 'unit');
        expect(unit.split(centralSetupAction)).toHaveLength(3);
        expect(unit.indexOf('Record release setup inputs')).toBeLessThan(
          unit.indexOf('Exercise release setup with a numeric override')
        );
        expect(unit.indexOf('Exercise release setup with a numeric override')).toBeLessThan(
          unit.indexOf('Verify release setup')
        );
        expect(unit).toContain(
          'sha256sum .node-version package.json pnpm-lock.yaml pnpm-workspace.yaml'
        );
        expect(unit).toContain('sha256sum --check "$RUNNER_TEMP/release-setup-inputs.sha256"');
        expect(unit).toContain('test "$(node --version)" = "v$expected_node"');
        expect(unit).toContain('test "$(pnpm --version)" = "$expected_pnpm"');
        expect(unit).toContain('node-version: ${{ steps.release_pin.outputs.version }}');
      } else {
        expect(workflow).not.toContain('./.github/actions/setup-release');
      }
      expect(workflow).not.toContain('pnpm install --frozen-lockfile');
      expect(workflow).not.toContain('uses: pnpm/setup@');
      expect(workflow).not.toContain('uses: actions/setup-node@');
      for (const job of jobs) {
        const block = jobBlock(workflow, job);

        expect(block, `${filename} ${job} job`).toContain(`uses: ${centralSetupAction}`);
        if (job !== 'unit') {
          expect(block).not.toContain('node-version:');
        }
      }

      if (filename === 'ci.yaml') {
        const changes = jobBlock(workflow, 'changes');
        expect(changes).toContain(`uses: ${centralSetupAction}`);
        expect(changes).toContain("install-dependencies: 'false'");
        expect(changes).not.toContain('pnpm install');
      }
    }
  });

  it('uses the same reviewed provider for protected manual releases', () => {
    const workflow = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');

    expect(topLevelBlock(workflow, 'on')).toContain('workflow_dispatch:');
    expect(topLevelBlock(workflow, 'on')).toContain('tag:');
    const provenance = jobBlock(workflow, 'provenance');
    expect(provenance).toContain(`uses: ${centralSetupAction}`);
    expect(provenance).toContain("install-dependencies: 'false'");
    expect(workflow).not.toContain('pnpm install --frozen-lockfile');

    for (const job of releaseWorkflowJobs) {
      const block = jobBlock(workflow, job);

      expect(block, `release ${job} job`).toContain(`uses: ${centralSetupAction}`);
      expect(block).toContain('node-version: ${{ needs.provenance.outputs.node-version }}');
    }

    expect(workflow).not.toContain('./.github/actions/setup-release');
    expect(workflow).not.toContain('uses: actions/setup-node@');
    expect(workflow).not.toContain('uses: pnpm/action-setup@');
    expect(existsSync(resolve(root, '.github/actions/setup-release/action.yaml'))).toBe(false);
  });
});
