import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const workflow = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
const helper = resolve(root, 'scripts/security/scope-osv-exceptions.py');
const policy = resolve(root, '.github/codex-security/osv-scanner.toml');
const cliPackage = JSON.parse(
  readFileSync(resolve(root, 'scripts/security/codex-security/package.json'), 'utf8')
) as { dependencies: Record<string, string> };
const cliLock = JSON.parse(
  readFileSync(resolve(root, 'scripts/security/codex-security/package-lock.json'), 'utf8')
) as { packages: Record<string, { integrity?: string }> };
const cliVersion = cliPackage.dependencies['@openai/codex-security'];
const cliIntegrity = cliLock.packages['node_modules/@openai/codex-security']?.integrity;
if (!cliVersion || !cliIntegrity) throw new Error('Codex Security lock metadata is incomplete');
const cliLockfileSha256 = createHash('sha256')
  .update(readFileSync(resolve(root, 'scripts/security/codex-security/package-lock.json')))
  .digest('hex');
const image = workflow.match(/OSV_SCANNER_IMAGE: "([^"]+)"/)?.[1];
const actualContainerRuntime = process.env.OSV_TEST_CONTAINER_RUNTIME;
const temporaryDirectories: string[] = [];

type WorkflowStep = {
  block: string;
  continueOnError: boolean;
  run: string;
};

type Sandbox = {
  bin: string;
  githubOutput: string;
  results: string;
  runnerTemp: string;
};

type Execution = {
  status: number | null;
  stderr: string;
  stdout: string;
};

function extractStep(name: string): WorkflowStep {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  if (start < 0) throw new Error(`Workflow step not found: ${name}`);

  const stepIndent = lines[start]?.match(/^\s*/)?.[0].length ?? 0;
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end] ?? '';
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (line.trim() && indent === stepIndent && line.trim().startsWith('- name: ')) break;
    if (line.trim() && indent < stepIndent) break;
    end += 1;
  }

  const blockLines = lines.slice(start, end);
  const runIndex = blockLines.findIndex((line) => line.trim() === 'run: |');
  if (runIndex < 0) throw new Error(`Workflow step has no multiline run body: ${name}`);
  const runIndent = (blockLines[runIndex]?.match(/^\s*/)?.[0].length ?? 0) + 2;
  const runLines = blockLines.slice(runIndex + 1).map((line) => line.slice(runIndent));

  return {
    block: blockLines.join('\n'),
    continueOnError: blockLines.some((line) => line.trim() === 'continue-on-error: true'),
    run: runLines.join('\n'),
  };
}

function extractFirstStep(names: string[]): WorkflowStep {
  for (const name of names) {
    if (workflow.includes(`- name: ${name}`)) return extractStep(name);
  }
  throw new Error(`None of the workflow steps exist: ${names.join(', ')}`);
}

function emptyReport(): Record<string, unknown> {
  return { results: [] };
}

function vulnerability(
  id: string,
  metadata: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id,
    summary: `${id} synthetic workflow-test vulnerability`,
    aliases: [],
    severity: [],
    ...metadata,
  };
}

function reportWith(
  ids: string[],
  target = false,
  vulnerabilityMetadata: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    results: [
      {
        source: {
          path: target
            ? '/src/scripts/security/codex-security/package-lock.json'
            : '/src/pnpm-lock.yaml',
          type: 'lockfile',
        },
        packages: [
          {
            package: {
              ecosystem: 'npm',
              name: target ? 'extract-zip' : 'example-package',
              version: target ? '2.0.1' : '1.0.0',
            },
            vulnerabilities: ids.map((id) => vulnerability(id, vulnerabilityMetadata)),
            groups: ids.map((id) => ({ ids: [id], aliases: [id] })),
          },
        ],
      },
    ],
  };
}

function activePolicy(): string {
  return `
[[IgnoredVulns]]
id = "GHSA-jmr9-qjv8-65gv"
ignoreUntil = 2099-01-01
reason = "Workflow test"

[[IgnoredVulns]]
id = "GHSA-7pqw-9j4j-h8q3"
ignoreUntil = 2099-01-01
reason = "Workflow test"

[CodexSecurityReview]
package = "@openai/codex-security"
version = "${cliVersion}"
integrity = "${cliIntegrity}"
lockfileSha256 = "${cliLockfileSha256}"
reviewedOn = ${new Date().toISOString().slice(0, 10)}
`;
}

