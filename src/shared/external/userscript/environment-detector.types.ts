import type { BaseLanguageCode } from '@shared/constants/i18n/language-types';
import type { ResolvedGMAPIs } from '@shared/external/userscript/adapter';

/**
 * Browser environment snapshot surfaced to the userscript layer.
 * Focuses exclusively on user-facing concerns: theme preference and language.
 */
export interface EnvironmentInfo {
  /** Currently preferred color scheme */
  colorScheme: 'light' | 'dark';
  /** Best-effort ISO language code resolved from the browser */
  language: BaseLanguageCode;
}

/**
 * Names of Tampermonkey APIs available for capability detection.
 * Maps to GM_* function names.
 */
export type GMAPIName =
  | 'getValue'
  | 'setValue'
  | 'download'
  | 'notification'
  | 'deleteValue'
  | 'listValues'
  | 'cookie';

/**
 * Type-safe detector functions for Tampermonkey API availability.
 * Each key maps to a checker function that validates if the corresponding API exists.
 */
export type GMAPIChecks = Record<GMAPIName, (gm: ResolvedGMAPIs) => boolean>;
