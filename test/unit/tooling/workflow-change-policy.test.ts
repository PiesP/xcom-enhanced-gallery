import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, globSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { classifyChanges } from '../../../scripts/ci/classify-changes.ts';

const root = resolve(import.meta.dirname, '../../..');
const classifier = resolve(root, 'scripts/ci/classify-changes.ts');
const ciWorkflow = readFileSync(resolve(root, '.github/workflows/ci.yaml'), 'utf8');
const securityWorkflow = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
const updateCoreWorkflow = readFileSync(
  resolve(root, '.github/workflows/update-browser-core.yaml'),
  'utf8'
);
const releaseWorkflow = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');
const scripts = (
  JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  }
).scripts;
const settings = readFileSync(resolve(root, '.github/settings.yml'), 'utf8');

const ciOutputs = ['quality', 'unit', 'e2e', 'build'] as const;
const securityOutputs = ['osv', 'semgrep', 'codeql_actions', 'codeql_javascript'] as const;

function classify(
  files: string[],
  environment: Record<string, string> = {}
): Record<string, string> {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'xeg-change-policy-'));
  const outputPath = join(tempDirectory, 'outputs.txt');

  try {
    execFileSync(
      process.execPath,
      [
        '--experimental-strip-types',
        classifier,
        ...(files.length > 0 ? ['--files', ...files] : []),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          GITHUB_OUTPUT: outputPath,
          ...environment,
        },
        stdio: 'pipe',
      }
    );

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
  for (const name of names) {
    expect(outputs[name], name).toBe('true');
  }
}

function jobBlock(workflow: string, job: string): string {
  return (
    workflow.match(new RegExp(`^  ${job}:\\n(?:(?!^  [A-Za-z0-9_-]+:\\n)[\\s\\S])*`, 'm'))?.[0] ??
    ''
  );
}

function stepBlock(workflow: string, job: string, name: string): string {
  const block = jobBlock(workflow, job);
  const start = block.indexOf(`- name: ${name}\n`);
  expect(start, `${job}: ${name}`).toBeGreaterThanOrEqual(0);
  return block.slice(start).split('\n      - name:')[0] ?? '';
}

function routeExpression(
  step: string,
  route: { result: string; quality?: string | undefined; unit?: string | undefined }
): boolean {
  const expression = step.match(/\$\{\{\s*(.*?)\s*\}\}/)?.[1];
  expect(expression).toBeDefined();
  return (expression ?? '').split(' || ').some((alternative) =>
    alternative.split(' && ').every((term) => {
      const match = term.match(
        /^needs\.changes\.(result|outputs\.quality|outputs\.unit) (==|!=) '(success|false)'$/
      );
      expect(match, term).not.toBeNull();
      const [, key, operator, literal] = match ?? [];
      const actual =
        key === 'result' ? route.result : key === 'outputs.quality' ? route.quality : route.unit;
      return operator === '==' ? actual === literal : actual !== literal;
    })
  );
}

function commandBoundaryCount(command: string): number {
  return command.split(' && ').reduce((count, part) => {
    const nested = part.match(/^pnpm (?:-s )?([\w:-]+)$/)?.[1];
    if (nested) {
      expect(scripts[nested], nested).toBeDefined();
      return count + commandBoundaryCount(scripts[nested] ?? '');
    }
    if (part.startsWith('vp test run')) {
      return count + (part.includes('--config tooling/vitest.after-policy.config.ts') ? 0 : 1);
    }
    return count;
  }, 0);
}

