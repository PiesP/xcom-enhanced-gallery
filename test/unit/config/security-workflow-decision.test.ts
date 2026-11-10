import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const root = resolve(import.meta.dirname, '../../..');
const workflow = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
const settings = readFileSync(resolve(root, '.github/settings.yml'), 'utf8');
const image = `scanner@sha256:${'a'.repeat(64)}`;

function job(name: string): string {
  return (
    workflow.match(new RegExp(`^  ${name}:\\n(?:(?!^  [a-z][a-z-]*:\\n)[\\s\\S])*`, 'm'))?.[0] ?? ''
  );
}

function runScript(jobName: string): string {
  const body = job(jobName);
  const indented = body.match(/^        run: \|\n((?:^ {10}.*\n?)*)/m)?.[1];
  expect(indented, `${jobName}: executable decision`).toBeDefined();
  return (indented ?? '')
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
}

function evaluate(
  jobName: string,
  environment: Record<string, string>
): {
  status: number | null;
  stdout: string;
} {
  const result = spawnSync('bash', ['-e', '-o', 'pipefail'], {
    input: runScript(jobName),
    encoding: 'utf8',
    env: { ...process.env, ...environment },
  });
  expect(result.error).toBeUndefined();
  return { status: result.status, stdout: result.stdout };
}

const osv = {
  EVENT_NAME: 'pull_request',
  CHANGES_RESULT: 'success',
  PINS_RESULT: 'success',
  OSV_ROUTE: 'true',
  OSV_IMAGE: image,
  OSV_PR_RESULT: 'success',
  OSV_FULL_RESULT: 'skipped',
};
const summary = {
  CHANGES_RESULT: 'success',
  PINS_RESULT: 'success',
  OSV_RESULT: 'success',
  CODEQL_RESULT: 'success',
  SEMGREP_RESULT: 'success',
  OSV_IMAGE: image,
  SEMGREP_IMAGE: image,
  OSV_ROUTE: 'true',
  SEMGREP_ROUTE: 'true',
  ACTIONS_ROUTE: 'true',
  JAVASCRIPT_ROUTE: 'true',
};

describe('security workflow decisions', () => {
  it('keeps one producer of the existing required OSV context and declares the new summary', () => {
    expect(workflow.match(/^    name: pr-gate\/osv \/ osv-scan$/gm)).toHaveLength(1);
    expect(workflow.match(/^    name: Security scan summary$/gm)).toHaveLength(1);
    expect(job('osv-decision')).toContain(
      'needs: [changes, pin-metadata, osv-scan-pr, osv-scan-dispatch]'
    );
    expect(job('security-summary')).toContain(
      'needs: [changes, pin-metadata, osv-decision, codeql, semgrep]'
    );
    for (const name of ['osv-decision', 'security-summary']) {
      expect(job(name)).toContain('if: ${{ always() }}');
      expect(job(name)).toContain('permissions: {}');
      expect(job(name)).toContain('if: ${{ cancelled() }}\n        run: exit 1');
    }
    for (const context of ['pr-gate/osv / osv-scan', 'Security scan summary']) {
      expect(settings).toContain(`- context: "${context}"\n            app_id: 15368`);
    }
  });

  it('selects the PR diff scan and full scan for their actual events', () => {
    expect(evaluate('osv-decision', osv).status).toBe(0);
    for (const EVENT_NAME of ['push', 'workflow_dispatch', 'merge_group', 'schedule']) {
      expect(
        evaluate('osv-decision', {
          ...osv,
          EVENT_NAME,
          OSV_PR_RESULT: 'skipped',
          OSV_FULL_RESULT: 'success',
        }).status
      ).toBe(0);
    }
    expect(evaluate('osv-decision', { ...osv, OSV_ROUTE: 'false' }).stdout).toContain(
      'explicit no-op'
    );
    expect(evaluate('security-summary', summary).status).toBe(0);
    expect(
      evaluate('security-summary', {
        ...summary,
        OSV_ROUTE: 'false',
        SEMGREP_ROUTE: 'false',
        ACTIONS_ROUTE: 'false',
        JAVASCRIPT_ROUTE: 'false',
      }).status
    ).toBe(0);
  });

  it('rejects failed prerequisites, cancelled work, missing routing, and the wrong OSV lane', () => {
    const failures = [
      { CHANGES_RESULT: 'failure' },
      { PINS_RESULT: 'failure' },
      { OSV_ROUTE: '' },
      { OSV_ROUTE: 'maybe' },
      { OSV_IMAGE: '' },
      { OSV_IMAGE: 'mutable-tag' },
      { OSV_PR_RESULT: 'failure' },
      { OSV_PR_RESULT: 'cancelled' },
      { OSV_PR_RESULT: 'skipped' },
      { OSV_FULL_RESULT: 'success' },
      { EVENT_NAME: 'repository_dispatch' },
    ];
    for (const change of failures) {
      expect(
        evaluate('osv-decision', { ...osv, ...change }).status,
        JSON.stringify(change)
      ).not.toBe(0);
    }
    expect(
      evaluate('osv-decision', {
        ...osv,
        EVENT_NAME: 'merge_group',
        OSV_PR_RESULT: 'success',
        OSV_FULL_RESULT: 'skipped',
      }).status
    ).not.toBe(0);
  });

  it('rejects failed, cancelled, missing or skipped CodeQL, Semgrep and OSV results', () => {
    for (const resultName of ['OSV_RESULT', 'CODEQL_RESULT', 'SEMGREP_RESULT'] as const) {
      for (const result of ['failure', 'cancelled', 'skipped', '']) {
        expect(
          evaluate('security-summary', { ...summary, [resultName]: result }).status,
          `${resultName}: ${result}`
        ).not.toBe(0);
      }
    }
    for (const change of [
      { CHANGES_RESULT: 'failure' },
      { PINS_RESULT: 'skipped' },
      { OSV_IMAGE: '' },
      { SEMGREP_IMAGE: 'mutable-tag' },
      { OSV_ROUTE: '' },
      { SEMGREP_ROUTE: 'unknown' },
      { ACTIONS_ROUTE: '' },
      { JAVASCRIPT_ROUTE: 'unknown' },
    ]) {
      expect(
        evaluate('security-summary', { ...summary, ...change }).status,
        JSON.stringify(change)
      ).not.toBe(0);
    }
  });
});
