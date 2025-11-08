/**
 * Userscript API Adapter (Tampermonkey/Greasemonkey/Violentmonkey)
 *
 * **Purpose**: Wrapper for Tampermonkey GM_* APIs
 * **Architecture**: Encapsulates external Userscript GM_* through getter function
 * **Scope**: Provides typed access to GM_* APIs when available
 * **Deprecated**: GM_xmlHttpRequest removed (Phase 318.1) - MV3 incompatible, use HttpRequestService
 *
 * **Fallback Strategy**: None. GM_* APIs must be available at runtime.
 *
 * **Supported Managers**:
 * - Tampermonkey (GM_* + GM_info)
 * - Greasemonkey (GM_* + GM_info)
 * - Violentmonkey (GM_* + GM_info)
 * - Test environments must mock GM_* APIs
 *
 * **Usage**:
 * For production: Use Service Layer (PersistentStorage, DownloadService, etc.)
 * For testing/advanced: Use getUserscript() getter
 *
 * @internal Advanced/testing only - Use Service Layer for production
 * @version 12.0.0 - Phase 372: Language policy enforcement + Phase 318.1 MV3 update
 * @fileoverview Userscript API adapter
 * @see PersistentStorage - Recommended service for storage operations
 * @see DownloadService - Recommended service for downloads
 * @see HttpRequestService - Recommended service for HTTP requests (Phase 318+)
 */
import type { BrowserEnvironment } from '@shared/types/core/userscript';
import { isGMUserScriptInfo } from '@shared/utils/type-safety-helpers';

type GMUserScriptInfo = Record<string, unknown>;

export type UserscriptManager = BrowserEnvironment['userscriptManager'];

export interface UserscriptAPI {
  readonly hasGM: boolean;
  readonly manager: UserscriptManager;
  info(): GMUserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
}

/**
 * GlobalWithGM: Global object containing GM_* API functions
 * @internal
 */
interface GlobalWithGM {
  GM_info?: {
    script: {
      name: string;
      version: string;
      [key: string]: unknown;
    };
    scriptHandler?: string;
    version?: string;
    [key: string]: unknown;
  };
  GM_download?: (url: string, filename: string) => void;
  GM_setValue?: (key: string, value: unknown) => Promise<void> | void;
  GM_getValue?: <T>(key: string, defaultValue?: T) => Promise<T> | T;
  GM_deleteValue?: (key: string) => Promise<void> | void;
  GM_listValues?: () => Promise<string[]> | string[];
}

/**
 * hasGMInfo: Type guard to check for GM_info availability
 * @internal
 */
function hasGMInfo(g: unknown): g is GlobalWithGM {
  return typeof g === 'object' && g !== null && 'GM_info' in g;
}

/**
 * Detect userscript manager from GM_info
 * @internal
 *
 * Determines which userscript manager is running (Tampermonkey, Greasemonkey, Violentmonkey)
 * by inspecting the scriptHandler property of GM_info.
 */
function detectManager(): UserscriptManager {
  try {
    const info = hasGMInfo(globalThis) ? globalThis.GM_info : undefined;
    const handler = isGMUserScriptInfo(info)
      ? (info as { scriptHandler?: string }).scriptHandler?.toLowerCase?.()
      : undefined;
    if (!handler) return 'unknown';
    if (handler.includes('tamper')) return 'tampermonkey';
    if (handler.includes('grease')) return 'greasemonkey';
    if (handler.includes('violent')) return 'violentmonkey';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Safely get GM_info from globalThis
 * @internal
 *
 * Returns GM_info object if available and valid, otherwise returns null
 */
function safeInfo(): GMUserScriptInfo | null {
  try {
    const info = hasGMInfo(globalThis) ? globalThis.GM_info : undefined;
    return isGMUserScriptInfo(info) ? (info as unknown as GMUserScriptInfo) : null;
  } catch {
    return null;
  }
}

/**
 * Userscript API getter (external dependency encapsulation)
 *
 * Provides access to GM_* APIs in Tampermonkey environments.
 *
 * **Security Note**: Use Service Layer (PersistentStorage) for production code
 *
 * @returns UserscriptAPI object with all methods (frozen, immutable)
 * @throws Error if required GM_* APIs are unavailable
 * @internal Advanced/testing only
 */
export function getUserscript(): UserscriptAPI {
  const g = globalThis;
  const hasGMDownload = hasGMInfo(g) && typeof g.GM_download === 'function';
  const hasGMStorage =
    hasGMInfo(g) && typeof g.GM_setValue === 'function' && typeof g.GM_getValue === 'function';

  return Object.freeze({
    hasGM: hasGMDownload || hasGMStorage,
    manager: detectManager(),
    info: safeInfo,

    async download(url: string, filename: string): Promise<void> {
      // GM_download required - no fallback available
      if (!hasGMDownload || !hasGMInfo(g) || !g.GM_download) {
        throw new Error(
          'GM_download not available - Tampermonkey/Greasemonkey environment required'
        );
      }
      g.GM_download(url, filename);
    },

    async setValue(key: string, value: unknown): Promise<void> {
      if (!hasGMStorage || !hasGMInfo(g) || !g.GM_setValue) {
        throw new Error(
          'GM_setValue not available - Tampermonkey/Greasemonkey environment required'
        );
      }

      await Promise.resolve(g.GM_setValue(key, value));
    },

    async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
      if (!hasGMStorage || !hasGMInfo(g) || !g.GM_getValue) {
        throw new Error(
          'GM_getValue not available - Tampermonkey/Greasemonkey environment required'
        );
      }

      const value = await Promise.resolve(g.GM_getValue(key, defaultValue));
      return value as T | undefined;
    },

    async deleteValue(key: string): Promise<void> {
      if (!hasGMStorage || !hasGMInfo(g) || !g.GM_deleteValue) {
        throw new Error(
          'GM_deleteValue not available - Tampermonkey/Greasemonkey environment required'
        );
      }

      await Promise.resolve(g.GM_deleteValue(key));
    },

    async listValues(): Promise<string[]> {
      if (!hasGMStorage || !hasGMInfo(g) || !g.GM_listValues) {
        throw new Error(
          'GM_listValues not available - Tampermonkey/Greasemonkey environment required'
        );
      }

      const values = await Promise.resolve(g.GM_listValues());
      return Array.isArray(values) ? values : [];
    },
  });
}

export default getUserscript;
