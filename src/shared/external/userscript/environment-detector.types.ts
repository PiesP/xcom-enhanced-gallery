/**
 * @fileoverview Browser environment and GM API type definitions
 * @description Type definitions for environment detection
 */

import type { BaseLanguageCode } from '@shared/constants/i18n/i18n.types';
import type { ResolvedGMAPIs } from '@shared/external/userscript/adapter';

/**
 * Browser environment snapshot (theme and language preferences)
 */
export interface EnvironmentInfo {
  colorScheme: 'light' | 'dark';
  language: BaseLanguageCode;
}

/**
 * Tampermonkey API names for capability detection
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
 * Type-safe detector functions for GM API availability
 */
export type GMAPIChecks = Record<GMAPIName, (gm: ResolvedGMAPIs) => boolean>;
