import { getPreactHooks } from '@shared/external/vendors';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type LanguageCode = 'en' | 'ko' | string;

export interface UseSettingsModalState {
  readonly currentTheme: ThemeMode;
  readonly currentLanguage: LanguageCode;
  readonly handleThemeChange: (theme: ThemeMode) => void;
  readonly handleLanguageChange: (lang: LanguageCode) => void;
}

export function useSettingsModal(initial?: {
  readonly theme?: ThemeMode;
  readonly language?: LanguageCode;
}): UseSettingsModalState {
  const { useState } = getPreactHooks();
  const [currentTheme, setTheme] = useState<ThemeMode>(initial?.theme ?? 'auto');
  const [currentLanguage, setLanguage] = useState<LanguageCode>(initial?.language ?? 'en');

  const handleThemeChange = (theme: ThemeMode): void => setTheme(theme);
  const handleLanguageChange = (lang: LanguageCode): void => setLanguage(lang);

  return { currentTheme, currentLanguage, handleThemeChange, handleLanguageChange } as const;
}

export default useSettingsModal;
