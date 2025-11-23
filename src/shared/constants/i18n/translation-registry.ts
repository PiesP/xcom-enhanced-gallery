import { type BaseLanguageCode, type LanguageStrings } from "./language-types";
import { en } from "./languages/en";
import { ko } from "./languages/ko";
import { ja } from "./languages/ja";

export const TRANSLATION_REGISTRY: Record<BaseLanguageCode, LanguageStrings> =
  Object.freeze({
    en,
    ko,
    ja,
  });

export const DEFAULT_LANGUAGE: BaseLanguageCode = "en";

export function getLanguageStrings(
  language: BaseLanguageCode,
): LanguageStrings {
  return TRANSLATION_REGISTRY[language];
}
