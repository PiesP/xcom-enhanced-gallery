import { getLanguageService } from '@shared/container/service-accessors';
import type { TranslationKey, TranslationParams } from '@shared/i18n/types';
import { createSignal, onCleanup } from 'solid-js';

/**
 * Translation function type
 * @param key Translation key to look up
 * @param params Optional interpolation parameters
 * @returns Localized string
 */
type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/**
 * Custom hook for reactive translations (auto-updates on language change)
 * @returns Translation function that updates when language changes
 */
export function useTranslation(): Translate {
  const languageService = getLanguageService();
  const [revision, setRevision] = createSignal<number>(0);

  const unsubscribe = languageService.onLanguageChange(() => {
    setRevision((value) => value + 1);
  });

  onCleanup(unsubscribe);

  return (key: TranslationKey, params?: TranslationParams): string => {
    revision(); // Track dependency for reactivity
    return languageService.translate(key, params);
  };
}
