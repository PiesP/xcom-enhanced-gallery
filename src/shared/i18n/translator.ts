// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Translator — merged from TranslationCatalog, Translator, and translation-utils.
 * All language bundles are pre-loaded in the single-file userscript.
 */

import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';
import { LANGUAGE_CODES } from '@shared/constants/i18n/language-types';
import { en } from '@shared/constants/i18n/languages/en';
import { ja } from '@shared/constants/i18n/languages/ja';
import { ko } from '@shared/constants/i18n/languages/ko';
import { resolveNestedPath } from '@shared/utils/object/path';
import type { TranslationBundleInput, TranslationKey, TranslationParams } from './types';

export const TRANSLATION_REGISTRY: Partial<Record<BaseLanguageCode, LanguageStrings>> = {
  en,
  ko,
  ja,
} as const;

export const DEFAULT_LANGUAGE: BaseLanguageCode = 'en';

interface TranslatorOptions {
  readonly bundles?: TranslationBundleInput;
  readonly fallbackLanguage?: BaseLanguageCode;
}

export class Translator {
  private readonly bundles: Partial<Record<BaseLanguageCode, LanguageStrings>> = {};
  private readonly fallbackLanguage: BaseLanguageCode;

  constructor(options: TranslatorOptions = {}) {
    const { bundles = TRANSLATION_REGISTRY, fallbackLanguage = DEFAULT_LANGUAGE } = options;
    this.fallbackLanguage = fallbackLanguage;
    for (const [lang, strings] of Object.entries(bundles) as Array<
      [BaseLanguageCode, LanguageStrings | undefined]
    >) {
      if (strings) this.bundles[lang] = strings;
    }
    if (!this.bundles[this.fallbackLanguage]) {
      throw new Error(`Missing fallback language bundle: ${this.fallbackLanguage}`);
    }
  }

  get languages(): readonly BaseLanguageCode[] {
    return LANGUAGE_CODES;
  }

  public translate(
    language: BaseLanguageCode,
    key: TranslationKey,
    params?: TranslationParams
  ): string {
    const strings = this.bundles[language] ?? this.bundles[this.fallbackLanguage]!;
    const template = resolveNestedPath<string>(strings, key);
    if (!template) return key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, placeholder) =>
      Object.hasOwn(params, placeholder) ? String(params[placeholder]) : match
    );
  }
}
