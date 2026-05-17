/**
 * @fileoverview Settings Controls Type Definitions
 * @module shared/components/ui/Settings/SettingsControls.types
 * @description Type definitions for theme and language settings controls component
 *
 * @see {@link SettingsControls} - Component implementation
 */

import type { BaseComponentProps } from '@shared/types/component.types';
import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';
import type { ThemeSetting } from '@shared/services/theme-service';

/** Re-export for backwards compatibility */
export type ThemeOption = ThemeSetting;

/**
 * Union type for language setting options
 */
export type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

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
