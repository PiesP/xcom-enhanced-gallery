/**
 * @fileoverview Environment Detection for Userscript Execution
 * @description Detects the execution environment (Tampermonkey, test, browser extension, console)
 * and identifies available Tampermonkey APIs.
 *
 * This helps distinguish between:
 * - Tampermonkey environment (full GM API support)
 * - Test environment (Vitest/Playwright, mock support)
 * - Browser extension environment
 * - Plain browser console (no APIs)
 *
 * @version 1.1.0
 * @phase 318.1 - GM_xmlHttpRequest 제거 (MV3 불가)
 */

/**
 * Information about the current execution environment
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

/**
 * Detects the current execution environment
 *
 * @returns EnvironmentInfo with environment detection results
 *
 * @example
 * ```typescript
 * const env = detectEnvironment();
 * if (env.isUserscriptEnvironment) {
 *   // Use Tampermonkey APIs directly
 *   console.log('Available APIs:', env.availableGMAPIs);
 * } else if (env.isTestEnvironment) {
 *   // Use mock/stub implementations
 *   console.log('Test environment detected');
 * }
 * ```
 */
export function detectEnvironment(): EnvironmentInfo {
  const gm = globalThis as Record<string, unknown>;

  // Signal 1: Tampermonkey direct markers
  const tampermonkeyInstalled = !!(
    gm.GM_getValue ||
    gm.GM_setValue ||
    gm.GM_download ||
    gm.GM_notification ||
    gm.GM_setClipboard ||
    gm.__TAMPERMONKEY__ ||
    (gm as Record<string, unknown> & { unsafeWindow?: unknown }).unsafeWindow
  );

  // Signal 2: Test framework markers
  const testFramework = !!(
    gm.__VITEST__ ||
    gm.__PLAYWRIGHT__ ||
    gm.PLAYWRIGHT_TEST_UTILITIES ||
    gm.__TEST__ ||
    (typeof process !== 'undefined' &&
      typeof (process as unknown as { env?: { NODE_ENV?: string } }).env === 'object' &&
      (process as unknown as { env?: { NODE_ENV?: string } }).env?.NODE_ENV === 'test')
  );

  // Signal 3: Browser extension markers
  const browserExtension = !!(
    (gm.chrome as unknown as { runtime?: { id?: string } } | undefined)?.runtime?.id ||
    (gm.browser as unknown as { runtime?: { id?: string } } | undefined)?.runtime?.id
  );

  // Signal 4: Node.js environment
  const isNode =
    typeof process !== 'undefined' && !!(process as unknown as { version?: string }).version;

  // Collect available GM APIs
  const availableGMAPIs: string[] = [];
  if (gm.GM_getValue) availableGMAPIs.push('getValue');
  if (gm.GM_setValue) availableGMAPIs.push('setValue');
  if (gm.GM_download) availableGMAPIs.push('download');
  if (gm.GM_notification) availableGMAPIs.push('notification');
  if (gm.GM_setClipboard) availableGMAPIs.push('setClipboard');
  if (gm.GM_registerMenuCommand) availableGMAPIs.push('registerMenuCommand');
  if (gm.GM_deleteValue) availableGMAPIs.push('deleteValue');
  if (gm.GM_listValues) availableGMAPIs.push('listValues');

  // Determine environment type
  let environment: EnvironmentInfo['environment'] = 'console';
  let isUserscript = false;
  let isTest = false;
  let isExtension = false;
  let isConsole = false;

  if (tampermonkeyInstalled && !testFramework) {
    environment = 'userscript';
    isUserscript = true;
  } else if (testFramework || isNode) {
    environment = 'test';
    isTest = true;
  } else if (browserExtension) {
    environment = 'extension';
    isExtension = true;
  } else {
    environment = 'console';
    isConsole = true;
  }

  return {
    isUserscriptEnvironment: isUserscript,
    isTestEnvironment: isTest,
    isBrowserExtension: isExtension,
    isBrowserConsole: isConsole,
    availableGMAPIs,
    environment,
  };
}

/**
 * Check if a specific Tampermonkey API is available
 *
 * @param apiName - Name of the API to check (e.g., 'xmlHttpRequest', 'download')
 * @returns True if the API is available
 *
 * @example
 * ```typescript
 * if (isGMAPIAvailable('xmlHttpRequest')) {
 *   // Use HttpRequestService
 * }
 * ```
 */
export function isGMAPIAvailable(apiName: string): boolean {
  const gm = globalThis as Record<string, unknown>;
  const apiMap: Record<string, string> = {
    getValue: 'GM_getValue',
    setValue: 'GM_setValue',
    download: 'GM_download',
    notification: 'GM_notification',
    setClipboard: 'GM_setClipboard',
    registerMenuCommand: 'GM_registerMenuCommand',
    deleteValue: 'GM_deleteValue',
    listValues: 'GM_listValues',
  };

  const gmFunctionName = apiMap[apiName];
  if (!gmFunctionName) return false;

  return typeof gm[gmFunctionName] === 'function';
}

/**
 * Get a human-readable description of the environment
 *
 * @param env - EnvironmentInfo object
 * @returns Descriptive string about the environment
 *
 * @example
 * ```typescript
 * const env = detectEnvironment();
 * console.log(getEnvironmentDescription(env));
 * // Output: "Tampermonkey environment (6 APIs available: getValue, setValue, ...)"
 * ```
 */
export function getEnvironmentDescription(env: EnvironmentInfo): string {
  const apiList = env.availableGMAPIs.join(', ') || 'none';

  const descriptions: Record<EnvironmentInfo['environment'], string> = {
    userscript: `Tampermonkey environment (${env.availableGMAPIs.length} APIs available: ${apiList})`,
    test: `Test environment (${env.availableGMAPIs.length} APIs available: ${apiList})`,
    extension: `Browser extension environment (${env.availableGMAPIs.length} APIs available: ${apiList})`,
    console: 'Plain browser console (no Tampermonkey APIs available)',
  };

  return descriptions[env.environment];
}
