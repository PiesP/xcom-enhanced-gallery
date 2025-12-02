import { TRANSLATION_REGISTRY, DEFAULT_LANGUAGE, getLanguageStrings } from '@/shared/constants/i18n/translation-registry';
import { LANGUAGE_CODES } from '@/shared/constants/i18n/language-types';
import { en } from '@/shared/constants/i18n/languages/en';
import { ja } from '@/shared/constants/i18n/languages/ja';
import { ko } from '@/shared/constants/i18n/languages/ko';

describe('translation-registry', () => {
  it('contains all supported languages and returns default language', () => {
    const enStrings = getLanguageStrings('en');
    const koStrings = getLanguageStrings('ko');
    const jaStrings = getLanguageStrings('ja');

    expect(typeof enStrings.toolbar.previous).toBe('string');
    expect(typeof koStrings.toolbar.previous).toBe('string');
    expect(typeof jaStrings.toolbar.previous).toBe('string');

    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('exports a registry for supported languages', () => {
    expect(Object.keys(TRANSLATION_REGISTRY)).toEqual(expect.arrayContaining(Array.from(LANGUAGE_CODES)));
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('registers language objects from the languages directory', () => {
    expect(TRANSLATION_REGISTRY.en).toBe(en);
    expect(TRANSLATION_REGISTRY.ko).toBe(ko);
    expect(TRANSLATION_REGISTRY.ja).toBe(ja);
  });

  it('should be frozen (immutable)', () => {
    expect(Object.isFrozen(TRANSLATION_REGISTRY)).toBe(true);
  });

  describe('getLanguageStrings helper', () => {
    it('returns strings for all codes', () => {
      for (const code of LANGUAGE_CODES) {
        const strings = getLanguageStrings(code as any);
        expect(strings).toBeDefined();
        expect(typeof strings.toolbar.previous).toBe('string');
        expect(typeof strings.settings.title).toBe('string');
        expect(typeof strings.messages.gallery.emptyTitle).toBe('string');
      }
    });
  });
});
// end
