import { globSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfigFromFile } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

interface CoveragePolicy {
  readonly include?: string[];
  readonly exclude?: string[];
  readonly thresholds?: Partial<Record<'statements' | 'branches' | 'functions' | 'lines', number>>;
}

let coverage: CoveragePolicy | undefined;
const root = resolve(import.meta.dirname, '../../..');
const unitCoverageExemptions = [
  'src/**/*.d.ts',
  'src/main.ts',
  'src/extension/content.ts',
  'src/extension/extension-message-types.ts',
  'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.types.ts',
  'src/platform/types.ts',
  'src/shared/components/**/*.types.ts',
  'src/shared/hooks/**/*.types.ts',
  'src/shared/i18n/types.ts',
  'src/shared/services/media/types.ts',
  'src/shared/types/core/cookie.types.ts',
  'src/shared/types/lifecycle.types.ts',
  'src/shared/types/settings.types.ts',
  'src/shared/types/toolbar.types.ts',
];
const criticalRuntimeSources = [
  'src/shared/services/media/twitter-api-client.ts',
  'src/shared/services/media-extraction/media-extraction-service.ts',
  'src/features/gallery/gallery-app.ts',
];
const coverageMetrics = ['statements', 'branches', 'functions', 'lines'] as const;

function measuredSourceFiles(policy: CoveragePolicy): string[] {
  return [
    ...new Set(
      globSync(policy.include ?? [], {
        cwd: root,
        exclude: policy.exclude ?? [],
      }).map((file) => file.replaceAll('\\', '/'))
    ),
  ].sort();
}

function coversCompleteRuntimeSet(policy: CoveragePolicy): boolean {
  const expected = [
    ...new Set(
      globSync(['src/**/*.{ts,tsx}'], {
        cwd: root,
        exclude: unitCoverageExemptions,
      }).map((file) => file.replaceAll('\\', '/'))
    ),
  ].sort();
  return measuredSourceFiles(policy).join('\n') === expected.join('\n');
}

beforeAll(async () => {
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'test' },
    resolve(root, 'vitest.config.ts')
  );
  coverage = (loaded?.config as { test?: { coverage?: CoveragePolicy } } | undefined)?.test
    ?.coverage;
});

describe('Vitest coverage gate', () => {
  it('measures all runtime source files instead of only imported modules', () => {
    expect(coverage).toBeDefined();
    expect(coversCompleteRuntimeSet(coverage ?? {})).toBe(true);
    expect(measuredSourceFiles(coverage ?? {})).toEqual(expect.arrayContaining(criticalRuntimeSources));
  });

  it.each(criticalRuntimeSources)('rejects excluding critical runtime source %s', (source) => {
    expect(
      coversCompleteRuntimeSet({
        ...coverage,
        exclude: [...(coverage?.exclude ?? []), source],
      })
    ).toBe(false);
  });

  it('rejects excluding every critical runtime source', () => {
    expect(
      coversCompleteRuntimeSet({
        ...coverage,
        exclude: [...(coverage?.exclude ?? []), ...criticalRuntimeSources],
      })
    ).toBe(false);
  });

  it('rejects broad source exclusions', () => {
    expect(coversCompleteRuntimeSet({ ...coverage, exclude: ['src/**'] })).toBe(false);
  });

  it('accepts equivalent include globs that resolve to the same runtime files', () => {
    expect(
      coversCompleteRuntimeSet({
        ...coverage,
        include: ['src/**/*.ts', 'src/**/*.tsx'],
      })
    ).toBe(true);
  });

  it.each(coverageMetrics)(
    'enforces a meaningful %s threshold against the complete source set',
    (metric) => {
      expect(coverage?.thresholds?.[metric]).toBeGreaterThanOrEqual(30);
    }
  );
});
