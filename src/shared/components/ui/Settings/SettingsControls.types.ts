/**
 * @fileoverview Settings Controls Type Definitions
 * @module shared/components/ui/Settings/SettingsControls.types
 * @description Type definitions for theme and language settings controls component
 *
 * @see {@link ./SettingsControls.tsx} - Component implementation
 */

import type { BaseComponentProps } from '@shared/types/component.types';
import type { Accessor } from 'solid-js';

/**
 * Union type for theme setting options
 */
export type ThemeOption = 'auto' | 'light' | 'dark';

/**
 * Union type for language setting options
 */
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

/**
 * Utility type for values that can be static or reactive accessors
 *
 * @template T - The value type
 */
export type MaybeAccessor<T> = T | Accessor<T>;

/**
 * Props for SettingsControls component
 *
 * @property currentTheme - Current theme setting value (static or accessor)
 * @property currentLanguage - Current language setting value (static or accessor)
 * @property onThemeChange - Event handler for theme selection change
 * @property onLanguageChange - Event handler for language selection change
 * @property compact - Enable compact layout for toolbar mode (optional)
 */
export interface SettingsControlsProps extends BaseComponentProps {
  readonly currentTheme: MaybeAccessor<ThemeOption>;
  readonly currentLanguage: MaybeAccessor<LanguageOption>;
  readonly onThemeChange: (event: Event) => void;
  readonly onLanguageChange: (event: Event) => void;
  readonly compact?: boolean;
}