function createSandbox(): Sandbox {
  const runnerTemp = mkdtempSync(join(tmpdir(), 'osv-workflow-'));
  temporaryDirectories.push(runnerTemp);
  const results = join(runnerTemp, 'osv-results');
  const bin = join(runnerTemp, 'bin');
  mkdirSync(results);
  mkdirSync(bin);
  copyFileSync(helper, join(results, 'scope-osv-exceptions.py'));
  writeFileSync(join(results, 'osv-scanner.toml'), activePolicy());
  writeFileSync(join(results, 'osv-empty.toml'), '');
  const githubOutput = join(runnerTemp, 'github-output');
  writeFileSync(githubOutput, '');
  return { bin, githubOutput, results, runnerTemp };
}

function installFakeDocker(bin: string): void {
  const path = join(bin, 'docker');
  writeFileSync(
    path,
    `#!/usr/bin/env bash
set -euo pipefail
if [[ " $* " == *" --entrypoint /root/osv-reporter "* ]]; then
  if [[ " $* " == *" --output-files=json:/dev/null "* ]]; then
    case "\${FAKE_RAW_REPORTER_MODE:-valid}" in
      valid) exit 0 ;;
      diagnostic)
        printf '%s\n' 'failed to open new results at injected.json: failed to parse'
        exit 0
        ;;
      error) exit 2 ;;
      *) exit 99 ;;
    esac
  fi
  output_name=''
  for argument in "$@"; do
    case "$argument" in
      --output-files=sarif:*) output_name="\${argument#--output-files=sarif:}" ;;
    esac
  done
  case "\${FAKE_REPORTER_MODE:-empty}" in
    empty) results='[]'; status=0 ;;
    vulnerability) results='[{}]'; status=1 ;;
    diagnostic)
      printf '%s\n' 'failed to open new results at injected.json: failed to parse'
      results='[]'
      status=0
      ;;
    error) exit 2 ;;
    *) exit 99 ;;
  esac
  printf '{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"osv-scanner"}},"results":%s}]}' "$results" > "$RUNNER_TEMP/osv-results/$output_name"
  exit "$status"
fi
output_name=''
for argument in "$@"; do
  case "$argument" in
    --output-file=/results/*) output_name="\${argument#--output-file=/results/}" ;;
  esac
done
if [[ -n "\${FAKE_SCANNER_RAW:-}" && -n "$output_name" ]]; then
  cp "$FAKE_SCANNER_RAW" "$RUNNER_TEMP/osv-results/$output_name"
fi
exit "\${FAKE_SCANNER_STATUS:-0}"
`
  );
  chmodSync(path, 0o755);
}

function installRuntimeDocker(bin: string, runtime: string): void {
  const path = join(bin, 'docker');
  writeFileSync(path, `#!/usr/bin/env bash\nexec ${JSON.stringify(runtime)} "$@"\n`);
  chmodSync(path, 0o755);
}

function installScannerStubRuntimeReporter(bin: string, runtime: string): void {
  const path = join(bin, 'docker');
  writeFileSync(
    path,
    `#!/usr/bin/env bash
set -euo pipefail
if [[ " $* " == *" --entrypoint /root/osv-reporter "* ]]; then
  exec ${JSON.stringify(runtime)} "$@"
fi
output_name=''
for argument in "$@"; do
  case "$argument" in
    --output-file=/results/*) output_name="\${argument#--output-file=/results/}" ;;
  esac
done
if [[ -n "\${FAKE_SCANNER_RAW:-}" && -n "$output_name" ]]; then
  cp "$FAKE_SCANNER_RAW" "$RUNNER_TEMP/osv-results/$output_name"
fi
exit "\${FAKE_SCANNER_STATUS:-0}"
`
  );
  chmodSync(path, 0o755);
}

function runStep(
  step: WorkflowStep,
  sandbox: Sandbox,
  extraEnv: NodeJS.ProcessEnv = {},
  cwd = root
): Execution {
  const execution = spawnSync(
    'bash',
    ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', step.run],
    {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        ...extraEnv,
        GITHUB_OUTPUT: sandbox.githubOutput,
        GITHUB_WORKSPACE: root,
        OSV_SCANNER_IMAGE: image,
        PATH: `${sandbox.bin}:${process.env.PATH ?? ''}`,
        RUNNER_TEMP: sandbox.runnerTemp,
      },
    }
  );
  return { status: execution.status, stderr: execution.stderr, stdout: execution.stdout };
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value));
}

