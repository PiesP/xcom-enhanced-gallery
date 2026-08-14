import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const classifier = resolve(root, 'scripts/ci/classify-changes.sh');
const ciWorkflow = readFileSync(resolve(root, '.github/workflows/ci.yaml'), 'utf8');
const securityWorkflow = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
const deepWorkflow = readFileSync(resolve(root, '.github/workflows/deep-checks.yaml'), 'utf8');
const codexWorkflow = readFileSync(resolve(root, '.github/workflows/codex-security.yaml'), 'utf8');
const dependabotWorkflow = readFileSync(
  resolve(root, '.github/workflows/dependabot-auto-merge.yaml'),
  'utf8'
);
const updateCoreWorkflow = readFileSync(
  resolve(root, '.github/workflows/update-browser-core.yaml'),
  'utf8'
);
const settings = readFileSync(resolve(root, '.github/settings.yaml'), 'utf8');

const ciOutputs = ['quality', 'unit', 'e2e', 'build', 'duplication'] as const;
const securityOutputs = ['osv', 'semgrep', 'codeql_actions', 'codeql_javascript'] as const;

function classify(
  files: string[],
  environment: Record<string, string> = {}
): Record<string, string> {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'xeg-change-policy-'));
  const outputPath = join(tempDirectory, 'outputs.txt');

  try {
    execFileSync('bash', [classifier, ...(files.length > 0 ? ['--files', ...files] : [])], {
      cwd: root,
      env: {
        ...process.env,
        GITHUB_OUTPUT: outputPath,
        ...environment,
      },
      stdio: 'pipe',
    });

    return Object.fromEntries(
      readFileSync(outputPath, 'utf8')
        .trim()
        .split('\n')
        .map((line) => {
          const separator = line.indexOf('=');
          return [line.slice(0, separator), line.slice(separator + 1)];
        })
    );
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

function expectAll(outputs: Record<string, string>, names: readonly string[]): void {
  for (const name of names) expect(outputs[name], name).toBe('true');
}

function jobBlock(workflow: string, job: string): string {
  return (
    workflow.match(new RegExp(`^  ${job}:\\n(?:(?!^  [A-Za-z0-9_-]+:\\n)[\\s\\S])*`, 'm'))?.[0] ?? ''
  );
}

describe('workflow change policy', () => {
  it('runs every gate for manual, unknown, and failed diff classification', () => {
    const manual = classify([], { GITHUB_EVENT_NAME: 'workflow_dispatch' });
    const unknown = classify([], { GITHUB_EVENT_NAME: 'issues' });
    const failedDiff = classify([], {
      GITHUB_EVENT_NAME: 'pull_request',
      BASE_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      HEAD_SHA: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    });

    for (const result of [manual, unknown, failedDiff]) {
      expectAll(result, [...ciOutputs, ...securityOutputs]);
    }
    expect(failedDiff.reason).toBe('diff-failed-full');

    const unknownPath = classify(['new-unclassified-input.xyz']);
    expectAll(unknownPath, [...ciOutputs, ...securityOutputs]);

    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    const emptyDiff = classify([], {
      GITHUB_EVENT_NAME: 'push',
      BASE_SHA: head,
      HEAD_SHA: head,
    });
    expectAll(emptyDiff, [...ciOutputs, ...securityOutputs]);
    expect(emptyDiff.reason).toBe('empty-diff-full');
  });

  it('keeps README and browser-core hidden contracts in scope', () => {
    const readme = classify(['README.md']);
    expect(readme.unit).toBe('true');
    expect(readme.semgrep).toBe('true');
    expect(readme.quality).toBe('false');
    expect(readme.e2e).toBe('false');

    const core = classify(['packages/core']);
    expectAll(core, ciOutputs);
    expectAll(core, ['osv', 'semgrep', 'codeql_javascript']);
  });

  it('scopes binary icons without weakening build and browser coverage', () => {
    const icon = classify(['assets/icons/icon-128x128.png']);

    expect(icon.e2e).toBe('true');
    expect(icon.build).toBe('true');
    expect(icon.quality).toBe('false');
    expect(icon.unit).toBe('false');
    expect(icon.duplication).toBe('false');
    expect(icon.semgrep).toBe('false');
  });

  it('keeps source and workflow changes on their meaningful gates', () => {
    const source = classify(['src/main.ts']);
    expectAll(source, ciOutputs);
    expectAll(source, ['semgrep', 'codeql_javascript']);
    expect(source.osv).toBe('false');
    expect(source.codeql_actions).toBe('false');

    const ci = classify(['.github/workflows/ci.yaml']);
    expectAll(ci, ciOutputs);
    expectAll(ci, ['unit', 'semgrep', 'codeql_actions']);

    const security = classify(['.github/workflows/security.yaml']);
    expect(security.unit).toBe('true');
    expectAll(security, securityOutputs);

    expect(classify(['.github/workflows/update-browser-core.yaml']).unit).toBe('true');
    expect(classify(['.github/settings.yaml']).unit).toBe('true');

    const sharedFixture = classify(['test/fixtures/quoted-video-tweet-response.ts']);
    expectAll(sharedFixture, ['unit', 'e2e', 'semgrep', 'codeql_javascript']);
  });

  it('preserves every required context while adding explicit no-op success paths', () => {
    const contexts = [
      'pr-gate/quality',
      'pr-gate/build',
      'pr-gate/unit',
      'pr-gate/e2e',
      'pr-gate/duplication',
      'pr-gate/osv / osv-scan',
      'pr-gate/semgrep',
    ];

    for (const context of contexts) {
      expect(settings).toContain(`- "${context}"`);
      expect(`${ciWorkflow}\n${securityWorkflow}`).toContain(`name: ${context}`);
    }

    expect(ciWorkflow).toContain('No quality-relevant changes');
    expect(ciWorkflow).toContain('No unit-relevant changes');
    expect(ciWorkflow).toContain('No browser-relevant changes');
    expect(ciWorkflow).toContain('No build-relevant changes');
    expect(ciWorkflow).toContain('No duplication-relevant changes');
    expect(securityWorkflow).toContain('No dependency-relevant changes');
    expect(securityWorkflow).toContain('No Semgrep-relevant changes');
  });

  it('fails open to heavy checks when routing fails or returns no explicit decision', () => {
    for (const output of ciOutputs) {
      expect(ciWorkflow).toContain(
        `needs.changes.result != 'success' || needs.changes.outputs.${output} != 'false'`
      );
      expect(ciWorkflow).toContain(`needs.changes.outputs.${output} == 'false'`);
    }
    for (const output of ['osv', 'semgrep'] as const) {
      expect(securityWorkflow).toContain(
        `needs.changes.result != 'success' || needs.changes.outputs.${output} != 'false'`
      );
      expect(securityWorkflow).toContain(`needs.changes.outputs.${output} == 'false'`);
    }

    expect(ciWorkflow).not.toContain('Require successful change classification');
    expect(securityWorkflow).not.toContain('Require successful change classification');
    for (const job of ['quality', 'unit', 'e2e', 'build', 'duplication']) {
      expect(jobBlock(ciWorkflow, job), job).toContain('needs:');
      expect(jobBlock(ciWorkflow, job), job).toContain('if: ${{ !cancelled() }}');
    }
    for (const job of ['osv-scan-pr', 'osv-scan-dispatch', 'semgrep']) {
      expect(jobBlock(securityWorkflow, job), job).toContain('needs: changes');
      expect(jobBlock(securityWorkflow, job), job).toContain('!cancelled()');
    }
    expect(securityWorkflow).toContain(
      'if [[ "${{ needs.changes.result }}" != "success" ]]; then\n            run=true'
    );
  });

  it('executes the change classifier from the trusted base revision for PR-like events', () => {
    for (const workflow of [ciWorkflow, securityWorkflow]) {
      const changes = jobBlock(workflow, 'changes');
      expect(changes).toContain('pull_request | merge_group');
      expect(changes).toContain('git show "$BASE_SHA:scripts/ci/classify-changes.sh"');
      expect(changes).toContain('bash "$classifier"');
    }
  });

  it('keeps required workflow triggers broad and scopes only non-required automation', () => {
    const ciTrigger = ciWorkflow.slice(0, ciWorkflow.indexOf('\nenv:'));
    const securityTrigger = securityWorkflow.slice(0, securityWorkflow.indexOf('\npermissions:'));

    for (const trigger of [ciTrigger, securityTrigger]) {
      expect(trigger).toContain('push:');
      expect(trigger).toContain('pull_request:');
      expect(trigger).toContain('merge_group:');
      expect(trigger).not.toContain('paths:');
      expect(trigger).not.toContain('paths-ignore:');
    }

    expect(deepWorkflow.slice(0, deepWorkflow.indexOf('\nenv:'))).toContain('paths:');
    expect(codexWorkflow.slice(0, codexWorkflow.indexOf('\npermissions:'))).toContain('paths:');
    expect(dependabotWorkflow.slice(0, dependabotWorkflow.indexOf('\npermissions:'))).toContain(
      'paths:'
    );
    expect(updateCoreWorkflow.slice(0, updateCoreWorkflow.indexOf('\npermissions:'))).toContain(
      'paths-ignore:'
    );
  });
});
