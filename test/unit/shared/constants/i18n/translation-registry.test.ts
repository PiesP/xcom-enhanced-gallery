import {
  DEFAULT_LANGUAGE,
  getLanguageStrings,
  LAZY_LANGUAGE_LOADERS,
  TRANSLATION_REGISTRY,
} from '@/shared/constants/i18n/translation-registry';
import { en } from '@/shared/constants/i18n/languages/en';

describe('translation-registry', () => {
  it('contains default language in bundle and returns default language', () => {
    const enStrings = getLanguageStrings('en');

    expect(typeof enStrings.toolbar.previous).toBe('string');
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('exports a registry with default language only (others are lazy-loaded)', () => {
    // Only 'en' is bundled statically
    expect(Object.keys(TRANSLATION_REGISTRY)).toContain('en');
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('registers default language from the languages directory', () => {
    expect(TRANSLATION_REGISTRY.en).toBe(en);
  });

  it('provides lazy loaders for non-default languages', () => {
    expect(typeof LAZY_LANGUAGE_LOADERS.ko).toBe('function');
    expect(typeof LAZY_LANGUAGE_LOADERS.ja).toBe('function');
  });

  it('should be frozen (immutable)', () => {
    expect(Object.isFrozen(TRANSLATION_REGISTRY)).toBe(true);
  });

  describe('getLanguageStrings helper', () => {
    it('returns strings for bundled language', () => {
      const strings = getLanguageStrings('en');
      expect(strings).toBeDefined();
      expect(typeof strings.toolbar.previous).toBe('string');
      expect(typeof strings.settings.title).toBe('string');
      expect(typeof strings.messages.gallery.emptyTitle).toBe('string');
    });

    it('falls back to default language for non-loaded languages', () => {
      // Before lazy loading, ko/ja should fallback to en
      const koStrings = getLanguageStrings('ko');
      const jaStrings = getLanguageStrings('ja');
      const enStrings = getLanguageStrings('en');

      // Should return en strings as fallback
      expect(koStrings).toBe(enStrings);
      expect(jaStrings).toBe(enStrings);
    });
  });

  describe('lazy language loaders', () => {
    it('can load ko language on demand', async () => {
      const koStrings = await LAZY_LANGUAGE_LOADERS.ko();
      expect(koStrings).toBeDefined();
      expect(koStrings.toolbar.previous).toBe('이전');
    });

    it('can load ja language on demand', async () => {
      const jaStrings = await LAZY_LANGUAGE_LOADERS.ja();
      expect(jaStrings).toBeDefined();
      expect(jaStrings.toolbar.previous).toBe('前へ');
    });
  });
});
// end
