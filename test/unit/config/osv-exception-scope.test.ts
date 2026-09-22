import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const helper = resolve(root, 'scripts/security/scope-osv-exceptions.py');
const cliPackagePath = resolve(root, 'scripts/security/codex-security/package.json');
const cliLockPath = resolve(root, 'scripts/security/codex-security/package-lock.json');
const targetLock = '/src/scripts/security/codex-security/package-lock.json';
const ignoredIds = ['GHSA-jmr9-qjv8-65gv', 'GHSA-7pqw-9j4j-h8q3'] as const;
const temporaryDirectories: string[] = [];
const cliManifest = JSON.parse(readFileSync(cliPackagePath, 'utf8')) as {
  dependencies?: Record<string, string>;
};
const cliLock = JSON.parse(readFileSync(cliLockPath, 'utf8')) as {
  packages?: Record<string, { integrity?: string }>;
};
const cliVersion = cliManifest.dependencies?.['@openai/codex-security'];
const cliIntegrity = cliLock.packages?.['node_modules/@openai/codex-security']?.integrity;
if (!cliVersion || !cliIntegrity) throw new Error('Codex Security lock metadata is incomplete');
const cliLockfileSha256 = createHash('sha256')
  .update(readFileSync(cliLockPath))
  .digest('hex');

type RunResult = {
  output: unknown;
  outputExists: boolean;
  status: number | null;
  stderr: string;
};

type RunOptions = {
  cliLockIsOutput?: boolean;
  cliLockContent?: string;
  inputIsOutput?: boolean;
  staleOutput?: boolean;
};

