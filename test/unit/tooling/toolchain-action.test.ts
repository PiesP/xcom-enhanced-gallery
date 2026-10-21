import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const centralSetupAction =
  'PiesP/browser-core/automation/actions/setup-project@279124fa998847bd0184d2de12bdaadcd6d2f969';
const releaseSetupAction = './.github/actions/setup-release';
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
        expect(workflow.split(releaseSetupAction)).toHaveLength(2);
        expect(unit).toContain(`uses: ${releaseSetupAction}`);
        expect(unit.indexOf(centralSetupAction)).toBeLessThan(unit.indexOf(releaseSetupAction));
        expect(unit.indexOf('Record release setup inputs')).toBeLessThan(
          unit.indexOf(releaseSetupAction)
        );
        expect(unit.indexOf(releaseSetupAction)).toBeLessThan(unit.indexOf('Verify release setup'));
        expect(unit).toContain('sha256sum --check "$RUNNER_TEMP/release-setup-inputs.sha256"');
        expect(unit).toContain('test "$(node --version)" = "v$expected_node"');
        expect(unit).toContain('test "$(pnpm --version)" = "$expected_pnpm"');
      } else {
        expect(workflow).not.toContain(releaseSetupAction);
      }
      expect(workflow).not.toContain('pnpm install --frozen-lockfile');
      expect(workflow).not.toContain('uses: pnpm/setup@');
      expect(workflow).not.toContain('uses: actions/setup-node@');
      for (const job of jobs) {
        const block = jobBlock(workflow, job);

        expect(block, `${filename} ${job} job`).toContain(`uses: ${centralSetupAction}`);
        expect(block).not.toContain('node-version:');
      }

      if (filename === 'ci.yaml') {
        const changes = jobBlock(workflow, 'changes');
        expect(changes).toContain(`uses: ${centralSetupAction}`);
        expect(changes).toContain("install-dependencies: 'false'");
        expect(changes).not.toContain('pnpm install');
      }
    }
  });

  it('uses the release-only setup action for protected manual releases', () => {
    const workflow = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');
    const action = readFileSync(resolve(root, '.github/actions/setup-release/action.yaml'), 'utf8');

    expect(topLevelBlock(workflow, 'on')).toContain('workflow_dispatch:');
    expect(topLevelBlock(workflow, 'on')).toContain('tag:');
    const provenance = jobBlock(workflow, 'provenance');
    expect(provenance).toContain(`uses: ${centralSetupAction}`);
    expect(provenance).toContain("install-dependencies: 'false'");
    expect(workflow).not.toContain('pnpm install --frozen-lockfile');

    for (const job of releaseWorkflowJobs) {
      const block = jobBlock(workflow, job);

      expect(block, `release ${job} job`).toContain(`uses: ${releaseSetupAction}`);
      expect(block).not.toContain(centralSetupAction);
      expect(block).toContain('node-version: ${{ needs.provenance.outputs.node-version }}');
    }

    expect(workflow.split(releaseSetupAction)).toHaveLength(releaseWorkflowJobs.length + 1);
    const resolveStep = action.indexOf('run: node "$GITHUB_ACTION_PATH/resolve-runtime.mjs"');
    const node = action.indexOf(
      'uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0'
    );
    const pnpm = action.indexOf(
      'uses: pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0'
    );
    const install = action.indexOf('run: pnpm install --frozen-lockfile --no-runtime');
    expect(resolveStep).toBeGreaterThan(-1);
    expect(node).toBeGreaterThan(resolveStep);
    expect(pnpm).toBeGreaterThan(node);
    expect(install).toBeGreaterThan(pnpm);
    expect(action).toContain('node-version: ${{ steps.runtime.outputs.version }}');
    expect(action).toContain('package-manager-cache: false');
    expect(action).toContain('package_json_file: package.json');
    expect(action).toContain('\n        cache: false\n');
    expect(action).toContain('run_install: false');
    expect(action).toContain('standalone: false');
    expect(action).not.toContain('uses: pnpm/setup@');
  });
});
