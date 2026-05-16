import type { BaseLanguageCode } from '@shared/constants/i18n/language-types';

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
