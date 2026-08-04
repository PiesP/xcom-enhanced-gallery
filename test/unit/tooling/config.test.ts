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
  it.each(['stryker.conf.json', 'stryker.conf.fast.json'])(
    '%s mutates source files from their real shared paths',
    (filename) => {
      const config = JSON.parse(readFileSync(resolve(root, filename), 'utf8')) as {
        mutate: string[];
      };

      expect(config.mutate).toContain('src/shared/utils/**/*.ts');
      expect(config.mutate).toContain('src/shared/services/download/**/*.ts');
      expect(config.mutate).not.toContain('src/utils/**/*.ts');
      expect(config.mutate).not.toContain('src/services/download/**/*.ts');
    }
  );

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
      reporters: string[];
      thresholds: { high: number; low: number; break: number | null };
      mutator: { excludedMutations: string[] };
    };

    expect(config.mutate).toEqual(
      expect.arrayContaining([
        'src/shared/services/media/twitter-api-client.ts',
        'src/shared/services/media/media-factory.ts',
        'src/shared/services/media-extraction/determine-clicked-index.ts',
        'src/shared/services/media-extraction/media-extraction-service.ts',
        'src/shared/services/media-extraction/extractors/twitter-api-extractor.ts',
      ])
    );
    expect(config.reporters).toEqual(
      expect.arrayContaining(['progress', 'clear-text', 'json', 'html'])
    );
    expect(config.thresholds.break).toBeGreaterThanOrEqual(30);
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
    expect(semgrepJob).toContain('semgrep/semgrep:1.172.0@sha256:');
  });

  it('lets pnpm run extension prebuild hooks exactly once', () => {
    expect(packageJson.scripts['build:extension']).not.toContain('prebuild:extension');
    expect(packageJson.scripts['build:extension:firefox']).not.toContain(
      'prebuild:extension:firefox'
    );
    expect(packageJson.scripts['build:all']).toContain('build:extension:ci');
  });

  it('builds and smoke-tests both extension targets in CI', () => {
    expect(ciWorkflow).toContain('pnpm build:extension:ci');
    expect(ciWorkflow).toContain('pnpm build:extension:firefox:ci');
    expect(ciWorkflow).toContain('pnpm test:e2e:extension');
    expect(ciWorkflow).toMatch(/playwright install --with-deps (?:chromium firefox|firefox chromium)/);
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
