import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};
const ciWorkflow = readFileSync(resolve(root, '.github/workflows/ci.yaml'), 'utf8');

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

  it('runs the pinned tsx dependency through pnpm', () => {
    expect(packageJson.devDependencies.tsx).toMatch(/^\d+\.\d+\.\d+$/);

    const tsxScripts = Object.values(packageJson.scripts).filter((script) =>
      /(?:npx|pnpm exec) tsx\b/.test(script)
    );
    expect(tsxScripts.length).toBeGreaterThan(0);
    for (const script of tsxScripts) {
      expect(script).toContain('pnpm exec tsx');
      expect(script).not.toContain('npx tsx');
    }
  });

  it('builds and smoke-tests both extension targets in CI', () => {
    expect(ciWorkflow).toContain('pnpm build:extension:ci');
    expect(ciWorkflow).toContain('pnpm build:extension:firefox:ci');
    expect(ciWorkflow).toContain('pnpm test:e2e:extension');
    expect(ciWorkflow).toMatch(/playwright install --with-deps (?:chromium firefox|firefox chromium)/);
  });
});
