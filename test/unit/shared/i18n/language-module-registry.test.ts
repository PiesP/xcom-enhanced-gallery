import { describe, expect, it } from 'vitest';

import {
  moduleVersions,
  resolveModuleKeys,
  buildModuleVersions,
  LANGUAGE_CODES,
  isBaseLanguageCode,
  getLanguageStrings,
  type BaseLanguageCode,
} from '@shared/constants/i18n';

const EXPECTED_KEYS = [
  'language-types',
  'translation-registry',
  'languages/en',
  'languages/ja',
  'languages/ko',
];

describe('i18n translation registry', () => {
  it('exposes translations for every registered language', () => {
    const seen: BaseLanguageCode[] = [];

    for (const code of LANGUAGE_CODES) {
      const strings = getLanguageStrings(code);
      seen.push(code);

      expect(strings.toolbar.previous).toBeTruthy();
      expect(strings.settings.gallery.sectionTitle).toBeTruthy();
      expect(strings.messages.download.single.error.title).toBeTruthy();
    }

    expect(seen).toEqual(LANGUAGE_CODES);
  });

  it('guards base language detection', () => {
    expect(isBaseLanguageCode('en')).toBe(true);
    expect(isBaseLanguageCode('ko')).toBe(true);
    expect(isBaseLanguageCode('ja')).toBe(true);
    expect(isBaseLanguageCode('fr')).toBe(false);
  });
});

describe('i18n module version map', () => {
  it('covers every translation module', () => {
    const discovered = resolveModuleKeys();
    expect(discovered).toEqual(EXPECTED_KEYS);

    const actual = Object.keys(moduleVersions).sort();
    expect(actual).toEqual([...discovered].sort());
  });

  it('preserves existing version numbers when rebuilding map', () => {
    const existing = { 'languages/en': 4 };
    const result = buildModuleVersions(existing);
    expect(result['languages/en']).toBe(4);

    for (const key of EXPECTED_KEYS) {
      expect(result[key]).toBeGreaterThan(0);
    }
  });
});
