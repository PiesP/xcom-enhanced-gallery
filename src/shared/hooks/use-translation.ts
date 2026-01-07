import { getLanguageService } from '@shared/container/service-accessors';
import type { TranslationKey, TranslationParams } from '@shared/i18n/types';
import { createSignal, onCleanup } from 'solid-js';

/**
 * Translation function type.
 *
 * @param key - Translation key to look up
 * @param params - Optional interpolation parameters
 * @returns Localized string for the given key
 */
type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/**
 * Custom hook for reactive translations.
 *
 * Provides a translation function that automatically updates when the language changes.
 * Subscribes to language service changes and triggers re-evaluation when necessary.
 *
 * @returns Translation function that reactively updates on language changes
 *
 * @example
 * ```typescript
 * export function MyComponent(): JSXElement {
 *   const translate = useTranslation();
 *   return <div>{translate('msg.welcome')}</div>;
 * }
 * ```
 */
export function useTranslation(): Translate {
  const languageService = getLanguageService();
  const [revision, setRevision] = createSignal<number>(0);

  // Subscribe to language changes and increment revision counter
  const unsubscribe = languageService.onLanguageChange(() => {
    setRevision((value) => value + 1);
  });

  // Cleanup subscription when component unmounts
  onCleanup(unsubscribe);

  // Return translation function that tracks revision for reactivity
  return (key: TranslationKey, params?: TranslationParams): string => {
    revision(); // Track dependency for reactive updates
    return languageService.translate(key, params);
  };
}
