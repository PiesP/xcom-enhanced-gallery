import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Produces a dot-notation union of every leaf string inside `LanguageStrings`.
 * The depth guard prevents TypeScript from recursively expanding infinitely.
 *
 * @typeParam TValue - The source language structure
 * @typeParam TPrefix - Accumulated key prefix (internal use)
 * @typeParam TDepth - Recursion depth tracker (internal use)
 * @returns Union of dot-notation paths to leaf strings
 */
type DotNestedKeys<
  TValue,
  TPrefix extends string = '',
  TDepth extends ReadonlyArray<unknown> = [],
> = TValue extends string
  ? never
  : TDepth['length'] extends 8
    ? never
    : {
        [TKey in keyof TValue & string]: TValue[TKey] extends string
          ? `${TPrefix}${TKey}`
          : DotNestedKeys<TValue[TKey], `${TPrefix}${TKey}.`, [...TDepth, 1]>;
      }[keyof TValue & string];

/**
 * Flattened union of all translation key paths in dot notation.
 * Example: 'settings.theme.light' | 'settings.theme.dark'
 */
export type TranslationKey = DotNestedKeys<LanguageStrings>;

/**
 * Parameters for translation string interpolation.
 */
export type TranslationParams = Record<string, string | number>;

/**
 * Mapping of all language codes to their translation bundles.
 */
type TranslationBundles = Record<BaseLanguageCode, LanguageStrings>;

/**
 * Input type for partial translation bundle updates.
 * Allows providing translations for a subset of languages.
 */
export type TranslationBundleInput = Partial<TranslationBundles>;
