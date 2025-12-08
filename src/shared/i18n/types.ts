import type { BaseLanguageCode, LanguageStrings } from '@shared/constants/i18n/language-types';

/**
 * Produces a dot-notation union of every leaf string inside `LanguageStrings`.
 * The depth guard prevents TypeScript from recursively expanding infinitely.
 */
type DotNestedKeys<
  TValue,
  TPrefix extends string = '',
  TDepth extends ReadonlyArray<unknown> = [],
> = TValue extends string ? never
  : TDepth['length'] extends 8 ? never
  : {
    [TKey in keyof TValue & string]: TValue[TKey] extends string ? `${TPrefix}${TKey}`
      : DotNestedKeys<TValue[TKey], `${TPrefix}${TKey}.`, [...TDepth, 1]>;
  }[keyof TValue & string];

export type TranslationKey = DotNestedKeys<LanguageStrings>;
export type TranslationParams = Record<string, string | number>;
export type TranslationBundles = Record<BaseLanguageCode, LanguageStrings>;
export type TranslationBundleInput = Partial<TranslationBundles>;
