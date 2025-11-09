/**
 * Environment detection helpers for the userscript layer.
 * Identifies runtime context and available GM_* APIs so services can react safely.
 */

/**
 * Information about the current execution environment
 *
 * Provides detailed detection results for environment type, available APIs, and capabilities
 * @internal
 */
export interface EnvironmentInfo {
  /** True if running as a Tampermonkey userscript */
  isUserscriptEnvironment: boolean;

  /** True if running in a test framework (Vitest, Playwright, etc.) */
  isTestEnvironment: boolean;

  /** True if running as a browser extension */
  isBrowserExtension: boolean;

  /** True if running in plain browser console */
  isBrowserConsole: boolean;

  /** List of available Tampermonkey APIs */
  availableGMAPIs: string[];

  /** Human-readable environment name */
  environment: 'userscript' | 'test' | 'extension' | 'console';
}

const GM_API_MAP = {
  getValue: 'GM_getValue',
  setValue: 'GM_setValue',
  download: 'GM_download',
  notification: 'GM_notification',
  setClipboard: 'GM_setClipboard',
  registerMenuCommand: 'GM_registerMenuCommand',
  deleteValue: 'GM_deleteValue',
  listValues: 'GM_listValues',
} as const;

const GM_API_KEYS = Object.keys(GM_API_MAP) as Array<keyof typeof GM_API_MAP>;
const USERSCRIPT_FLAGS = ['__TAMPERMONKEY__'] as const;
const TEST_FLAGS = [
  '__VITEST__',
  '__PLAYWRIGHT__',
  'PLAYWRIGHT_TEST_UTILITIES',
  '__TEST__',
] as const;

type UserscriptEnvironment = EnvironmentInfo['environment'];

export function detectEnvironment(): EnvironmentInfo {
  const gm = globalThis as Record<string, unknown> & {
    unsafeWindow?: unknown;
    chrome?: { runtime?: { id?: string } };
    browser?: { runtime?: { id?: string } };
  };

  const availableGMAPIs = GM_API_KEYS.filter(key => typeof gm[GM_API_MAP[key]] === 'function');

  const hasUserscriptSignals =
    availableGMAPIs.length > 0 ||
    USERSCRIPT_FLAGS.some(flag => Boolean(gm[flag])) ||
    Boolean(gm.unsafeWindow);

  const processRef =
    typeof process === 'undefined'
      ? undefined
      : (process as { env?: Record<string, string | undefined>; version?: string });

  const isTestFramework = TEST_FLAGS.some(flag => Boolean(gm[flag]));
  const isTestRuntime = Boolean(processRef?.env?.NODE_ENV === 'test' || processRef?.version);
  const isTestEnvironment = isTestFramework || isTestRuntime;

  const isBrowserExtension = Boolean(gm.chrome?.runtime?.id || gm.browser?.runtime?.id);

  const environment: UserscriptEnvironment = hasUserscriptSignals
    ? 'userscript'
    : isBrowserExtension && !isTestEnvironment
      ? 'extension'
      : isTestEnvironment
        ? 'test'
        : 'console';

  return {
    isUserscriptEnvironment: environment === 'userscript',
    isTestEnvironment: environment === 'test',
    isBrowserExtension: environment === 'extension',
    isBrowserConsole: environment === 'console',
    availableGMAPIs,
    environment,
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
  const gmFunctionName = GM_API_MAP[apiName as keyof typeof GM_API_MAP];
  if (!gmFunctionName) return false;

  return typeof gm[gmFunctionName] === 'function';
}

/**
 * Get a human-readable description of the environment
 *
 * Generates descriptive text about the detected environment and available APIs.
 * Useful for logging and debugging environment detection.
 *
 * @param env - EnvironmentInfo object from detectEnvironment()
 * @returns Descriptive string about the environment (e.g., "Tampermonkey environment (6 APIs available: ...)")
 * @internal
 *
 * @example
 * ```typescript
 * const env = detectEnvironment();
 * console.log(getEnvironmentDescription(env));
 * // Output: "Tampermonkey environment (6 APIs available: getValue, setValue, download, ...)"
 * ```
 */
export function getEnvironmentDescription(env: EnvironmentInfo): string {
  const apiList = env.availableGMAPIs.join(', ') || 'none';

  switch (env.environment) {
    case 'userscript':
      return `Tampermonkey environment (${env.availableGMAPIs.length} APIs available: ${apiList})`;
    case 'test':
      return `Test environment (${env.availableGMAPIs.length} APIs available: ${apiList})`;
    case 'extension':
      return `Browser extension environment (${env.availableGMAPIs.length} APIs available: ${apiList})`;
    case 'console':
    default:
      return 'Plain browser console (no Tampermonkey APIs available)';
  }
}
