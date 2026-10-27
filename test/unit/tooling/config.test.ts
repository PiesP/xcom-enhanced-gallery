import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vite-plus/test';
import nodeTestConfig from '../../../tooling/vitest.node.config.ts';
import { RUN_TASKS } from '../../../vite.config.ts';
import { createVitestConfig } from '../../../vitest.config.ts';

// This Node policy suite inspects the project graph; Browser Mode tests exercise
// the real provider. Avoid loading its browser transport inside the Node runner.
vi.mock('vite-plus/test/browser-playwright', () => ({
  playwright: () => ({ name: 'playwright' }),
}));

const root = resolve(import.meta.dirname, '../../..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};
const ciWorkflow = readFileSync(resolve(root, '.github/workflows/ci.yaml'), 'utf8');
const releaseWorkflow = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');
const releasePrepare = readFileSync(resolve(root, 'scripts/release/prepare.ts'), 'utf8');
const securityWorkflow = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
const userscriptPlaywrightConfig = readFileSync(
  resolve(root, 'test/e2e/playwright.config.ts'),
  'utf8'
);
const extensionPlaywrightConfig = readFileSync(
  resolve(root, 'test/e2e/playwright.extension.config.ts'),
  'utf8'
);

function jobBlock(workflow: string, job: string): string {
  return (
    workflow.match(new RegExp(`^  ${job}:\\n(?:(?!^  [A-Za-z0-9_-]+:\\n)[\\s\\S])*`, 'm'))?.[0] ??
    ''
  );
}

describe('tooling configuration', () => {
  it('removes only the already-owned boundary suite from composed coverage', () => {
    const full = createVitestConfig();
    const afterPolicy = createVitestConfig(true);
    type Project = { test: { name: string; include: string[]; fileParallelism?: boolean } };
    const fullProjects = full.test?.projects as Project[];
    const afterProjects = afterPolicy.test?.projects as Project[];
    const fullProbes = fullProjects.find((project) => project.test.name === 'repository-probes');
    const afterProbes = afterProjects.find((project) => project.test.name === 'repository-probes');
    expect(fullProbes?.test.include).toEqual([
      'test/unit/tooling/toolchain-policy.test.ts',
      'test/unit/tooling/node-ambient-types.test.ts',
    ]);
    expect(afterProbes?.test.include).toEqual(
      fullProbes?.test.include.filter(
        (file) => file !== 'test/unit/tooling/node-ambient-types.test.ts'
      )
    );
    expect(fullProbes?.test.fileParallelism).toBe(false);
    expect(afterProbes?.test.fileParallelism).toBe(false);
    expect(fullProjects.find((project) => project.test.name === 'browser')?.test.include).toEqual([
      'test/browser/**/*.browser.test.{ts,tsx}',
    ]);
    expect(afterProjects.find((project) => project.test.name === 'node')).toEqual(
      fullProjects.find((project) => project.test.name === 'node')
    );
    expect(afterProjects.find((project) => project.test.name === 'browser')).toEqual(
      fullProjects.find((project) => project.test.name === 'browser')
    );
    expect(afterPolicy.test?.coverage).toEqual(full.test?.coverage);
  });
  it('keeps Node projects outside the browser unit and coverage config', () => {
    const unitProjects = createVitestConfig().test?.projects as Array<{ test: { name: string } }>;
    expect(unitProjects.map((project) => project.test.name)).toEqual([
      'node',
      'browser',
      'repository-probes',
    ]);
    type NodeProject = {
      test: { name: string; include: string[]; environment: string; fileParallelism?: boolean };
    };
    const nodeProjects = nodeTestConfig.test?.projects as NodeProject[];
    expect(nodeTestConfig.test?.setupFiles).toBeUndefined();
    expect(nodeTestConfig.test?.environment).toBe('node');
    for (const name of ['policy-node', 'firefox-installed', 'windows-native']) {
      const project = nodeProjects.find((entry) => entry.test.name === name);
      expect(project?.test.environment).toBe('node');
    }
    expect(
      nodeProjects.find((project) => project.test.name === 'policy-node')?.test.include
    ).toEqual(['scripts/ci/repository-authority.test.ts', 'scripts/release/verify-source.test.ts']);
    expect(
      nodeProjects.find((project) => project.test.name === 'firefox-installed')?.test.include
    ).toEqual(['test/firefox/firefox-extension-runtime.test.ts']);
    expect(
      nodeProjects.find((project) => project.test.name === 'windows-native')?.test.include
    ).toEqual(['validation/windows/**/*.test.ts']);
  });
  it('uses native TypeScript execution without redundant runner dependencies', () => {
    expect(packageJson.devDependencies.tsx).toBeUndefined();
    expect(packageJson.devDependencies.rimraf).toBeUndefined();
    expect(packageJson.devDependencies.typescript).toBeUndefined();

    for (const script of Object.values(packageJson.scripts)) {
      expect(script).not.toMatch(/\bnpx\b|pnpm exec tsx\b|\brimraf\b|\btsc\b/);
    }
    expect(packageJson.scripts['check:versions']).toContain('node --experimental-strip-types');
  });

  it('uses native lint for import cycles and unused bindings', () => {
    expect(packageJson.devDependencies.dpdm).toBeUndefined();
    expect(packageJson.devDependencies.knip).toBeUndefined();
    expect(packageJson.scripts.circular).toBeUndefined();
    expect(packageJson.scripts.knip).toBeUndefined();
    expect(RUN_TASKS['quality:steps'].command).toContain('vp run check');
  });

  it('scans the exact default-branch push with OSV and Semgrep', () => {
    const osvJob = securityWorkflow.match(/osv-scan-dispatch:[\s\S]*?codeql:/)?.[0] ?? '';
    const semgrepJob = securityWorkflow.match(/semgrep:[\s\S]*$/)?.[0] ?? '';

    expect(osvJob).toContain("github.event_name == 'push'");
    expect(semgrepJob).toContain("github.event_name == 'push'");
    expect(semgrepJob).toContain("needs['pin-metadata'].outputs.SEMGREP_IMAGE");
    expect(securityWorkflow).toContain(
      'GITHUB_ENV="$GITHUB_OUTPUT" node --experimental-strip-types'
    );
  });

  it('does not publish duplicate manual status contexts', () => {
    expect(ciWorkflow).not.toContain('statuses: write');
    expect(securityWorkflow).not.toContain('statuses: write');
    expect(ciWorkflow).not.toContain('report-pr-gate-statuses:');
    expect(securityWorkflow).not.toContain('report-pr-gate-statuses:');
  });

  it('runs ordinary prebuild checks once and keeps CI builds gate-free', () => {
    expect(packageJson.scripts.prebuild).toBe('vp run check:prebuild');
    expect(packageJson.scripts['prebuild:extension']).toBeUndefined();
    expect(packageJson.scripts['prebuild:extension:firefox']).toBeUndefined();
    expect(packageJson.scripts['prebuild:all']).toBeUndefined();
    expect(RUN_TASKS['check:prebuild'].command).toEqual([
      'vp run check:versions',
      'vp run quality',
    ]);
    expect(RUN_TASKS['build:extension:steps'].command).toEqual([
      'vp run check:prebuild',
      'vp run build:extension:ci',
    ]);
    expect(RUN_TASKS['build:extension:firefox:steps'].command).toEqual([
      'vp run check:prebuild',
      'vp run build:extension:firefox:ci',
    ]);
    expect(RUN_TASKS['build:all:steps'].command).toEqual([
      'vp run check:prebuild',
      'vp run build:ci',
      'vp run build:extension:ci',
      'vp run build:extension:firefox:ci',
    ]);
    expect(packageJson.scripts['quality:fix']).toBe('vp run quality:fix:steps');
  });

  it('routes formatting, lint, tests and coverage through the maintained toolchain', () => {
    const scripts = packageJson.scripts;
    expect(scripts.fmt).toBe('vp fmt --check');
    expect(scripts['fmt:fix']).toBe('vp fmt --write');
    expect(scripts.lint).toBe('vp lint . --deny-warnings');
    expect(scripts['lint:fix']).toBe('vp lint . --fix --deny-warnings');
    expect(packageJson.devDependencies['@biomejs/biome']).toBeUndefined();
    expect(scripts.quality).toBe('vp run quality:steps');
    expect(scripts.check).toBe('vp check');
    expect(RUN_TASKS['quality:steps'].command).toEqual(['vp run check', 'vp run test:ci']);
    expect(scripts['quality:coverage-owned']).toBe('vp run quality:coverage-owned:steps');
    expect(RUN_TASKS['quality:coverage-owned:steps'].command).toEqual([
      'vp run check',
      'vp run test:policy',
    ]);
    expect(scripts['test:ci']).toBe('vp run test:ci:steps');
    expect(RUN_TASKS['test:ci:steps'].command).toEqual([
      'vp run test:policy',
      'vp test run test/unit/tooling/node-ambient-types.test.ts',
    ]);
    expect(scripts.test).toBe('vp test run');
    expect(scripts['test:policy']).toBe(
      'vp test run --config tooling/vitest.node.config.ts --project policy-node'
    );
    expect(scripts['test:cov']).toBe('vp test run --coverage');
    expect(scripts['test:cov:after-policy']).toBe(
      'vp test run --coverage --config tooling/vitest.after-policy.config.ts'
    );
    expect(scripts['test:e2e:extension:firefox']).toBe(
      'vp test run --config tooling/vitest.node.config.ts --project firefox-installed'
    );
    expect(scripts['test:e2e:native']).toBe(
      'vp test run --config tooling/vitest.node.config.ts --project windows-native'
    );
    expect(jobBlock(ciWorkflow, 'quality')).toContain('vp run quality:coverage-owned');
    expect(jobBlock(ciWorkflow, 'unit')).toContain('run: vp run test:cov');
  });

  it('centralizes the browser E2E build and test command contracts', () => {
    expect(packageJson.scripts['build:e2e']).toBe('vp run build:e2e:steps');
    expect(RUN_TASKS['build:e2e:steps'].command).toEqual([
      'vp run clean',
      'vp run build:ci',
      'vp run build:dev',
      'vp run build:extension:ci',
      'vp run build:extension:firefox:ci',
    ]);
    expect(packageJson.scripts['test:e2e:all']).toBe('vp run test:e2e:all:steps');
    expect(RUN_TASKS['test:e2e:all:steps'].command).toEqual([
      'vp run test:e2e',
      'vp run test:e2e:extension',
      'vp run test:e2e:extension:firefox',
      'vp run test:e2e:native',
    ]);
    expect(RUN_TASKS['verify:full:steps'].command).toContain('vp run test:e2e:all');

    for (const workflow of [ciWorkflow, releaseWorkflow]) {
      expect(workflow).toContain('run: vp run build:e2e');
      expect(workflow).toContain('vp run test:e2e:all');
      expect(workflow).not.toContain('vp run test:e2e:extension\n');
    }
  });

  it('builds and smoke-tests both extension targets in CI', () => {
    expect(RUN_TASKS['build:e2e:steps'].command).toContain('vp run build:extension:ci');
    expect(RUN_TASKS['build:e2e:steps'].command).toContain('vp run build:extension:firefox:ci');
    expect(RUN_TASKS['test:e2e:all:steps'].command).toContain('vp run test:e2e:extension');
    expect(ciWorkflow).toContain('vp run build:e2e');
    expect(ciWorkflow).toContain('vp run test:e2e:all');
    expect(ciWorkflow).toContain('playwright install --with-deps chromium firefox webkit');
  });

  it('binds manual releases to a tag contained in protected master', () => {
    expect(releaseWorkflow).toContain("github.ref == 'refs/heads/master'");
    expect(releaseWorkflow).toContain(
      'run: node --experimental-strip-types scripts/release/verify-source.ts'
    );
    expect(releaseWorkflow).toContain('ref: ${{ github.sha }}');
    expect(releaseWorkflow).toContain(
      'git -c advice.detachedHead=false checkout --detach "$RELEASE_SHA"'
    );
    expect(releaseWorkflow).not.toContain('ref: ${{ needs.provenance.outputs.release-sha }}');
    expect(releaseWorkflow).toContain(
      'name: release-bundle-${{ needs.provenance.outputs.release-sha }}'
    );
    expect(releaseWorkflow).not.toContain('push:\n    tags:');
    expect(releaseWorkflow).not.toContain('publish_branch: release');
    expect(releaseWorkflow).not.toContain('purge.jsdelivr.net');
    expect(releaseWorkflow).toContain('RELEASE_SHA: ${{ needs.provenance.outputs.release-sha }}');
    expect(releasePrepare).toContain("execFileSync('git', ['rev-parse', 'HEAD']");
    expect(releasePrepare).toContain('expectedCommit !== checkedOutCommit');
    expect(releasePrepare).toContain('const commit = releaseCommit;');
    expect(releasePrepare).not.toContain('process.env.GITHUB_SHA');

    const localExecutionMarkers = {
      quality:
        'uses: PiesP/browser-core/automation/actions/setup-project@38cd1cb18c9c37e57e8b53a98e811450bb1a18fc',
      unit: 'uses: PiesP/browser-core/automation/actions/setup-project@38cd1cb18c9c37e57e8b53a98e811450bb1a18fc',
      e2e: 'uses: PiesP/browser-core/automation/actions/setup-project@38cd1cb18c9c37e57e8b53a98e811450bb1a18fc',
      build:
        'uses: PiesP/browser-core/automation/actions/setup-project@38cd1cb18c9c37e57e8b53a98e811450bb1a18fc',
    } as const;
    for (const [job, marker] of Object.entries(localExecutionMarkers)) {
      const block = jobBlock(releaseWorkflow, job);
      const detach = block.indexOf(
        'git -c advice.detachedHead=false checkout --detach "$RELEASE_SHA"'
      );
      const sync = block.indexOf('git submodule sync --recursive');
      const update = block.indexOf('git submodule update --init --recursive');
      const localExecution = block.indexOf(marker);

      expect(detach, `${job} verified detach`).toBeGreaterThanOrEqual(0);
      expect(sync, `${job} submodule sync`).toBeGreaterThan(detach);
      expect(update, `${job} submodule update`).toBeGreaterThan(sync);
      expect(localExecution, `${job} local execution`).toBeGreaterThan(update);
    }
  });

  it('keeps protected-release browser coverage aligned with CI', () => {
    expect(releaseWorkflow).toContain('playwright install --with-deps chromium firefox webkit');
    expect(releaseWorkflow).toContain('vp run test:e2e:all');
    expect(RUN_TASKS['test:e2e:all:steps'].command).toContain('vp run test:e2e:extension:firefox');
    expect(releaseWorkflow).not.toContain('path: ~/.cache/selenium');
  });

  it('retains actionable browser diagnostics and labels Firefox coverage honestly', () => {
    for (const config of [userscriptPlaywrightConfig, extensionPlaywrightConfig]) {
      expect(config).toContain("trace: 'retain-on-failure'");
      expect(config).toContain("video: 'retain-on-failure'");
      expect(config).toContain("screenshot: 'only-on-failure'");
      expect(config).toContain("'html'");
    }

    expect(extensionPlaywrightConfig).toContain("name: 'firefox-artifact-runtime'");
    expect(extensionPlaywrightConfig).not.toContain("name: 'firefox-runtime'");
    expect(extensionPlaywrightConfig).toContain('grep: /loads the Chrome extension/');
    expect(extensionPlaywrightConfig).toContain('grep: /Firefox/');
    expect(userscriptPlaywrightConfig).toContain("testIgnore: 'extension-runtime.spec.ts'");
    expect(userscriptPlaywrightConfig).toContain("name: 'firefox-smoke'");
    expect(userscriptPlaywrightConfig).toContain("name: 'webkit-smoke'");
    expect(userscriptPlaywrightConfig).toContain('grep: /cross-browser smoke/');
    expect(userscriptPlaywrightConfig).toContain('slowMo: process.env.CI ? 0 : 200');
    expect(ciWorkflow).toContain('playwright install --with-deps chromium firefox webkit');
    expect(ciWorkflow).toContain('Upload Playwright diagnostics');
    expect(ciWorkflow).toContain('playwright-report/');
    expect(ciWorkflow).toContain('test-results/');
  });

  it('keys the Playwright cache to the installed version and preserves browser provisioning', () => {
    const e2e = jobBlock(ciWorkflow, 'e2e');
    const playwrightCache =
      e2e.split('      - name: 🎭 Cache Playwright browsers\n')[1]?.split('      - name: ')[0] ??
      '';
    expect(ciWorkflow).not.toContain('cache_trial');
    expect(e2e).toContain('path: ~/.cache/selenium');
    expect(e2e).toContain(
      `run: node -p "'version=' + require('@playwright/test/package.json').version" >> "$GITHUB_OUTPUT"`
    );
    expect(playwrightCache).toContain('path: ~/.cache/ms-playwright');
    expect(playwrightCache).toContain(
      'key: playwright-${{ runner.os }}-${{ runner.arch }}-ubuntu-24.04-chromium-firefox-webkit-${{ steps.playwright.outputs.version }}'
    );
    expect(playwrightCache).not.toContain('restore-keys:');
    const commands = [
      'name: 📦 Setup project',
      'name: 🎭 Read installed Playwright version',
      'name: 🎭 Cache Playwright browsers',
      'run: vp run build:e2e',
      'vp exec playwright install --with-deps chromium firefox webkit',
      'vp run test:e2e:all',
    ];
    const positions = commands.map((command) => e2e.indexOf(command));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
