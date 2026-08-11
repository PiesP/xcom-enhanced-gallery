import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const action = readFileSync(
  resolve(root, '.github/actions/setup-toolchain/action.yaml'),
  'utf8'
);
const workflowFiles = ['ci.yaml', 'deep-checks.yaml', 'release.yaml'];

describe('setup-toolchain action', () => {
  it('uses pnpm/setup with repository pins and dependency caching', () => {
    expect(action).toContain(
      'uses: pnpm/setup@84cb39b217b10273981911c288cd62326dc7c6d2 # v2.0.2'
    );
    expect(action).toContain('package-json-file: package.json');
    expect(action).toContain('runtime: "node@${{ inputs.node-version }}"');
    expect(action).toContain('cache: true');
    expect(action).toContain('install: false');
    expect(action).not.toContain('self-update');
    expect(
      existsSync(resolve(root, '.github/actions/setup-toolchain/bootstrap-package.json'))
    ).toBe(false);
  });

  it('keeps normal Node and pnpm workflow setup behind the local action', () => {
    for (const filename of workflowFiles) {
      const workflow = readFileSync(
        resolve(root, '.github/workflows', filename),
        'utf8'
      );

      expect(workflow).toContain('uses: ./.github/actions/setup-toolchain');
      expect(workflow).not.toContain('uses: pnpm/action-setup@');
      expect(workflow).not.toContain('uses: actions/setup-node@');
    }
  });
});
