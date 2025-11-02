/**
 * @fileoverview Userscript API Adapter (Tampermonkey/Greasemonkey/Violentmonkey)
 * @description getter 함수로 외부 Userscript GM_* API를 캡슐화하고,
 * 미지원 환경(Node/Vitest)에서 안전한 fallback (localStorage, fetch) 제공
 * @version 12.0.0 - Phase 318.1: GM_xmlHttpRequest 제거 (MV3 불가)
 */
import type { BrowserEnvironment } from '@shared/types/core/userscript';
import { isGMUserScriptInfo } from '@shared/utils/core';

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
 * GlobalWithGM: GM_info를 가진 전역 객체 타입
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
 * hasGMInfo: GM_info 존재 여부를 확인하는 타입 가드
 */
function hasGMInfo(g: unknown): g is GlobalWithGM {
  return typeof g === 'object' && g !== null && 'GM_info' in g;
}

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

function safeInfo(): GMUserScriptInfo | null {
  try {
    const info = hasGMInfo(globalThis) ? globalThis.GM_info : undefined;
    return isGMUserScriptInfo(info) ? (info as unknown as GMUserScriptInfo) : null;
  } catch {
    return null;
  }
}

/**
 * 안전한 localStorage 접근 (SecurityError 방지)
 */
function getSafeLocalStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    // length 접근으로 SecurityError 여부 확인 (cross-origin 환경 등)
    void storage.length;
    return storage ?? null;
  } catch {
    return null; // SecurityError 등으로 접근 불가
  }
}

/**
 * Userscript API getter (외부 의존성 캡슐화)
 *
 * Userscript 환경에서 GM_* API를 제공하고, 미지원 환경에서는
 * localStorage/fetch 기반 fallback을 자동 제공합니다.
 *
 * @returns UserscriptAPI 객체 (모든 메서드는 Promise 기반)
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
      // GM API 필수 - fallback 없음
      if (!hasGMDownload || !hasGMInfo(g) || !g.GM_download) {
        throw new Error(
          'GM_download not available - Tampermonkey/Greasemonkey environment required'
        );
      }
      g.GM_download(url, filename);
    },

    async setValue(key: string, value: unknown): Promise<void> {
      // GM_setValue 시도
      if (hasGMStorage && hasGMInfo(g) && g.GM_setValue) {
        try {
          await Promise.resolve(g.GM_setValue(key, value));
          return;
        } catch {
          // localStorage fallback으로 진행
        }
      }
      // Fallback: localStorage
      const storage = getSafeLocalStorage();
      if (storage) {
        storage.setItem(key, JSON.stringify(value));
      } else {
        throw new Error(
          'No storage mechanism available (GM_setValue and localStorage both unavailable)'
        );
      }
    },

    async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
      // GM_getValue 시도
      if (hasGMStorage && hasGMInfo(g) && g.GM_getValue) {
        try {
          const value = await Promise.resolve(g.GM_getValue(key, defaultValue));
          return value as T | undefined;
        } catch {
          // localStorage fallback으로 진행
        }
      }
      // Fallback: localStorage
      const storage = getSafeLocalStorage();
      if (storage) {
        try {
          const stored = storage.getItem(key);
          return stored === null ? defaultValue : (JSON.parse(stored) as T);
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    },

    async deleteValue(key: string): Promise<void> {
      // GM_deleteValue 시도
      if (hasGMStorage && hasGMInfo(g) && g.GM_deleteValue) {
        try {
          await Promise.resolve(g.GM_deleteValue(key));
          return;
        } catch {
          // localStorage fallback으로 진행
        }
      }
      // Fallback: localStorage
      const storage = getSafeLocalStorage();
      if (storage) {
        storage.removeItem(key);
      }
    },

    async listValues(): Promise<string[]> {
      // GM_listValues 시도
      if (hasGMStorage && hasGMInfo(g) && g.GM_listValues) {
        try {
          const values = await Promise.resolve(g.GM_listValues());
          return Array.isArray(values) ? values : [];
        } catch {
          // localStorage fallback으로 진행
        }
      }
      // Fallback: localStorage
      const storage = getSafeLocalStorage();
      if (storage) {
        try {
          return Object.keys(storage);
        } catch {
          return [];
        }
      }
      return [];
    },
  });
}

export default getUserscript;