function uploadAllowed(sandbox: Sandbox): boolean {
  return readFileSync(sandbox.githubOutput, 'utf8').split('\n').includes('sarif-upload=true');
}

function sarifResultCount(path: string): number {
  const document = JSON.parse(readFileSync(path, 'utf8')) as {
    runs: Array<{ results: unknown[] }>;
  };
  return document.runs.reduce((total, run) => total + run.results.length, 0);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('executable OSV workflow boundary', () => {
  const dispatchScan = extractStep('🛡️ Run OSV scan');
  const scanSteps = [
    extractStep('🛡️ Scan dependencies before the PR'),
    extractStep('🛡️ Scan dependencies after the PR'),
    dispatchScan,
  ];
  const dispatchReport = extractStep(
    '📋 Convert OSV results to SARIF and enforce the vulnerability gate'
  );
  const materializePolicy = extractFirstStep([
    '📁 Prepare trusted OSV policy and result directory',
    '📁 Materialize trusted OSV policy',
  ]);
  const materializePrPolicy = extractFirstStep([
    '📁 Prepare base-pinned OSV policy and result directory',
    '📁 Materialize base OSV policy',
    '📁 Materialize trusted OSV policy from PR base',
  ]);

  it('does not tolerate scanner or filter step failures at the job boundary', () => {
    expect(scanSteps.every((step) => !step.continueOnError)).toBe(true);
    expect(workflow).toContain("steps.osv-report.outputs.sarif-upload == 'true'");
  });

  it('expires the fixed policy at the exact UTC date boundary without changing the policy', () => {
    const execution = spawnSync('python3', ['-', helper, policy], {
      encoding: 'utf8',
      input: `
from datetime import date
from pathlib import Path
import runpy
import sys

validator = runpy.run_path(sys.argv[1], run_name="scope_osv_validator")
policy = Path(sys.argv[2])
for instant in ("2026-09-27", "2026-09-28"):
    active = validator["load_policy"](policy, date.fromisoformat(instant))
    print(instant + ":" + ",".join(sorted(active)))
`,
    });

    expect(execution.status, execution.stderr).toBe(0);
    expect(execution.stdout.trim().split('\n')).toEqual([
      '2026-09-27:GHSA-7pqw-9j4j-h8q3,GHSA-jmr9-qjv8-65gv',
      '2026-09-28:',
    ]);
  });

  it.each(['push', 'schedule', 'workflow_dispatch'])(
    'executes the current-source policy path for the %s event',
    (eventName) => {
      const sandbox = createSandbox();
      const execution = runStep(materializePolicy, sandbox, {
        EVENT_NAME: eventName,
        GITHUB_EVENT_NAME: eventName,
      });

      expect(execution.status, execution.stderr).toBe(0);
      expect(readFileSync(join(sandbox.results, 'osv-scanner.toml'), 'utf8')).toBe(
        readFileSync(policy, 'utf8')
      );
      expect(readFileSync(join(sandbox.results, 'scope-osv-exceptions.py'), 'utf8')).toBe(
        readFileSync(helper, 'utf8')
      );
    }
  );

  it('executes the PR-base policy materialization body', () => {
    const sandbox = createSandbox();
    const execution = runStep(materializePrPolicy, sandbox);

    expect(execution.status, execution.stderr).toBe(0);
    expect(readFileSync(join(sandbox.results, 'osv-scanner.toml'), 'utf8')).toBe(
      readFileSync(policy, 'utf8')
    );
    expect(readFileSync(join(sandbox.results, 'scope-osv-exceptions.py'), 'utf8')).toBe(
      readFileSync(helper, 'utf8')
    );
  });

  it('executes the merge-group path against the trusted base commit', () => {
    const sandbox = createSandbox();
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
    const execution = runStep(materializePolicy, sandbox, {
      BASE_SHA: head,
      EVENT_NAME: 'merge_group',
      EXPECTED_HEAD_SHA: head,
      GITHUB_EVENT_NAME: 'merge_group',
      POLICY_SHA: head,
      TRUSTED_BASE_SHA: head,
    });

    expect(execution.status, execution.stderr).toBe(0);
    const trustedFiles: Array<[string, string]> = [
      ['.github/codex-security/osv-scanner.toml', 'osv-scanner.toml'],
      ['scripts/security/scope-osv-exceptions.py', 'scope-osv-exceptions.py'],
    ];
    for (const [repositoryPath, resultName] of trustedFiles) {
      const expected = spawnSync('git', ['show', `${head}:${repositoryPath}`], {
        cwd: root,
        encoding: 'utf8',
      });
      expect(expected.status, expected.stderr).toBe(0);
      expect(readFileSync(join(sandbox.results, resultName), 'utf8')).toBe(expected.stdout);
    }
  });

  it('keeps the repository-specific unsupported-event boundary', () => {
    const sandbox = createSandbox();
    const execution = runStep(materializePolicy, sandbox, {
      EVENT_NAME: 'pull_request',
      GITHUB_EVENT_NAME: 'pull_request',
    });

    if (materializePolicy.run.includes('Unsupported')) {
      expect(execution.status).not.toBe(0);
    } else {
      expect(execution.status, execution.stderr).toBe(0);
      expect(workflow).toContain(
        "github.event_name == 'push' || github.event_name == 'workflow_dispatch' || github.event_name == 'merge_group' || github.event_name == 'schedule'"
      );
    }
  });

  it('purges stale outputs and stops on an injected scanner processing error', () => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);
    writeJson(join(sandbox.results, 'osv-results.raw.json'), emptyReport());
    writeJson(join(sandbox.results, 'osv-results.json'), emptyReport());

    const execution = runStep(dispatchScan, sandbox, { FAKE_SCANNER_STATUS: '2' });

    expect(execution.status).toBe(2);
    expect(existsSync(join(sandbox.results, 'osv-results.raw.json'))).toBe(false);
    expect(existsSync(join(sandbox.results, 'osv-results.json'))).toBe(false);
    expect(uploadAllowed(sandbox)).toBe(false);
  });

  it('does not filter a partial raw result from an injected failed scanner', () => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);
    const raw = join(sandbox.runnerTemp, 'partial.json');
    writeFileSync(raw, '{');

    const execution = runStep(dispatchScan, sandbox, {
      FAKE_SCANNER_RAW: raw,
      FAKE_SCANNER_STATUS: '2',
    });

    expect(execution.status).toBe(2);
    expect(readFileSync(join(sandbox.results, 'osv-results.raw.json'), 'utf8')).toBe('{');
    expect(existsSync(join(sandbox.results, 'osv-results.json'))).toBe(false);
  });

  it('fails in the trusted filter when a successful scanner produces no raw file', () => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);

    const execution = runStep(dispatchScan, sandbox, { FAKE_SCANNER_STATUS: '0' });

    expect(execution.status).toBe(2);
    expect(existsSync(join(sandbox.results, 'osv-results.raw.json'))).toBe(false);
    expect(existsSync(join(sandbox.results, 'osv-results.json'))).toBe(false);
    expect(uploadAllowed(sandbox)).toBe(false);
  });

  it('fails in the trusted filter and removes stale filtered output for malformed raw JSON', () => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);
    const raw = join(sandbox.runnerTemp, 'malformed.json');
    writeFileSync(raw, '{');
    writeJson(join(sandbox.results, 'osv-results.json'), emptyReport());

    const execution = runStep(dispatchScan, sandbox, {
      FAKE_SCANNER_RAW: raw,
      FAKE_SCANNER_STATUS: '0',
    });

    expect(execution.status).toBe(2);
    expect(existsSync(join(sandbox.results, 'osv-results.json'))).toBe(false);
  });

  it('preserves a normal scanner success as a valid empty filtered result', () => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);
    const raw = join(sandbox.runnerTemp, 'empty.json');
    writeJson(raw, emptyReport());

    const execution = runStep(dispatchScan, sandbox, {
      FAKE_SCANNER_RAW: raw,
      FAKE_SCANNER_STATUS: '0',
    });

    expect(execution.status).toBe(0);
    expect(JSON.parse(readFileSync(join(sandbox.results, 'osv-results.json'), 'utf8'))).toEqual(
      emptyReport()
    );
  });

  it('normalizes scanner exit 1 when every vulnerability has an exact active exception', () => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);
    const raw = join(sandbox.runnerTemp, 'approved.json');
    writeJson(
      raw,
      reportWith(['GHSA-jmr9-qjv8-65gv', 'GHSA-7pqw-9j4j-h8q3'], true)
    );

    const execution = runStep(dispatchScan, sandbox, {
      FAKE_SCANNER_RAW: raw,
      FAKE_SCANNER_STATUS: '1',
    });
    const filtered = JSON.parse(
      readFileSync(join(sandbox.results, 'osv-results.json'), 'utf8')
    ) as { results: Array<{ packages: Array<{ vulnerabilities: unknown[] }> }> };

    expect(execution.status).toBe(0);
    expect(filtered.results[0]?.packages[0]?.vulnerabilities).toEqual([]);
  });

  it('normalizes scanner exit 1 and filters only the exact active exceptions', () => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);
    const raw = join(sandbox.runnerTemp, 'vulnerable.json');
    writeJson(
      raw,
      reportWith([
        'GHSA-jmr9-qjv8-65gv',
        'GHSA-7pqw-9j4j-h8q3',
        'GHSA-test-test-test',
      ], true)
    );

    const execution = runStep(dispatchScan, sandbox, {
      FAKE_SCANNER_RAW: raw,
      FAKE_SCANNER_STATUS: '1',
    });
    const filtered = JSON.parse(
      readFileSync(join(sandbox.results, 'osv-results.json'), 'utf8')
    ) as { results: Array<{ packages: Array<{ vulnerabilities: Array<{ id: string }> }> }> };

    expect(execution.status).toBe(0);
    expect(filtered.results[0]?.packages[0]?.vulnerabilities.map(({ id }) => id)).toEqual([
      'GHSA-test-test-test',
    ]);
  });

  it.each([
    ['empty', 0, true],
    ['vulnerability', 1, true],
    ['diagnostic', 2, false],
    ['error', 2, false],
  ])('enforces injected reporter mode %s', (mode, expectedStatus, expectedUpload) => {
    const sandbox = createSandbox();
    installFakeDocker(sandbox.bin);
    writeJson(join(sandbox.results, 'osv-results.json'), emptyReport());
    writeFileSync(join(sandbox.results, 'osv-results.sarif'), 'stale');

    const execution = runStep(dispatchReport, sandbox, { FAKE_REPORTER_MODE: mode });

    expect(execution.status).toBe(expectedStatus);
    expect(uploadAllowed(sandbox)).toBe(expectedUpload);
    if (mode === 'error') {
      expect(existsSync(join(sandbox.results, 'osv-results.sarif'))).toBe(false);
    }
  });
});

