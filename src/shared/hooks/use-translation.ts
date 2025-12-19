import { getLanguageService } from '@shared/container/service-accessors';
import type { TranslationKey, TranslationParams } from '@shared/i18n';
import { createSignal, onCleanup } from 'solid-js';

export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

export function useTranslation(): Translate {
  const languageService = getLanguageService();
  const [revision, setRevision] = createSignal(0);

  const unsubscribe = languageService.onLanguageChange(() => {
    setRevision((value) => value + 1);
  });

  onCleanup(() => {
    unsubscribe();
  });

  return (key, params) => {
    revision();
    return languageService.translate(key, params);
  };
}
