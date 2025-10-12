/**
 * Userscript Adapter (Tampermonkey/Greasemonkey/Violentmonkey)
 * - getter 함수로 외부(UserScript) 의존성을 캡슐화
 * - GM_* 미지원 환경(Node/Vitest)에서도 안전한 fallback 제공
 */
import type {
  GMXmlHttpRequestOptions,
  UserScriptInfo,
  BrowserEnvironment,
} from '@shared/types/core/userscript';

export type UserscriptManager = BrowserEnvironment['userscriptManager'];

export interface UserscriptAPI {
  readonly hasGM: boolean;
  readonly manager: UserscriptManager;
  info(): UserScriptInfo | null;
  download(url: string, filename: string): Promise<void>;
  xhr(options: GMXmlHttpRequestOptions): { abort: () => void } | undefined;
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
}

function detectManager(): UserscriptManager {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = (globalThis as any)?.GM_info;
    const handler = info?.scriptHandler?.toLowerCase?.() as string | undefined;
    if (!handler) return 'unknown';
    if (handler.includes('tamper')) return 'tampermonkey';
    if (handler.includes('grease')) return 'greasemonkey';
    if (handler.includes('violent')) return 'violentmonkey';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function safeInfo(): UserScriptInfo | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = (globalThis as any)?.GM_info;
    return info ?? null;
  } catch {
    return null;
  }
}

async function fallbackDownload(url: string, filename: string): Promise<void> {
  // 브라우저 환경에서 동작하는 최소 다운로드(Fetch + Blob + a[href])
  // 테스트(Node)에서는 fetch가 없어 호출을 피해야 함
  // document/body 가 없으면 안전하게 no-op 처리
  if (typeof document === 'undefined' || !document.body) {
    return; // 비브라우저 환경에서는 수행할 수 없음
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || 'download';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function fallbackXhr(options: GMXmlHttpRequestOptions): { abort: () => void } | undefined {
  // 최소 fetch 기반 대체 구현
  try {
    const controller = new AbortController();
    const { method = 'GET', url, headers, data, responseType } = options;

    // 간단한 fetch 호출 (이벤트 콜백은 일부만 대응)
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
        // JSDOM/Node 환경에서는 ProgressEvent가 없을 수 있으므로 안전한 스텁 객체 사용
        options.onloadend?.({ type: 'loadend' } as unknown as ProgressEvent);
      });

    return { abort: () => controller.abort() };
  } catch {
    return undefined;
  }
}

/**
 * Userscript API getter (외부 의존성 격리)
 */
export function getUserscript(): UserscriptAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  const hasGMDownload = typeof g.GM_download === 'function';
  const hasGMXhr = typeof g.GM_xmlhttpRequest === 'function';
  const hasGMStorage = typeof g.GM_setValue === 'function' && typeof g.GM_getValue === 'function';

  return Object.freeze({
    hasGM: hasGMDownload || hasGMXhr || hasGMStorage,
    manager: detectManager(),
    info: safeInfo,
    async download(url: string, filename: string): Promise<void> {
      if (hasGMDownload) {
        try {
          // GM_download는 동기 API처럼 보이는 구현이 많아 try/catch로 래핑
          g.GM_download(url, filename);
          return;
        } catch {
          // 실패 시 fallback
        }
      }
      return fallbackDownload(url, filename);
    },
    xhr(options: GMXmlHttpRequestOptions) {
      if (hasGMXhr) {
        try {
          return g.GM_xmlhttpRequest(options);
        } catch {
          // 실패 시 fallback
        }
      }
      return fallbackXhr(options);
    },
    async setValue(key: string, value: unknown): Promise<void> {
      if (hasGMStorage) {
        try {
          await Promise.resolve(g.GM_setValue(key, value));
          return;
        } catch (error) {
          // GM_setValue 실패 시 localStorage로 fallback
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem(key, JSON.stringify(value));
              return;
            } catch {
              // localStorage도 실패하면 에러 throw
            }
          }
          throw error;
        }
      }
      // GM_setValue가 없으면 localStorage 사용
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        throw new Error('No storage mechanism available');
      }
    },
    async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
      if (hasGMStorage) {
        try {
          const value = await Promise.resolve(g.GM_getValue(key, defaultValue));
          return value as T | undefined;
        } catch {
          // GM_getValue 실패 시 localStorage로 fallback
          if (typeof localStorage !== 'undefined') {
            try {
              const stored = localStorage.getItem(key);
              if (stored === null) return defaultValue;
              return JSON.parse(stored) as T;
            } catch {
              return defaultValue;
            }
          }
          return defaultValue;
        }
      }
      // GM_getValue가 없으면 localStorage 사용
      if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem(key);
          if (stored === null) return defaultValue;
          return JSON.parse(stored) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    },
    async deleteValue(key: string): Promise<void> {
      if (hasGMStorage) {
        try {
          if (typeof g.GM_deleteValue === 'function') {
            await Promise.resolve(g.GM_deleteValue(key));
          }
          return;
        } catch {
          // 실패 시 localStorage fallback
        }
      }
      // GM_deleteValue가 없으면 localStorage 사용
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    },
    async listValues(): Promise<string[]> {
      if (hasGMStorage) {
        try {
          if (typeof g.GM_listValues === 'function') {
            const values = await Promise.resolve(g.GM_listValues());
            return Array.isArray(values) ? values : [];
          }
        } catch {
          // 실패 시 localStorage fallback
        }
      }
      // GM_listValues가 없으면 localStorage 사용
      if (typeof localStorage !== 'undefined') {
        return Object.keys(localStorage);
      }
      return [];
    },
  });
}

export default getUserscript;
