/**
 * Environment Detection for Userscript Execution
 *
 * **Purpose**: Detect runtime environment and available Tampermonkey APIs
 * **Architecture**: Distinguish between Tampermonkey, test, extension, and console environments
 * **Scope**: Identify execution context and GM_* API availability
 *
 * **Supported Environments**:
 * 1. **Userscript** (Tampermonkey/Greasemonkey/Violentmonkey): Full GM_* API support
 * 2. **Test** (Vitest/Playwright): Mock API support + localStorage fallback
 * 3. **Extension** (Browser extension): Limited GM_* API support
 * 4. **Console** (Plain browser): No GM_* API support
 *
 * **Detection Priority** (highest to lowest):
 * 1. Explicit Tampermonkey API presence (GM_getValue, GM_info, etc.)
 * 2. Browser extension markers (chrome.runtime.id, browser.runtime.id)
 * 3. Test framework markers (__VITEST__, __PLAYWRIGHT__, NODE_ENV=test)
 * 4. Node.js environment
 * 5. Default: Plain browser console
 *
 * **Note**: If Tampermonkey APIs are explicitly present, they take priority.
 * This allows testing services that depend on Tampermonkey APIs.
 *
 * **Usage Example**:
 * ```typescript
 * import { detectEnvironment, isGMAPIAvailable } from '@shared/external/userscript/environment-detector';
 *
 * const env = detectEnvironment();
 * if (env.isUserscriptEnvironment) {
 *   console.log('Available APIs:', env.availableGMAPIs);
 * }
 *
 * if (isGMAPIAvailable('download')) {
 *   // Can use DownloadService
 * }
 * ```
 *
 * @internal Environment detection only
 * @version 2.0.0 - Phase 372: Language policy enforcement + priority clarification
 * @fileoverview Environment detection for userscript execution contexts
 * @see ../adapter.ts - Userscript API adapter
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

/**
 * Detects the current execution environment
 *
 * Analyzes globalThis for markers to determine which environment this code is running in:
 * - Userscript (Tampermonkey/Greasemonkey/Violentmonkey)
 * - Test framework (Vitest, Playwright, etc.)
 * - Browser extension
 * - Plain browser console
 *
 * Also collects available Tampermonkey APIs for reference.
 *
 * @returns EnvironmentInfo with comprehensive environment detection results
 * @internal
 *
 * @example
 * ```typescript
 * const env = detectEnvironment();
 * if (env.isUserscriptEnvironment) {
 *   // Use Tampermonkey APIs directly (if needed)
 *   console.log('Available APIs:', env.availableGMAPIs);
 * } else if (env.isTestEnvironment) {
 *   // Use mock/stub implementations
 *   console.log('Test environment detected');
 * }
 * ```
 */
export function detectEnvironment(): EnvironmentInfo {
  const gm = globalThis as Record<string, unknown>;

  // Signal 1: Explicit Tampermonkey API markers
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

  // Priority: Explicit GM API presence > Browser extension > Test framework/Node.js > Console
  // Note: If Tampermonkey APIs are explicitly present, prioritize them over test framework
  // This allows testing services that depend on Tampermonkey APIs
  if (tampermonkeyInstalled) {
    environment = 'userscript';
    isUserscript = true;
  } else if (browserExtension && !testFramework) {
    environment = 'extension';
    isExtension = true;
  } else if (testFramework || isNode) {
    environment = 'test';
    isTest = true;
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

  const descriptions: Record<EnvironmentInfo['environment'], string> = {
    userscript: `Tampermonkey environment (${env.availableGMAPIs.length} APIs available: ${apiList})`,
    test: `Test environment (${env.availableGMAPIs.length} APIs available: ${apiList})`,
    extension: `Browser extension environment (${env.availableGMAPIs.length} APIs available: ${apiList})`,
    console: 'Plain browser console (no Tampermonkey APIs available)',
  };

  return descriptions[env.environment];
}
