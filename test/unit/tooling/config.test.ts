import { existsSync, globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};
const ciWorkflow = readFileSync(resolve(root, '.github/workflows/ci.yaml'), 'utf8');
const deepWorkflow = readFileSync(resolve(root, '.github/workflows/deep-checks.yaml'), 'utf8');
const releaseWorkflow = readFileSync(resolve(root, '.github/workflows/release.yaml'), 'utf8');
const securityWorkflow = readFileSync(resolve(root, '.github/workflows/security.yaml'), 'utf8');
const userscriptPlaywrightConfig = readFileSync(
  resolve(root, 'test/e2e/playwright.config.ts'),
  'utf8'
);
const extensionPlaywrightConfig = readFileSync(
  resolve(root, 'test/e2e/playwright.extension.config.ts'),
  'utf8'
);

describe('tooling configuration', () => {
  it('keeps the full mutation profile on the real shared source paths', () => {
    const config = JSON.parse(
      readFileSync(resolve(root, 'stryker.conf.json'), 'utf8')
    ) as { mutate: string[] };

    expect(config.mutate).toContain('src/shared/utils/**/*.ts');
    expect(config.mutate).toContain('src/shared/services/download/**/*.ts');
    expect(config.mutate).not.toContain('src/utils/**/*.ts');
    expect(config.mutate).not.toContain('src/services/download/**/*.ts');
  });

  it.each(['stryker.conf.json', 'stryker.conf.fast.json'])(
    '%s include patterns each match at least one source file',
    (filename) => {
      const config = JSON.parse(readFileSync(resolve(root, filename), 'utf8')) as {
        mutate: string[];
      };
      const includePatterns = config.mutate.filter((pattern) => !pattern.startsWith('!'));

      for (const pattern of includePatterns) {
        expect(globSync(pattern, { cwd: root }), `No source files matched ${pattern}`).not.toEqual(
          []
        );
      }
    }
  );

  it('uses native TypeScript execution without redundant runner dependencies', () => {
    expect(packageJson.devDependencies.tsx).toBeUndefined();
    expect(packageJson.devDependencies.rimraf).toBeUndefined();

    for (const script of Object.values(packageJson.scripts)) {
      expect(script).not.toMatch(/\bnpx\b|pnpm exec tsx\b|\brimraf\b/);
    }
    expect(packageJson.scripts['check:versions']).toContain('node --experimental-strip-types');
  });

  it('enforces and preserves actionable reports for the fast mutation gate', () => {
    const config = JSON.parse(
      readFileSync(resolve(root, 'stryker.conf.fast.json'), 'utf8')
    ) as {
      mutate: string[];
      coverageAnalysis: string;
      concurrency: number;
      ignoreStatic: boolean;
      reporters: string[];
      thresholds: { high: number; low: number; break: number | null };
      mutator: { excludedMutations: string[] };
    };

    expect([...config.mutate].sort()).toEqual(
      [
        'src/shared/services/download/single-download.ts',
        'src/shared/services/download/zip-download.ts',
        'src/shared/services/media/twitter-api-client.ts',
        'src/shared/utils/media/media-dimensions.ts',
        'src/shared/utils/media/media-url-utils.ts',
        'src/shared/utils/object/path.ts',
        'src/shared/utils/performance/observer-pool.ts',
        'src/shared/utils/performance/preload.ts',
        'src/shared/utils/performance/scheduler-yield.ts',
        'src/shared/utils/text/formatting.ts',
        'src/shared/utils/url/history-navigation.ts',
        'src/shared/utils/url/host.ts',
        'src/shared/utils/url/safety.ts',
        'src/shared/utils/url/url-safety.ts',
        'src/shared/utils/url/validator.ts',
      ].sort()
    );
    expect(config.mutate.some((pattern) => pattern.includes('**'))).toBe(false);
    expect(config.coverageAnalysis).toBe('perTest');
    expect(config.concurrency).toBe(4);
    expect(config.ignoreStatic).toBe(true);
    expect(config.reporters).toEqual(
      expect.arrayContaining(['progress', 'clear-text', 'json', 'html'])
    );
    expect(config.thresholds.break).toBe(70);
    expect(config.thresholds.low).toBeGreaterThan(config.thresholds.break ?? 0);
    expect(config.thresholds.high).toBeGreaterThan(config.thresholds.low);
    expect(config.mutator.excludedMutations).not.toEqual(
      expect.arrayContaining(['ConditionalExpression', 'EqualityOperator', 'BooleanLiteral'])
    );
    expect(packageJson.scripts['mut:fast']).not.toContain('--reporters');
    expect(deepWorkflow).toContain('path: reports/mutation/');
    expect(deepWorkflow).toContain('if-no-files-found: error');
  });

  it('scans the exact default-branch push with OSV and Semgrep', () => {
    const osvJob = securityWorkflow.match(/osv-scan-dispatch:[\s\S]*?codeql:/)?.[0] ?? '';
    const semgrepJob = securityWorkflow.match(/semgrep:[\s\S]*?report-pr-gate-statuses:/)?.[0] ?? '';

    expect(osvJob).toContain("github.event_name == 'push'");
    expect(semgrepJob).toContain("github.event_name == 'push'");
    expect(semgrepJob).toContain('semgrep/semgrep:1.173.0@sha256:');
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

  it('centralizes the browser E2E build and test command contracts', () => {
    expect(packageJson.scripts['build:e2e']).toBe(
      'pnpm clean && pnpm build:ci && pnpm build:dev && pnpm build:extension:ci && pnpm build:extension:firefox:ci'
    );
    expect(packageJson.scripts['test:e2e:all']).toBe(
      'pnpm -s test:e2e && pnpm -s test:e2e:extension && pnpm -s test:e2e:extension:firefox'
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
    expect(ciWorkflow).toMatch(/playwright install --with-deps (?:chromium firefox|firefox chromium)/);
  });

  it('keeps tag-release browser coverage aligned with CI', () => {
    expect(releaseWorkflow).toContain('playwright install --with-deps chromium firefox webkit');
    expect(releaseWorkflow).toContain('pnpm test:e2e:all');
    expect(packageJson.scripts['test:e2e:all']).toContain('pnpm -s test:e2e:extension:firefox');
    expect(releaseWorkflow).toContain('path: ~/.cache/selenium');
  });

  it('does not duplicate the default-branch duplication scan in Deep Verification', () => {
    const duplicationJob = deepWorkflow.match(/\n  duplication:[\s\S]*?\n  mutation:/)?.[0] ?? '';

    expect(duplicationJob).toContain("github.event_name != 'push'");
    expect(ciWorkflow).toContain('name: pr-gate/duplication');
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
    expect(userscriptPlaywrightConfig).toContain("grep: /cross-browser smoke/");
    expect(userscriptPlaywrightConfig).toContain('slowMo: process.env.CI ? 0 : 200');
    expect(ciWorkflow).toContain('playwright install --with-deps chromium firefox webkit');
    expect(ciWorkflow).toContain('Upload Playwright diagnostics');
    expect(ciWorkflow).toContain('playwright-report/');
    expect(ciWorkflow).toContain('test-results/');
  });

  it('keeps source contracts in Vitest rather than browser E2E', () => {
    expect(existsSync(resolve(root, 'test/e2e/specs/accessibility.spec.ts'))).toBe(false);
    expect(existsSync(resolve(root, 'test/unit/accessibility/source-contract.test.ts'))).toBe(
      true
    );
  });
});