function utcDateWithOffset(days: number): string {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function reviewPolicy(version = cliVersion, lockfileSha256 = cliLockfileSha256): string {
  return `
[CodexSecurityReview]
package = "@openai/codex-security"
version = "${version}"
integrity = "${cliIntegrity}"
lockfileSha256 = "${lockfileSha256}"
reviewedOn = ${new Date().toISOString().slice(0, 10)}
`;
}

function appendReview(policyBody: string, review = reviewPolicy()): string {
  return `${policyBody.trim()}\n\n${review}`;
}

function policyWithDates(firstDate: string, secondDate = firstDate): string {
  return appendReview(`
[[IgnoredVulns]]
id = "${ignoredIds[0]}"
ignoreUntil = ${firstDate}
reason = "Scoped test exception"

[[IgnoredVulns]]
id = "${ignoredIds[1]}"
ignoreUntil = ${secondDate}
reason = "Scoped test exception"
`);
}

function vulnerability(id: string): Record<string, unknown> {
  return { id, summary: `${id} summary`, unknown_vulnerability_metadata: { retained: true } };
}

function packageResult(
  name: string,
  version: string,
  vulnerabilities: Record<string, unknown>[],
  groups: Record<string, unknown>[] = []
): Record<string, unknown> {
  return {
    package: { ecosystem: 'npm', name, version, unknown_identity_metadata: true },
    vulnerabilities,
    groups,
    unknown_package_metadata: ['retained'],
  };
}

function result(
  path: string,
  packages: Record<string, unknown>[],
  type = 'lockfile'
): Record<string, unknown> {
  return {
    source: { path, type, unknown_source_metadata: 7 },
    packages,
    unknown_result_metadata: { retained: true },
  };
}

function report(results: Record<string, unknown>[]): Record<string, unknown> {
  return {
    results,
    experimental_config: { licenses: { summary: false } },
    unknown_top_level_metadata: { retained: true },
  };
}

function runHelper(input: unknown, policy: string, options: RunOptions = {}): RunResult {
  const directory = mkdtempSync(join(tmpdir(), 'xeg-osv-scope-'));
  temporaryDirectories.push(directory);
  const policyPath = join(directory, 'policy.toml');
  const cliLockPathForRun = join(directory, 'cli-package-lock.json');
  const inputPath = join(directory, 'input.json');
  const outputPath = options.inputIsOutput
    ? inputPath
    : options.cliLockIsOutput
      ? cliLockPathForRun
      : join(directory, 'output.json');

  writeFileSync(policyPath, policy);
  writeFileSync(cliLockPathForRun, options.cliLockContent ?? readFileSync(cliLockPath, 'utf8'));
  writeFileSync(inputPath, typeof input === 'string' ? input : JSON.stringify(input));
  if (options.staleOutput) {
    writeFileSync(outputPath, JSON.stringify({ results: [], stale: true }));
  }

  const process = spawnSync(
    'python3',
    [
      helper,
      '--policy',
      policyPath,
      '--cli-package',
      cliPackagePath,
      '--cli-lock',
      cliLockPathForRun,
      '--input',
      inputPath,
      '--output',
      outputPath,
    ],
    { encoding: 'utf8' }
  );
  const outputExists = existsSync(outputPath);

  return {
    status: process.status,
    stderr: process.stderr,
    outputExists,
    output: outputExists ? JSON.parse(readFileSync(outputPath, 'utf8')) : undefined,
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('scoped OSV exceptions', () => {
  it('filters only the two active CLI-lock advisories and preserves unrelated data', () => {
    const newId = 'GHSA-new1-new2-new3';
    const input = report([
      result(targetLock, [
        packageResult(
          'extract-zip',
          '2.0.1',
          [vulnerability(ignoredIds[0]), vulnerability(ignoredIds[1]), vulnerability(newId)],
          [
            {
              ids: [ignoredIds[0]],
              aliases: ['CVE-2026-56876', ignoredIds[0]],
              max_severity: '8.6',
            },
            {
              ids: [ignoredIds[1], newId],
              aliases: [ignoredIds[1], 'CVE-2026-19693', newId, 'CVE-2099-0001'],
              unknown_group_metadata: { retained: true },
            },
            {
              ids: [newId],
              aliases: ['CVE-2099-0001', newId],
              max_severity: '9.9',
            },
          ]
        ),
      ]),
    ]);

    const execution = runHelper(input, policyWithDates(utcDateWithOffset(30)));

    expect(execution.status, execution.stderr).toBe(0);
    expect(execution.output).toEqual({
      results: [
        result(targetLock, [
          packageResult(
            'extract-zip',
            '2.0.1',
            [vulnerability(newId)],
            [
              {
                ids: [ignoredIds[1], newId],
                aliases: [ignoredIds[1], 'CVE-2026-19693', newId, 'CVE-2099-0001'],
                unknown_group_metadata: { retained: true },
              },
              {
                ids: [newId],
                aliases: ['CVE-2099-0001', newId],
                max_severity: '9.9',
              },
            ]
          ),
        ]),
      ],
      experimental_config: { licenses: { summary: false } },
      unknown_top_level_metadata: { retained: true },
    });
  });

  it.each([{}, { aliases: [] }, { aliases: null }])('accepts groups with optional aliases: %j', (metadata) => {
    const newId = 'GHSA-new1-new2-new3';
    const retained = packageResult('other-package', '1.0.0', [vulnerability(newId)], [
      { ids: [newId], ...metadata },
    ]);
    const input = report([
      result(targetLock, [
        packageResult('extract-zip', '2.0.1', [vulnerability(ignoredIds[0])], [
          { ids: [ignoredIds[0]], ...metadata },
        ]),
        retained,
      ]),
    ]);

    const execution = runHelper(input, policyWithDates(utcDateWithOffset(30)));

    expect(execution.status, execution.stderr).toBe(0);
    expect(execution.output).toEqual(
      report([result(targetLock, [packageResult('extract-zip', '2.0.1', []), retained])])
    );
  });

  it('retains the same advisories outside the exact source and package identity', () => {
    const inputs = [
      result('/src/pnpm-lock.yaml', [
        packageResult('extract-zip', '2.0.1', [vulnerability(ignoredIds[0])]),
      ]),
      result(targetLock, [
        packageResult('extract-zip', '2.0.2', [vulnerability(ignoredIds[0])]),
        packageResult('other-package', '2.0.1', [vulnerability(ignoredIds[1])]),
        {
          ...packageResult('extract-zip', '2.0.1', [vulnerability(ignoredIds[1])]),
          package: { ecosystem: 'Go', name: 'extract-zip', version: '2.0.1' },
        },
      ]),
      result(
        targetLock,
        [packageResult('extract-zip', '2.0.1', [vulnerability(ignoredIds[1])])],
        'manifest'
      ),
      result(
        '/src/go.mod',
        [
          {
            package: { commit: 'abc123', unknown_identity_metadata: true },
            vulnerabilities: [vulnerability(ignoredIds[0])],
            groups: [],
            unknown_package_metadata: ['retained'],
          },
        ],
        'git'
      ),
    ];
    const input = report(inputs);

    const execution = runHelper(input, policyWithDates(utcDateWithOffset(30)));

    expect(execution.status, execution.stderr).toBe(0);
    expect(execution.output).toEqual(input);
  });

  it('retains advisories whose exception dates are not strictly in the future', () => {
    const input = report([
      result(targetLock, [
        packageResult('extract-zip', '2.0.1', [
          vulnerability(ignoredIds[0]),
          vulnerability(ignoredIds[1]),
        ]),
      ]),
    ]);

    const execution = runHelper(input, policyWithDates(utcDateWithOffset(0)));

    expect(execution.status, execution.stderr).toBe(0);
    expect(execution.output).toEqual(input);
  });

  it('applies each exception according to its own expiry date', () => {
    const input = report([
      result(targetLock, [
        packageResult('extract-zip', '2.0.1', [
          vulnerability(ignoredIds[0]),
          vulnerability(ignoredIds[1]),
        ]),
      ]),
    ]);

    const execution = runHelper(
      input,
      policyWithDates(utcDateWithOffset(-1), utcDateWithOffset(30))
    );

    expect(execution.status, execution.stderr).toBe(0);
    expect(execution.output).toEqual(
      report([
        result(targetLock, [packageResult('extract-zip', '2.0.1', [vulnerability(ignoredIds[0])])]),
      ])
    );
  });

  it('accepts zero or one supported exception without broadening the scope', () => {
    const noExceptions = runHelper(report([]), appendReview('IgnoredVulns = []'));
    expect(noExceptions.status, noExceptions.stderr).toBe(0);
    expect(noExceptions.output).toEqual(report([]));

    const oneException = runHelper(
      report([]),
      appendReview(`
[[IgnoredVulns]]
id = "${ignoredIds[0]}"
ignoreUntil = ${utcDateWithOffset(30)}
reason = "Scoped test exception"
`)
    );
    expect(oneException.status, oneException.stderr).toBe(0);
    expect(oneException.output).toEqual(report([]));
  });

  it('requires a reviewed CLI version and exact lockfile bytes before filtering', () => {
    const alternateVersion = cliVersion === '0.1.29' ? '0.1.28' : '0.1.29';
    const versionMismatch = runHelper(
      report([]),
      appendReview('IgnoredVulns = []', reviewPolicy(alternateVersion))
    );
    expect(versionMismatch.status).not.toBe(0);
    expect(versionMismatch.stderr).toContain('SECURITY_REVIEW_REQUIRED');

    const changedLock = readFileSync(cliLockPath, 'utf8').replace(
      '"lockfileVersion": 3',
      '"lockfileVersion": 3 '
    );
    const lockMismatch = runHelper(report([]), appendReview('IgnoredVulns = []'), {
      cliLockContent: changedLock,
    });
    expect(lockMismatch.status).not.toBe(0);
    expect(lockMismatch.stderr).toContain('SECURITY_REVIEW_REQUIRED');
  });

  it.each([
    ['malformed JSON', '{'],
    ['invalid OSV result schema', { results: {} }],
  ])('fails closed for %s', (_label, invalidInput) => {
    const execution = runHelper(invalidInput, policyWithDates(utcDateWithOffset(30)), {
      staleOutput: true,
    });

    expect(execution.status).not.toBe(0);
    expect(execution.outputExists).toBe(false);
    expect(execution.stderr).not.toBe('');
  });

  it('rejects an output path that aliases the input without deleting the input', () => {
    const input = report([]);

    const execution = runHelper(input, policyWithDates(utcDateWithOffset(30)), {
      inputIsOutput: true,
    });

    expect(execution.status).not.toBe(0);
    expect(execution.output).toEqual(input);
    expect(execution.stderr).toContain('output must differ from policy, CLI review inputs, and input');
  });

  it('rejects an output path that aliases the CLI lock without deleting the lock', () => {
    const execution = runHelper(report([]), policyWithDates(utcDateWithOffset(30)), {
      cliLockIsOutput: true,
    });

    expect(execution.status).not.toBe(0);
    expect(execution.outputExists).toBe(true);
    expect(execution.stderr).toContain('output must differ from policy, CLI review inputs, and input');
  });

  it.each([
    ['empty policy', ''],
    [
      'missing expiry',
      appendReview(`
[[IgnoredVulns]]
id = "${ignoredIds[0]}"
reason = "No expiry"

[[IgnoredVulns]]
id = "${ignoredIds[1]}"
ignoreUntil = ${utcDateWithOffset(30)}
      `),
    ],
    [
      'unsupported wildcard',
      appendReview(`
[[IgnoredVulns]]
id = "*"
ignoreUntil = ${utcDateWithOffset(30)}
      `),
    ],
    [
      'unsupported permanent exception',
      appendReview(`
[[IgnoredVulns]]
id = "${ignoredIds[0]}"
ignoreUntil = ${utcDateWithOffset(30)}
ignore = true

[[IgnoredVulns]]
id = "${ignoredIds[1]}"
ignoreUntil = ${utcDateWithOffset(30)}
      `),
    ],
  ])('fails closed for %s', (_label, invalidPolicy) => {
    const execution = runHelper(report([]), invalidPolicy);

    expect(execution.status).not.toBe(0);
    expect(execution.outputExists).toBe(false);
    expect(execution.stderr).not.toBe('');
  });
});
