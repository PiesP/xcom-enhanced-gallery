import { LANGUAGE_CODES, isBaseLanguageCode } from '@shared/constants/i18n/language-types';

describe('language-types', () => {
  it('accepts every defined base language code', () => {
    LANGUAGE_CODES.forEach(code => {
      expect(isBaseLanguageCode(code)).toBe(true);
    });
  });

  it('rejects invalid strings', () => {
    ['fr', 'EN', '', 'jp'].forEach(value => {
      expect(isBaseLanguageCode(value)).toBe(false);
    });
  });

  it('rejects nullish values', () => {
    expect(isBaseLanguageCode(null)).toBe(false);
    expect(isBaseLanguageCode(undefined)).toBe(false);
  });
});
