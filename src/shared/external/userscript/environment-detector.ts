import { type BaseLanguageCode, isBaseLanguageCode } from '@shared/constants/i18n/language-types';
import { DEFAULT_LANGUAGE } from '@shared/constants/i18n/translation-registry';
import { getResolvedGMAPIsCached, type ResolvedGMAPIs } from '@shared/external/userscript/adapter';

/**
 * Browser environment snapshot surfaced to the userscript layer.
 * Focuses exclusively on user-facing concerns: theme preference and language.
 */
interface EnvironmentInfo {
  /** Currently preferred color scheme */
  colorScheme: 'light' | 'dark';
  /** Best-effort ISO language code resolved from the browser */
  language: BaseLanguageCode;
}

type GMAPIName =
  | 'getValue'
  | 'setValue'
  | 'download'
  | 'notification'
  | 'deleteValue'
  | 'listValues'
  | 'cookie';

const GM_API_CHECKS: Record<GMAPIName, (gm: ResolvedGMAPIs) => boolean> = {
  getValue: (gm) => typeof gm.getValue === 'function',
  setValue: (gm) => typeof gm.setValue === 'function',
  download: (gm) => typeof gm.download === 'function',
  notification: (gm) => typeof gm.notification === 'function',
  deleteValue: (gm) => typeof gm.deleteValue === 'function',
  listValues: (gm) => typeof gm.listValues === 'function',
  cookie: (gm) => typeof gm.cookie?.list === 'function',
};

function detectColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function detectLanguageCode(): BaseLanguageCode {
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    const candidate = navigator.language.slice(0, 2).toLowerCase();
    if (isBaseLanguageCode(candidate)) {
      return candidate;
    }
  }

  return DEFAULT_LANGUAGE;
}

function detectEnvironment(): EnvironmentInfo {
  return {
    colorScheme: detectColorScheme(),
    language: detectLanguageCode(),
  };
}

/**
 * Check if a specific Tampermonkey API is available
 *
 * Maps simplified API names to full GM_* function names and verifies availability.
 *
 * **Supported API Names**:
 * - 'getValue', 'setValue', 'download', 'notification'
 * - 'deleteValue', 'listValues', 'cookie'
 *
 * @param apiName - Name of the API to check (e.g., 'download', 'notification')
 * @returns True if the API function is available and is a function
 * @internal
 *
 * @example
 * ```typescript
 * if (isGMAPIAvailable('download')) {
 *   // Can use DownloadService (Tampermonkey required)
 * }
 * ```
 */
export function isGMAPIAvailable(apiName: GMAPIName): boolean {
  const checker = GM_API_CHECKS[apiName];
  try {
    return checker(getResolvedGMAPIsCached());
  } catch {
    return false;
  }
}
