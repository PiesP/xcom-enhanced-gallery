// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Translator — merged from TranslationCatalog, Translator, and translation-utils.
 * All language bundles are pre-loaded in the single-file userscript.
 */

import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
import { ar } from '@shared/constants/i18n/languages/ar';
import { en } from '@shared/constants/i18n/languages/en';
import { es } from '@shared/constants/i18n/languages/es';
import { ja } from '@shared/constants/i18n/languages/ja';
import { ko } from '@shared/constants/i18n/languages/ko';
import { zhCn } from '@shared/constants/i18n/languages/zh-CN';
import { resolveNestedPath } from '@shared/utils/object/path';
import type { TranslationBundleInput, TranslationKey, TranslationParams } from './types';

export const TRANSLATION_REGISTRY: Partial<Record<BaseLanguageCode, LanguageStrings>> = {
  en,
  ko,
  ja,
  'zh-CN': zhCn,
  es,
  ar,
} as const;

export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

interface TranslatorBundleOptions {
  readonly bundles?: TranslationBundleInput;
  readonly fallbackLanguage?: BaseLanguageCode;
}

interface Translator {
  readonly languages: readonly BaseLanguageCode[];
  translate(language: BaseLanguageCode, key: TranslationKey, params?: TranslationParams): string;
}

/** Create a translator instance with the given language bundles. */
export function createTranslator(options: TranslatorBundleOptions = {}): Translator {
  const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = DEFAULT_LANGUAGE } = options;

  const bundleMap: Partial<Record<BaseLanguageCode, LanguageStrings>> = {};
  for (const [lang, strings] of Object.entries(bundles) as Array<
    [BaseLanguageCode, LanguageStrings | undefined]
  >) {
    if (strings) bundleMap[lang] = strings;
  }

  if (!bundleMap[fallbackLanguage]) {
    throw new Error(`Missing fallback language bundle: ${fallbackLanguage}`);
  }

  return {
    get languages(): readonly BaseLanguageCode[] {
      return LANGUAGE_CODES;
    },

    translate(language: BaseLanguageCode, key: TranslationKey, params?: TranslationParams): string {
      const strings = bundleMap[language] ?? bundleMap[fallbackLanguage]!;
      const template = resolveNestedPath<string>(strings, key);
      if (!template) return key;
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, placeholder) =>
        Object.hasOwn(params, placeholder) ? String(params[placeholder]) : match
      );
    },
  };
}
