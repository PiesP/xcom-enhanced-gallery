import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const centralSetupAction =
  'PiesP/browser-core/automation/actions/setup-project@f630a8f0119dd6b4f1aa011f8510489936c7a7b9';
const workflowJobs = {
  'ci.yaml': ['quality', 'unit', 'e2e', 'build'],
  'deep-checks.yaml': ['mutation'],
  'release.yaml': ['quality', 'unit', 'e2e', 'mutation', 'build'],
} as const;

describe('central setup-project action', () => {
  it('removes the local setup action', () => {
    expect(existsSync(resolve(root, '.github/actions/setup-toolchain/action.yaml'))).toBe(false);
  });

  it('uses the immutable central action in every project setup job', () => {
    for (const [filename, jobs] of Object.entries(workflowJobs)) {
      const workflow = readFileSync(
        resolve(root, '.github/workflows', filename),
        'utf8'
      );

      expect(workflow).not.toContain('./.github/actions/setup-toolchain');
      expect(workflow).not.toContain('pnpm install --frozen-lockfile');
      expect(workflow).not.toContain('uses: pnpm/setup@');
      expect(workflow).not.toContain('uses: actions/setup-node@');

      for (const job of jobs) {
        const jobBlock =
          workflow.match(
            new RegExp(`^  ${job}:\\n(?:(?!^  [A-Za-z0-9_-]+:\\n)[\\s\\S])*`, 'm')
          )?.[0] ?? '';

        expect(jobBlock, `${filename} ${job} job`).toContain(`uses: ${centralSetupAction}`);
        expect(jobBlock).toContain('node-version: ${{ env.NODE_VERSION }}');
      }
    }
  });
});
