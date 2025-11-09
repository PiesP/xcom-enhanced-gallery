import { describe, expect, it } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

import {
  LANGUAGE_CODES,
  isBaseLanguageCode,
  getLanguageStrings,
  type BaseLanguageCode,
} from '@shared/i18n';

describe('i18n translation registry', () => {
  setupGlobalTestIsolation();

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
