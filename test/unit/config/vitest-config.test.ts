import { resolve } from 'node:path';
import { loadConfigFromFile } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

interface CoveragePolicy {
  readonly include?: string[];
  readonly exclude?: string[];
  readonly thresholds?: Partial<Record<'statements' | 'branches' | 'functions' | 'lines', number>>;
}

let coverage: CoveragePolicy | undefined;

beforeAll(async () => {
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'test' },
    resolve(import.meta.dirname, '../../../vitest.config.ts')
  );
  coverage = (loaded?.config as { test?: { coverage?: CoveragePolicy } } | undefined)?.test
    ?.coverage;
});

describe('Vitest coverage gate', () => {
  it('measures all runtime source files instead of only imported modules', () => {
    expect(coverage?.include).toEqual(['src/**/*.{ts,tsx}']);
    expect(coverage?.exclude).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining('twitter-api-client'),
        expect.stringContaining('media-extraction'),
        expect.stringContaining('gallery-app'),
      ])
    );
  });

  it.each(['statements', 'branches', 'functions', 'lines'])(
    'enforces a meaningful %s threshold against the complete source set',
    (metric) => {
      expect(coverage?.thresholds?.[metric]).toBeGreaterThanOrEqual(30);
    }
  );
});
