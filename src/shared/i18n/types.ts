import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/i18n.types';

/**
 * Produces dot-notation union of every leaf string in LanguageStrings
 * @typeParam TValue Source language structure
 * @typeParam TPrefix Accumulated key prefix
 * @typeParam TDepth Recursion depth tracker
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
 * Flattened union of all translation key paths in dot notation
 */
export type TranslationKey = DotNestedKeys<LanguageStrings>;

/**
 * Parameters for translation string interpolation
 */
export type TranslationParams = Record<string, string | number>;

/**
 * Mapping of all language codes to their translation bundles
 */
type TranslationBundles = Record<BaseLanguageCode, LanguageStrings>;

/**
 * Input type for partial translation bundle updates
 */
export type TranslationBundleInput = Partial<TranslationBundles>;