describe.runIf(Boolean(actualContainerRuntime))('pinned reporter integration through workflow body', () => {
  const dispatchScan = extractStep('🛡️ Run OSV scan');
  const prReport = extractStep('📋 Report newly introduced vulnerabilities');
  const dispatchReport = extractStep(
    '📋 Convert OSV results to SARIF and enforce the vulnerability gate'
  );

  function actualSandbox(): Sandbox {
    const sandbox = createSandbox();
    installRuntimeDocker(sandbox.bin, actualContainerRuntime ?? 'podman');
    return sandbox;
  }

  it.each([
    ['valid approved report', {}, 0, true],
    ['approved report with invalid published metadata', { published: 42 }, 2, false],
  ])(
    'validates raw scanner JSON before filtering: %s',
    (_label, vulnerabilityMetadata, expectedStatus, expectedFiltered) => {
      const sandbox = createSandbox();
      installScannerStubRuntimeReporter(sandbox.bin, actualContainerRuntime ?? 'podman');
      const raw = join(sandbox.runnerTemp, 'approved-raw.json');
      writeJson(
        raw,
        reportWith(['GHSA-jmr9-qjv8-65gv'], true, vulnerabilityMetadata)
      );

      const execution = runStep(dispatchScan, sandbox, {
        FAKE_SCANNER_RAW: raw,
        FAKE_SCANNER_STATUS: '1',
      });

      expect(execution.status, `${execution.stdout}\n${execution.stderr}`).toBe(expectedStatus);
      expect(existsSync(join(sandbox.results, 'osv-results.json'))).toBe(expectedFiltered);
      expect(existsSync(join(sandbox.results, 'osv-results.raw.reporter.log'))).toBe(true);
    },
    30_000
  );

  it.each([
    ['normal empty result', emptyReport(), 0, 0],
    ['unapproved vulnerability', reportWith(['GHSA-test-test-test']), 1, 1],
  ])('%s preserves reporter exit and SARIF', (_label, input, expectedStatus, expectedResults) => {
    const sandbox = actualSandbox();
    writeJson(join(sandbox.results, 'osv-results.json'), input);

    const execution = runStep(dispatchReport, sandbox);
    const sarif = join(sandbox.results, 'osv-results.sarif');

    expect(execution.status, `${execution.stdout}\n${execution.stderr}`).toBe(expectedStatus);
    expect(uploadAllowed(sandbox)).toBe(true);
    expect(sarifResultCount(sarif)).toBe(expectedResults);
  }, 30_000);

  it.each(['argparse.py', 'json.py'])(
    'isolates inline Python from an attacker-controlled %s in the checkout cwd',
    (moduleName) => {
      const sandbox = actualSandbox();
      const attackerCwd = join(sandbox.runnerTemp, 'attacker-cwd');
      const sentinel = join(sandbox.runnerTemp, 'shadow-imported');
      mkdirSync(attackerCwd);
      writeFileSync(
        join(attackerCwd, moduleName),
        [
          'import os',
          'from pathlib import Path',
          'Path(os.environ["SHADOW_SENTINEL"]).write_text("imported")',
          'raise RuntimeError("checkout module shadowed the standard library")',
          '',
        ].join('\n')
      );
      writeJson(
        join(sandbox.results, 'osv-results.json'),
        reportWith(['GHSA-test-test-test'])
      );

      const execution = runStep(
        dispatchReport,
        sandbox,
        { SHADOW_SENTINEL: sentinel },
        attackerCwd
      );

      expect(execution.status, `${execution.stdout}\n${execution.stderr}`).toBe(1);
      expect(existsSync(sentinel)).toBe(false);
      expect(uploadAllowed(sandbox)).toBe(true);
      expect(sarifResultCount(join(sandbox.results, 'osv-results.sarif'))).toBe(1);
    },
    30_000
  );

  it('fails a full scan when the post-expiry filtered result retains the approved IDs', () => {
    const sandbox = actualSandbox();
    writeJson(
      join(sandbox.results, 'osv-results.json'),
      reportWith(['GHSA-jmr9-qjv8-65gv', 'GHSA-7pqw-9j4j-h8q3'], true)
    );

    const execution = runStep(dispatchReport, sandbox);

    expect(execution.status, `${execution.stdout}\n${execution.stderr}`).toBe(1);
    expect(uploadAllowed(sandbox)).toBe(true);
    expect(sarifResultCount(join(sandbox.results, 'osv-results.sarif'))).toBe(2);
  }, 30_000);

  it('passes a PR diff when the same post-expiry vulnerabilities exist in old and new', () => {
    const sandbox = actualSandbox();
    const retained = reportWith(
      ['GHSA-jmr9-qjv8-65gv', 'GHSA-7pqw-9j4j-h8q3'],
      true
    );
    writeJson(join(sandbox.results, 'old-results.json'), retained);
    writeJson(join(sandbox.results, 'new-results.json'), retained);

    const execution = runStep(prReport, sandbox);

    expect(execution.status, `${execution.stdout}\n${execution.stderr}`).toBe(0);
    expect(uploadAllowed(sandbox)).toBe(true);
    expect(sarifResultCount(join(sandbox.results, 'osv-results.sarif'))).toBe(0);
  }, 30_000);

  it.each([
    ['missing new', undefined],
    ['malformed new', '{'],
    ['semantic new', { ...reportWith(['GHSA-test-test-test']), experimental_config: 1 }],
    ['semantic published', reportWith(['GHSA-test-test-test'], false, { published: 42 })],
    ['semantic affected', reportWith(['GHSA-test-test-test'], false, { affected: 42 })],
    ['semantic severity', reportWith(['GHSA-test-test-test'], false, { severity: 42 })],
  ])('%s fails without authorizing upload', (_label, input) => {
    const sandbox = actualSandbox();
    if (input !== undefined) {
      writeFileSync(
        join(sandbox.results, 'osv-results.json'),
        typeof input === 'string' ? input : JSON.stringify(input)
      );
    }

    const execution = runStep(dispatchReport, sandbox);

    expect(execution.status).not.toBe(0);
    expect(uploadAllowed(sandbox)).toBe(false);
  }, 30_000);

  it.each([
    ['missing old', undefined],
    ['malformed old', '{'],
    ['semantic old', { ...emptyReport(), experimental_config: 1 }],
  ])('%s baseline fails without authorizing upload', (_label, oldInput) => {
    const sandbox = actualSandbox();
    writeJson(join(sandbox.results, 'new-results.json'), emptyReport());
    if (oldInput !== undefined) {
      writeFileSync(
        join(sandbox.results, 'old-results.json'),
        typeof oldInput === 'string' ? oldInput : JSON.stringify(oldInput)
      );
    }

    const execution = runStep(prReport, sandbox);

    expect(execution.status).not.toBe(0);
    expect(uploadAllowed(sandbox)).toBe(false);
  }, 30_000);
});
