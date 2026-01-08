export const THEME_STORAGE_KEY = 'xeg-theme' as const;

export const THEME_DOM_ATTRIBUTE = 'data-theme' as const;

export type ThemeStorageKey = typeof THEME_STORAGE_KEY;

export type ThemeDomAttribute = typeof THEME_DOM_ATTRIBUTE;
