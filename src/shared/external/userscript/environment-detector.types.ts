import type { BaseLanguageCode } from '@shared/constants/i18n/language-types';
import type { ResolvedGMAPIs } from '@shared/external/userscript/adapter';

export interface EnvironmentInfo {
  colorScheme: 'light' | 'dark';
  language: BaseLanguageCode;
}

export type GMAPIName =
  | 'getValue'
  | 'setValue'
  | 'download'
  | 'notification'
  | 'deleteValue'
  | 'listValues'
  | 'cookie';

export type GMAPIChecks = Record<GMAPIName, (gm: ResolvedGMAPIs) => boolean>;
