import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { createVitestConfig } from '../../../vitest.config.ts';

const root = resolve(import.meta.dirname, '../../..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};
const knipConfig = JSON.parse(readFileSync(resolve(root, 'knip.json'), 'utf8')) as {
  entry: string[];
  project: string[];
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
      'test/unit/tooling/knip-boundaries.test.ts',
    ]);
    expect(afterProbes?.test.include).toEqual(
      fullProbes?.test.include.filter(
        (file) => file !== 'test/unit/tooling/node-ambient-types.test.ts'
      )
    );
    expect(fullProbes?.test.fileParallelism).toBe(false);
    expect(afterProbes?.test.fileParallelism).toBe(false);
    expect(afterProjects.find((project) => project.test.name === 'unit')).toEqual(
      fullProjects.find((project) => project.test.name === 'unit')
    );
    expect(afterPolicy.test?.coverage).toEqual(full.test?.coverage);
  });
  it('uses native TypeScript execution without redundant runner dependencies', () => {
    expect(packageJson.devDependencies.tsx).toBeUndefined();
    expect(packageJson.devDependencies.rimraf).toBeUndefined();

    for (const script of Object.values(packageJson.scripts)) {
      expect(script).not.toMatch(/\bnpx\b|pnpm exec tsx\b|\brimraf\b/);
    }
    expect(packageJson.scripts['check:versions']).toContain('node --experimental-strip-types');
  });

  it('fails quality checks for unused dependencies, files, and exports across source and tests', () => {
    expect(packageJson.scripts.knip).toBe('pnpm -s knip:full && pnpm -s knip:production');
    expect(packageJson.scripts['knip:full']).toBe(
      'knip --files --exports --dependencies --treat-config-hints-as-errors'
    );
    expect(packageJson.scripts['knip:production']).toBe(
      'knip --production --files --exports --dependencies --tags=-testOnly --treat-config-hints-as-errors'
    );
    expect(knipConfig.entry).toEqual(
      expect.arrayContaining([
        'src/main.ts!',
        'src/extension/background.ts!',
        'src/extension/content.ts!',
      ])
    );
    expect(knipConfig.project).toEqual(
      expect.arrayContaining(['src/**/*.ts!', 'src/**/*.tsx!', 'test/**/*.ts', 'test/**/*.tsx'])
    );
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

  it('lets pnpm run extension prebuild hooks exactly once', () => {
    expect(packageJson.scripts['build:extension']).not.toContain('prebuild:extension');
    expect(packageJson.scripts['build:extension:firefox']).not.toContain(
      'prebuild:extension:firefox'
    );
    expect(packageJson.scripts['build:all']).toContain('build:extension:ci');
    expect(packageJson.scripts['quality:fix']).toBe(
      'pnpm -s fmt:fix && pnpm -s lint:fix && pnpm -s quality'
    );
  });

  it('routes formatting, lint, tests and coverage through the maintained toolchain', () => {
    const scripts = packageJson.scripts;
    expect(scripts.fmt).toBe('vp fmt --check');
    expect(scripts['fmt:fix']).toBe('vp fmt --write');
    expect(scripts.lint).toBe('vp lint . --deny-warnings');
    expect(scripts['lint:fix']).toBe('vp lint . --fix --deny-warnings');
    expect(packageJson.devDependencies['@biomejs/biome']).toBeUndefined();
    expect(scripts.quality).toBe(
      'pnpm -s fmt && pnpm -s lint && pnpm -s check && pnpm -s check:e2e && pnpm -s test:ci && pnpm -s circular && pnpm -s knip'
    );
    expect(scripts['quality:coverage-owned']).toBe(
      (scripts.quality ?? '').replace('pnpm -s test:ci', 'pnpm -s test:policy')
    );
    expect(scripts['test:ci']).toBe(
      'pnpm -s test:policy && vp test run test/unit/tooling/node-ambient-types.test.ts'
    );
    expect(scripts['test:cov']).toBe('vp test run --coverage');
    expect(scripts['test:cov:after-policy']).toBe(
      'vp test run --coverage --config tooling/vitest.after-policy.config.ts'
    );
    expect(jobBlock(ciWorkflow, 'quality')).toContain('pnpm quality:coverage-owned');
    expect(jobBlock(ciWorkflow, 'unit')).toContain('run: pnpm test:cov');
  });

  it('centralizes the browser E2E build and test command contracts', () => {
    expect(packageJson.scripts['build:e2e']).toBe(
      'pnpm clean && pnpm build:ci && pnpm build:dev && pnpm build:extension:ci && pnpm build:extension:firefox:ci'
    );
    expect(packageJson.scripts['test:e2e:all']).toBe(
      'pnpm -s test:e2e && pnpm -s test:e2e:extension && pnpm -s test:e2e:extension:firefox && pnpm -s test:e2e:native'
    );
    expect(packageJson.scripts['verify:full']).toContain('pnpm -s test:e2e:all');

    for (const workflow of [ciWorkflow, releaseWorkflow]) {
      expect(workflow).toContain('run: pnpm build:e2e');
      expect(workflow).toContain('pnpm test:e2e:all');
      expect(workflow).not.toContain('pnpm test:e2e:extension\n');
    }
  });

  it('builds and smoke-tests both extension targets in CI', () => {
    expect(packageJson.scripts['build:e2e']).toContain('pnpm build:extension:ci');
    expect(packageJson.scripts['build:e2e']).toContain('pnpm build:extension:firefox:ci');
    expect(packageJson.scripts['test:e2e:all']).toContain('pnpm -s test:e2e:extension');
    expect(ciWorkflow).toContain('pnpm build:e2e');
    expect(ciWorkflow).toContain('pnpm test:e2e:all');
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
      quality: 'uses: ./.github/actions/setup-release',
      unit: 'uses: ./.github/actions/setup-release',
      e2e: 'uses: ./.github/actions/setup-release',
      build: 'uses: ./.github/actions/setup-release',
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
    expect(releaseWorkflow).toContain('pnpm test:e2e:all');
    expect(packageJson.scripts['test:e2e:all']).toContain('pnpm -s test:e2e:extension:firefox');
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
      'run: pnpm build:e2e',
      'pnpm exec playwright install --with-deps chromium firefox webkit',
      'pnpm test:e2e:all',
    ];
    const positions = commands.map((command) => e2e.indexOf(command));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
