import { DEFAULT_LANGUAGE } from "@shared/constants/i18n/translation-registry";
import {
  isBaseLanguageCode,
  type BaseLanguageCode,
} from "@shared/constants/i18n/language-types";

/**
 * Browser environment snapshot surfaced to the userscript layer.
 * Focuses exclusively on user-facing concerns: theme preference and language.
 */
export interface EnvironmentInfo {
  /** Currently preferred color scheme */
  colorScheme: "light" | "dark";
  /** Best-effort ISO language code resolved from the browser */
  language: BaseLanguageCode;
}

const GM_API_CHECKS: Record<string, (gm: Record<string, unknown>) => boolean> =
  {
    getValue: (gm) => typeof gm.GM_getValue === "function",
    setValue: (gm) => typeof gm.GM_setValue === "function",
    download: (gm) => typeof gm.GM_download === "function",
    notification: (gm) => typeof gm.GM_notification === "function",
    setClipboard: (gm) => typeof gm.GM_setClipboard === "function",
    registerMenuCommand: (gm) =>
      typeof gm.GM_registerMenuCommand === "function",
    deleteValue: (gm) => typeof gm.GM_deleteValue === "function",
    listValues: (gm) => typeof gm.GM_listValues === "function",
    cookie: (gm) =>
      typeof (gm.GM_cookie as { list?: unknown } | undefined)?.list ===
      "function",
  };

function detectColorScheme(): "light" | "dark" {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "light";
  }

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function detectLanguageCode(): BaseLanguageCode {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.language === "string"
  ) {
    const candidate = navigator.language.slice(0, 2).toLowerCase();
    if (isBaseLanguageCode(candidate)) {
      return candidate;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function detectEnvironment(): EnvironmentInfo {
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
 * - 'getValue', 'setValue', 'download', 'notification', 'setClipboard'
 * - 'registerMenuCommand', 'deleteValue', 'listValues'
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
export function isGMAPIAvailable(apiName: string): boolean {
  const gm = globalThis as Record<string, unknown>;
  const checker = GM_API_CHECKS[apiName];
  if (!checker) {
    return false;
  }

  try {
    return checker(gm);
  } catch {
    return false;
  }
}
