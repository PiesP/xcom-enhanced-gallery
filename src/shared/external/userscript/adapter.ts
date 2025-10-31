/**
 * @fileoverview Userscript API Adapter (Tampermonkey/Greasemonkey/Violentmonkey)
 * @description getter 함수로 외부 Userscript GM_* API를 캡슐화하고,
 * 미지원 환경(Node/Vitest)에서 안전한 fallback (localStorage, fetch) 제공
 * @version 11.0.0 - Phase 200: 현대화, 에러 처리 강화, 주석 개선
 */
import type { GMXmlHttpRequestOptions, BrowserEnvironment } from '@shared/types/core/userscript';
import { isGMUserScriptInfo, isProgressEventLike } from '@shared/utils/core';

type GMUserScriptInfo = Record<string, unknown>;

export type UserscriptManager = BrowserEnvironment['userscriptManager'];

export interface UserscriptAPI {
  readonly hasGM: boolean;
  readonly manager: UserscriptManager;
  info(): GMUserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  xhr(options: GMXmlHttpRequestOptions): { abort: () => void } | undefined;
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
  GM_xmlhttpRequest?: (options: GMXmlHttpRequestOptions) => { abort: () => void };
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
 * 다운로드 Fallback: fetch + Blob + a[href] (브라우저 환경용)
 * @throws 비브라우저 환경에서는 조용히 반환 (no-op)
 */
async function fallbackDownload(url: string, filename: string): Promise<void> {
  // 비브라우저 환경(Node/Vitest) 확인
  if (typeof document === 'undefined' || !document.body) {
    return; // 다운로드 불가능한 환경이므로 no-op
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    throw new Error(`Fallback download failed for ${url}`);
  }
}

/**
 * XMLHttpRequest Fallback: fetch 기반 구현
 * @note GM_xmlhttpRequest와 완벽한 호환성은 보장하지 않습니다.
 * 기본 onload/onerror 콜백과 responseType만 지원합니다.
 */
function fallbackXhr(options: GMXmlHttpRequestOptions): { abort: () => void } | undefined {
  try {
    const controller = new AbortController();
    const { method = 'GET', url, headers, data, responseType } = options;

    const init: RequestInit = {
      method,
      ...(headers ? { headers: headers as HeadersInit } : {}),
      ...(typeof data === 'string' || data instanceof Blob ? { body: data as BodyInit } : {}),
      signal: controller.signal,
    };

    fetch(url, init)
      .then(async res => {
        const text = await res.text();
        options.onload?.({
          responseText: text,
          readyState: 4,
          responseHeaders: '',
          status: res.status,
          statusText: res.statusText,
          finalUrl: res.url,
          response:
            responseType === 'json'
              ? (() => {
                  try {
                    return JSON.parse(text);
                  } catch {
                    return undefined;
                  }
                })()
              : text,
        } as never);
      })
      .catch(() => {
        options.onerror?.({
          responseText: '',
          readyState: 4,
          responseHeaders: '',
          status: 0,
          statusText: 'error',
          finalUrl: options.url,
        } as never);
      })
      .finally(() => {
        // JSDOM/Node 환경에서 ProgressEvent가 없을 수 있으므로 안전 확인
        const event = { type: 'loadend' };
        if (isProgressEventLike(event)) {
          options.onloadend?.(event as unknown as ProgressEvent);
        }
      });

    return { abort: () => controller.abort() };
  } catch {
    return undefined;
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
  const hasGMXhr = hasGMInfo(g) && typeof g.GM_xmlhttpRequest === 'function';
  const hasGMStorage =
    hasGMInfo(g) && typeof g.GM_setValue === 'function' && typeof g.GM_getValue === 'function';

  return Object.freeze({
    hasGM: hasGMDownload || hasGMXhr || hasGMStorage,
    manager: detectManager(),
    info: safeInfo,

    async download(url: string, filename: string): Promise<void> {
      // GM_download 시도
      if (hasGMDownload && hasGMInfo(g) && g.GM_download) {
        try {
          g.GM_download(url, filename);
          return;
        } catch {
          // Fallback으로 진행
        }
      }
      // Fallback: fetch + Blob + a[href]
      return fallbackDownload(url, filename);
    },

    xhr(options: GMXmlHttpRequestOptions): { abort: () => void } | undefined {
      // GM_xmlhttpRequest 시도
      if (hasGMXhr && hasGMInfo(g) && g.GM_xmlhttpRequest) {
        try {
          // Cast through unknown to satisfy TS when underlying lib returns void in some managers
          return g.GM_xmlhttpRequest(options) as unknown as { abort: () => void } | undefined;
        } catch {
          // Fallback으로 진행
        }
      }
      // Fallback: fetch 기반 구현
      return fallbackXhr(options) ?? undefined;
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