function runSelectedQuality(route: {
  result: string;
  quality?: string | undefined;
  unit?: string | undefined;
}): string {
  const step = stepBlock(ciWorkflow, 'quality', '✅ Run quality gate');
  const ownerExpression = step.match(/COVERAGE_OWNS_BOUNDARY: (\$\{\{.*\}\})/)?.[1];
  expect(ownerExpression).toBeDefined();
  const ownsBoundary = routeExpression(ownerExpression ?? '', route);
  const script = step.match(/run: \|\n([\s\S]*)/)?.[1];
  expect(script).toBeDefined();
  const directory = mkdtempSync(join(tmpdir(), 'xeg-boundary-route-'));
  const commandLog = join(directory, 'commands');
  const fakePnpm = join(directory, 'pnpm');
  writeFileSync(fakePnpm, '#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$COMMAND_LOG"\n');
  chmodSync(fakePnpm, 0o755);
  try {
    const result = spawnSync('bash', ['-e', '-c', script ?? ''], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH ?? ''}`,
        COMMAND_LOG: commandLog,
        COVERAGE_OWNS_BOUNDARY: String(ownsBoundary),
      },
    });
    expect(result.status, result.stderr).toBe(0);
    return readFileSync(commandLog, 'utf8').trim();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function focusedPolicyCondition(): string {
  const unitJob = jobBlock(ciWorkflow, 'unit');
  const marker = '- name: 🧪 Run focused policy suite for unit-only changes\n';
  const start = unitJob.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const step = unitJob.slice(start).split('\n      - name:')[0] ?? '';
  expect(step).toContain('run: pnpm test:policy');
  const expression = step.match(/^\s*if:\s*\$\{\{\s*(.*?)\s*\}\}\s*$/m)?.[1];
  expect(expression).toBeDefined();
  return expression ?? '';
}

function focusedPolicyRuns(
  expression: string,
  route: { result: string; unit?: string | undefined; quality?: string | undefined }
): boolean {
  const terms = expression.replace(/\s+/g, ' ').split(' && ');
  expect(terms).toHaveLength(3);
  const keys = new Set<string>();
  const matches = terms.map((term) => {
    const match = term.match(
      /^needs\.changes\.(result|outputs\.unit|outputs\.quality) (==|!=) '(success|false)'$/
    );
    expect(match, term).not.toBeNull();
    const [, key, operator, literal] = match ?? [];
    keys.add(key ?? '');
    const actual =
      key === 'result' ? route.result : key === 'outputs.unit' ? route.unit : route.quality;
    return operator === '==' ? actual === literal : actual !== literal;
  });
  expect(keys).toEqual(new Set(['result', 'outputs.unit', 'outputs.quality']));
  return matches.every(Boolean);
}

describe('workflow change policy', () => {
  it.each([
    { result: 'success', quality: 'true', unit: 'true', owner: 'unit', policy: 1 },
    { result: 'success', quality: 'true', unit: 'false', owner: 'quality', policy: 1 },
    { result: 'success', quality: 'false', unit: 'true', owner: 'unit', policy: 1 },
    { result: 'failure', quality: undefined, unit: undefined, owner: 'unit', policy: 1 },
    { result: 'success', quality: undefined, unit: undefined, owner: 'unit', policy: 1 },
    { result: 'success', quality: 'false', unit: 'false', owner: 'none', policy: 0 },
  ])('assigns one boundary owner for $result/$quality/$unit', (route) => {
    const qualityRuns = routeExpression(
      stepBlock(ciWorkflow, 'quality', '✅ Run quality gate'),
      route
    );
    const unitRuns = routeExpression(
      stepBlock(ciWorkflow, 'unit', '🧪 Run unit tests and coverage thresholds'),
      route
    );
    const policyRuns = routeExpression(
      stepBlock(ciWorkflow, 'unit', '🧪 Run focused policy suite for unit-only changes'),
      route
    );
    const qualityCommand = qualityRuns ? runSelectedQuality(route) : '';
    const qualityBoundary = qualityCommand
      ? commandBoundaryCount(scripts[qualityCommand] ?? '')
      : 0;
    const unitBoundary = unitRuns ? commandBoundaryCount(scripts['test:cov'] ?? '') : 0;
    const policyCount = (qualityRuns ? 1 : 0) + (policyRuns ? 1 : 0);
    expect(qualityBoundary + unitBoundary).toBe(route.owner === 'none' ? 0 : 1);
    expect(policyCount).toBe(route.policy);
    expect(qualityBoundary ? 'quality' : unitBoundary ? 'unit' : 'none').toBe(route.owner);
    if (qualityRuns) {
      expect(qualityCommand).toBe(route.owner === 'quality' ? 'quality' : 'quality:coverage-owned');
    }
    expect(stepBlock(ciWorkflow, 'quality', '⏭️ No quality-relevant changes')).toContain(
      'required check satisfied'
    );
    expect(stepBlock(ciWorkflow, 'unit', '⏭️ No unit-relevant changes')).toContain(
      'required check satisfied'
    );
  });

  it('keeps standalone and release command ownership explicit', () => {
    for (const name of ['quality', 'test:ci', 'test', 'test:cov', 'verify', 'verify:full']) {
      expect(commandBoundaryCount(scripts[name] ?? ''), name).toBe(1);
    }
    expect(commandBoundaryCount(scripts['quality:coverage-owned'] ?? '')).toBe(0);
    expect(commandBoundaryCount(scripts['test:cov:after-policy'] ?? '')).toBe(0);
    expect(stepBlock(releaseWorkflow, 'quality', '✅ Run quality gate')).toContain(
      'run: pnpm quality:coverage-owned'
    );
    expect(
      stepBlock(releaseWorkflow, 'unit', '🧪 Run unit tests and coverage thresholds')
    ).toContain('run: pnpm test:cov');
    expect(jobBlock(releaseWorkflow, 'publish')).toContain(
      'needs: [provenance, quality, unit, e2e, build]'
    );
    expect(jobBlock(ciWorkflow, 'quality')).toContain('name: pr-gate/quality');
    expect(jobBlock(ciWorkflow, 'unit')).toContain('name: pr-gate/unit');
    expect(jobBlock(ciWorkflow, 'quality')).toContain('if: ${{ !cancelled() }}');
    expect(jobBlock(ciWorkflow, 'unit')).toContain('if: ${{ !cancelled() }}');
  });
  it.each([
    { path: 'README.md', focused: true, unit: 'true', quality: 'false' },
    { path: '.github/workflows/security.yaml', focused: true, unit: 'true', quality: 'false' },
    {
      path: '.github/actions/setup-release/action.yaml',
      focused: true,
      unit: 'true',
      quality: 'false',
    },
    {
      path: 'test/fixtures/authenticated-x-layouts/card.html',
      focused: true,
      unit: 'true',
      quality: 'false',
    },
    { path: 'src/main.ts', focused: false, unit: 'true', quality: 'true' },
    { path: 'knip.json', focused: false, unit: 'true', quality: 'true' },
    { path: 'docs/policy.md', focused: false, unit: 'false', quality: 'false' },
    // The classifier treats translated root READMEs as unknown and safely selects every gate.
    { path: 'README.ko.md', focused: false, unit: 'true', quality: 'true' },
  ])('routes $path through the actual focused-policy step condition', (entry) => {
    const output = classify([entry.path]);
    expect(output.unit).toBe(entry.unit);
    expect(output.quality).toBe(entry.quality);
    expect(
      focusedPolicyRuns(focusedPolicyCondition(), {
        result: 'success',
        unit: output.unit,
        quality: output.quality,
      })
    ).toBe(entry.focused);
  });

  it('runs focused policy only when classification succeeds, unit runs, and quality skips', () => {
    const expression = focusedPolicyCondition();
    expect(
      focusedPolicyRuns(expression, { result: 'success', unit: 'true', quality: 'false' })
    ).toBe(true);
    expect(
      focusedPolicyRuns(expression, { result: 'success', unit: 'false', quality: 'false' })
    ).toBe(false);
    expect(
      focusedPolicyRuns(expression, { result: 'success', unit: 'true', quality: 'true' })
    ).toBe(false);
    expect(
      focusedPolicyRuns(expression, { result: 'success', unit: 'false', quality: 'true' })
    ).toBe(false);
    expect(
      focusedPolicyRuns(expression, { result: 'failure', unit: 'true', quality: 'false' })
    ).toBe(false);
    expect(focusedPolicyRuns(expression, { result: 'success', unit: 'true' })).toBe(false);
    expect(focusedPolicyRuns(expression, { result: 'failure' })).toBe(false);
    expect(focusedPolicyRuns(expression, { result: 'success', quality: 'false' })).toBe(true);

    const qualityJob = jobBlock(ciWorkflow, 'quality');
    const unitJob = jobBlock(ciWorkflow, 'unit');
    expect(qualityJob).toContain(
      "needs.changes.result != 'success' || needs.changes.outputs.quality != 'false'"
    );
    expect(unitJob).toContain(
      "needs.changes.result != 'success' || needs.changes.outputs.unit != 'false'"
    );
    expect(unitJob).toContain('run: pnpm test:cov');
    expect(unitJob).toContain(
      "needs.changes.result == 'success' && needs.changes.outputs.unit == 'false'"
    );
  });

  it.each([
    'validation/windows/profile.ts',
    'validation/windows/install-profile.mjs',
    'validation/windows/profile.json',
    '.github/actions/setup-release/resolve-runtime.mjs',
    'extension/manifest.json',
    'extension/manifest.firefox.json',
    'tooling/vite/plugins/css-inline.ts',
    'test/e2e/fixtures/installed-gallery-page.html',
    'test/visual/gallery.html',
    'vitest.config.ts',
    'tsconfig.node-tests.json',
    'tsconfig.new-runtime.json',
  ])('selects quality for managed supported input %s', (path) => {
    expect(classifyChanges(['--files', path]).selected.has('quality')).toBe(true);
  });

  it('preserves exact-byte host captures under the fixture test owner', () => {
    const capture = classify(['test/fixtures/authenticated-x-layouts/card.html']);
    expect(capture.quality).toBe('false');
    expectAll(capture, ['unit', 'e2e', 'semgrep', 'codeql_javascript']);
  });

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

  it('type-checks every test source and selects quality for test-only changes', () => {
    const checkedFiles = new Set<string>();
    for (const project of ['tsconfig.test.json', 'tsconfig.e2e.json', 'tsconfig.node-tests.json']) {
      const config = JSON.parse(
        execFileSync(
          process.execPath,
          [resolve(root, 'node_modules/typescript/bin/tsc'), '--project', project, '--showConfig'],
          { cwd: root, encoding: 'utf8' }
        )
      ) as {
        files: string[];
        compilerOptions: { noUnusedLocals?: boolean; noUnusedParameters?: boolean };
      };
      expect(config.compilerOptions.noUnusedLocals, project).toBe(true);
      expect(config.compilerOptions.noUnusedParameters, project).toBe(true);
      for (const file of config.files) {
        checkedFiles.add(resolve(root, file));
      }
    }
    const testFiles = globSync('test/**/*.{ts,tsx}', {
      cwd: root,
      exclude: ['test/node_modules/**'],
    });
    expect(testFiles.length).toBeGreaterThan(0);
    expect(classify(['test/unit/tooling/workflow-change-policy.test.ts']).quality).toBe('true');
    for (const file of testFiles) {
      expect(checkedFiles.has(resolve(root, file)), file).toBe(true);
      expect(
        classifyChanges(['--files', file.replaceAll('\\', '/')]).selected.has('quality'),
        file
      ).toBe(true);
    }
  });

  it('scopes binary icons without weakening build and browser coverage', () => {
    const icon = classify(['assets/icons/icon-128x128.png']);

    expect(icon.e2e).toBe('true');
    expect(icon.build).toBe('true');
    expect(icon.quality).toBe('false');
    expect(icon.unit).toBe('false');
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
    const otherWorkflow = classify(['.github/workflows/new-policy.yaml']);
    expectAll(otherWorkflow, ['unit', 'semgrep', 'codeql_actions']);
    expect(classify(['.github/settings.yml']).unit).toBe('true');

    const sharedFixture = classify(['test/fixtures/quoted-video-tweet-response.ts']);
    expectAll(sharedFixture, ['unit', 'e2e', 'semgrep', 'codeql_javascript']);

    const windowsValidation = classify(['validation/windows/live-page.ts']);
    expectAll(windowsValidation, ['unit', 'e2e', 'semgrep', 'codeql_javascript']);
    expect(windowsValidation.build).toBe('false');
    const pins = classify(['scripts/ci/pinned-tools.json']);
    expectAll(pins, ['quality', 'unit', 'osv', 'semgrep']);
  });

  it('preserves every required context while adding explicit no-op success paths', () => {
    const contexts = [
      'pr-gate/quality',
      'pr-gate/build',
      'pr-gate/unit',
      'pr-gate/e2e',
      'pr-gate/osv / osv-scan',
      'pr-gate/semgrep',
    ];

    for (const context of contexts) {
      expect(settings).toContain(`- context: "${context}"\n            app_id: 15368`);
      expect(`${ciWorkflow}\n${securityWorkflow}`).toContain(`name: ${context}`);
    }

    expect(ciWorkflow).toContain('No quality-relevant changes');
    expect(ciWorkflow).toContain('No unit-relevant changes');
    expect(ciWorkflow).toContain('No browser-relevant changes');
    expect(ciWorkflow).toContain('No build-relevant changes');
    expect(ciWorkflow).not.toContain('name: pr-gate/duplication');
    expect(securityWorkflow).toContain('No dependency-relevant changes');
    expect(securityWorkflow).toContain('No Semgrep-relevant changes');
  });

  it('fails open to heavy checks when routing fails or returns no explicit decision', () => {
    for (const output of ['quality', 'unit', 'e2e', 'build'] as const) {
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
    for (const job of ['quality', 'unit', 'e2e', 'build']) {
      expect(jobBlock(ciWorkflow, job), job).toContain('needs:');
      expect(jobBlock(ciWorkflow, job), job).toContain('if: ${{ !cancelled() }}');
    }
    for (const job of ['osv-scan-pr', 'osv-scan-dispatch', 'semgrep']) {
      expect(jobBlock(securityWorkflow, job), job).toContain('needs: [changes, pin-metadata]');
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
      expect(changes).toContain('git show "$BASE_SHA:scripts/ci/classify-changes.ts"');
      expect(changes).toContain('node --experimental-strip-types "$classifier"');
      expect(changes).toContain('reason=trusted-classifier-unavailable-full');
      expect(changes).toContain(
        'uses: PiesP/browser-core/automation/actions/setup-project@279124fa998847bd0184d2de12bdaadcd6d2f969'
      );
      expect(changes).toContain("install-dependencies: 'false'");
      expect(changes).not.toContain('runtime: node@');
      expect(changes).toContain('submodules: false');
      expect(changes).toContain(
        'for output in quality unit e2e build osv semgrep codeql_actions codeql_javascript'
      );
      expect(changes).not.toContain('classify-changes.sh');
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

    expect(updateCoreWorkflow.slice(0, updateCoreWorkflow.indexOf('\npermissions:'))).toContain(
      'paths-ignore:'
    );
  });
});
