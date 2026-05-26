// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Settings Controls Type Definitions
 * @module shared/components/ui/Settings/SettingsControls.types
 * @description Type definitions for theme and language settings controls component
 *
 * @see {@link SettingsControls} - Component implementation
 */

/** Theme setting option */
export type ThemeOption = 'auto' | 'light' | 'dark';

import type { MaybeAccessor } from '@shared/utils/solid/accessor-utils';

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
export interface SettingsControlsProps {
  readonly currentTheme: MaybeAccessor<ThemeOption>;
  readonly currentLanguage: MaybeAccessor<LanguageOption>;
  readonly onThemeChange: (event: Event) => void;
  readonly onLanguageChange: (event: Event) => void;
  readonly compact?: boolean;
  /** Test identifier */
  readonly 'data-testid'?: string | undefined;
}
