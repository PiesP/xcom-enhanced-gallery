import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const centralSetupAction =
  'PiesP/browser-core/automation/actions/setup-project@f630a8f0119dd6b4f1aa011f8510489936c7a7b9';
const releaseSetupAction = './.github/actions/setup-release';
const centralWorkflowJobs = {
  'ci.yaml': ['quality', 'unit', 'e2e', 'build'],
  'deep-checks.yaml': ['mutation'],
} as const;
const releaseWorkflowJobs = ['quality', 'unit', 'e2e', 'mutation', 'build'] as const;

function jobBlock(workflow: string, job: string): string {
  return (
    workflow.match(new RegExp(`^  ${job}:\\n(?:(?!^  [A-Za-z0-9_-]+:\\n)[\\s\\S])*`, 'm'))?.[0] ?? ''
  );
}

describe('central setup-project action', () => {
  it('removes the local setup action', () => {
    expect(existsSync(resolve(root, '.github/actions/setup-toolchain/action.yaml'))).toBe(false);
  });

  it('uses the immutable central action in every project setup job', () => {
    for (const [filename, jobs] of Object.entries(centralWorkflowJobs)) {
      const workflow = readFileSync(
        resolve(root, '.github/workflows', filename),
        'utf8'
      );

      expect(workflow).not.toContain('./.github/actions/setup-toolchain');
      expect(workflow).not.toContain('pnpm install --frozen-lockfile');
      expect(workflow).not.toContain('uses: pnpm/setup@');
      expect(workflow).not.toContain('uses: actions/setup-node@');

      for (const job of jobs) {
        const block = jobBlock(workflow, job);

        expect(block, `${filename} ${job} job`).toContain(`uses: ${centralSetupAction}`);
        expect(block).toContain('node-version: ${{ env.NODE_VERSION }}');
      }
    }
  });

  it('uses the release-only setup action for tag releases', () => {
    const workflow = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');
    const action = readFileSync(resolve(root, '.github/actions/setup-release/action.yaml'), 'utf8');

    expect(workflow).toMatch(/on:\n  push:\n    tags:\n      - "v\*"/);
    expect(workflow).not.toContain(centralSetupAction);
    expect(workflow).not.toContain('pnpm install --frozen-lockfile');

    for (const job of releaseWorkflowJobs) {
      const block = jobBlock(workflow, job);

      expect(block, `release ${job} job`).toContain(`uses: ${releaseSetupAction}`);
      expect(block).toContain('node-version: ${{ env.NODE_VERSION }}');
    }

    expect(action).toContain(
      'uses: pnpm/setup@84cb39b217b10273981911c288cd62326dc7c6d2 # v2.0.2'
    );
    expect(action).toContain('package-json-file: package.json');
    expect(action).toContain('runtime: "node@${{ inputs.node-version }}"');
    expect(action).toContain('cache: true');
    expect(action).toContain('install: false');
    expect(action).toContain('run: pnpm install --frozen-lockfile --no-runtime');
  });
});
