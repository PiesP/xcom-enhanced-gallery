// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import {
  getLanguageInfo,
  isBaseLanguageCode,
  LANGUAGE_CODES,
  LANGUAGE_OPTIONS,
} from '@shared/constants/i18n/language-types';
import { createTranslator, TRANSLATION_REGISTRY } from '@shared/i18n/translator';
import { describe, expect, it } from 'vite-plus/test';

const expectedLanguages = ['en', 'ko', 'ja', 'zh-CN', 'es', 'ar'] as const;

describe('XCOM language contract', () => {
  it('keeps the shipped choices complete, unique, and in product order', () => {
    expect(LANGUAGE_CODES).toEqual(expectedLanguages);
    expect(LANGUAGE_OPTIONS).toEqual(['auto', ...expectedLanguages]);
    expect(new Set(LANGUAGE_OPTIONS).size).toBe(LANGUAGE_OPTIONS.length);
    expect(Object.keys(TRANSLATION_REGISTRY).sort()).toEqual([...expectedLanguages].sort());
    for (const code of expectedLanguages) {
      expect(TRANSLATION_REGISTRY[code].tb.prev.length).toBeGreaterThan(0);
    }
  });

  it('uses native labels and direction metadata for every product language', () => {
    expect(expectedLanguages.map((code) => getLanguageInfo(code).name)).toEqual([
      'English',
      '한국어',
      '日本語',
      '简体中文',
      'Español',
      'العربية',
    ]);
    expect(expectedLanguages.map((code) => getLanguageInfo(code).dir)).toEqual([
      'ltr',
      'ltr',
      'ltr',
      'ltr',
      'ltr',
      'rtl',
    ]);
  });

  it('accepts only exact canonical product language codes as typed values', () => {
    for (const code of expectedLanguages) {
      expect(isBaseLanguageCode(code)).toBe(true);
    }
    for (const value of ['auto', 'EN', 'zh-cn', 'ja-JP', 'fr', '', null, undefined, 2]) {
      expect(isBaseLanguageCode(value)).toBe(false);
    }
  });

  it('retains English fallback for intentionally partial injected bundles', () => {
    const translator = createTranslator({ bundles: { en: TRANSLATION_REGISTRY.en } });
    expect(translator.translate('ko', 'tb.prev')).toBe('Previous');
    expect(translator.translate('ar', 'tb.prev')).toBe('Previous');
  });
});
