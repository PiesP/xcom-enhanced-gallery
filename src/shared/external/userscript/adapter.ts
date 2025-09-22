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
  /** 하이브리드 스토리지 API (GM_* 우선 → localStorage 폴백) */
  storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    keys(): Promise<string[]>;
  };
}

// ================================
// 네트워크 정책 (Allowlist)
// ================================
export interface UserscriptNetworkPolicy {
  enabled: boolean;
  /** 허용 도메인 목록 (정규식 또는 정규식 문자열) */
  allowlist: Array<RegExp | string>;
  /** 차단 시 알림(토스트) 표시 */
  notifyOnBlock?: boolean;
}

const DEFAULT_POLICY: UserscriptNetworkPolicy = {
  enabled: false, // 기본 Off (점진적 롤아웃)
  allowlist: [
    'x.com',
    'api.twitter.com',
    'pbs.twimg.com',
    'video.twimg.com',
    'abs.twimg.com',
    'abs-0.twimg.com',
  ],
  notifyOnBlock: true,
};

let currentPolicy: UserscriptNetworkPolicy = { ...DEFAULT_POLICY };

export function setUserscriptNetworkPolicy(policy: Partial<UserscriptNetworkPolicy>): void {
  currentPolicy = { ...currentPolicy, ...policy };
}

function isUrlAllowed(rawUrl: string): boolean {
  let host = '';
  try {
    const parsed = new URL(rawUrl);
    host = parsed.hostname || '';
  } catch {
    // URL 파서가 실패하면 간단한 정규식으로 호스트 추출 시도
    const m = rawUrl.match(/^https?:\/\/([^/]+)\//i);
    host = m?.[1] ?? '';
  }

  for (const rule of currentPolicy.allowlist) {
    if (rule instanceof RegExp) {
      if (rule.test(host) || rule.test(rawUrl)) return true;
    } else if (typeof rule === 'string') {
      if (!rule) continue;
      // 정확한 호스트 일치 또는 서브도메인 허용
      if (host === rule || host.endsWith(`.${rule}`)) return true;
      // 보수적 추가: 문자열 기반 URL 포함 검사 (폴리필/엣지 케이스 보호)
      if (rawUrl.includes(`://${rule}/`) || rawUrl.includes(`.${rule}/`)) return true;
    }
  }
  return false;
}

function notifyBlocked(kind: 'xhr' | 'download', url: string): void {
  try {
    if (!currentPolicy.notifyOnBlock) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    const message = `[XEG] 차단됨(${kind}): ${url}`;
    if (typeof g.GM_notification === 'function') {
      g.GM_notification({ text: message, title: '네트워크 차단', timeout: 3000 });
    } else {
      // 외부 레이어에서는 @shared/logging에 의존하지 않는다.
      // GM_notification이 없을 경우에는 조용히 무시(No-Op)한다.
    }
  } catch {
    // ignore
  }
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

  const response = (await fetch(url)) as Response;
  // GM_download와의 정합성을 위해 비-2xx 응답은 오류로 처리
  if (!response.ok) {
    const status = response.status ?? 0;
    throw new Error(`http_${status}`);
  }
  const blob = await response.blob();
  // 안전한 Object URL 생성/해제
  // object URL은 테스트/브라우저 모두에서 안전하게 직접 생성 후, finally에서 해제
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
  // fetch 기반 대체 구현 (timeout/abort/에러 매핑 포함)
  try {
    const controller = new AbortController();
    const { method = 'GET', url, headers, data, responseType, timeout } = options;

    const init: RequestInit = {
      method,
      ...(headers ? { headers: headers as HeadersInit } : {}),
      ...(typeof data === 'string' || (typeof Blob !== 'undefined' && data instanceof Blob)
        ? { body: data as BodyInit }
        : {}),
      signal: controller.signal,
    };

    let finished = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const safeLoadEnd = () => {
      try {
        // ProgressEvent가 없을 수 있으므로 방어적으로 호출
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evt: any =
          typeof ProgressEvent !== 'undefined' ? new ProgressEvent('loadend') : undefined;
        options.onloadend?.(evt as unknown as ProgressEvent);
      } catch {
        // ignore
      }
    };

    const finishOnce = (fn: () => void) => {
      if (finished) return;
      finished = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      try {
        fn();
      } finally {
        safeLoadEnd();
      }
    };

    if (typeof timeout === 'number' && timeout > 0) {
      timeoutId = setTimeout(() => {
        try {
          controller.abort();
        } catch {
          // ignore
        }
        finishOnce(() => {
          options.ontimeout?.();
        });
      }, timeout);
    }

    fetch(url, init)
      .then(async res => {
        if (finished) return; // abort/timeout 이미 처리됨
        const text = await res.text();
        finishOnce(() => {
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
        });
      })
      .catch(err => {
        if (finished) return; // abort/timeout 이미 처리됨
        finishOnce(() => {
          options.onerror?.({
            responseText: '',
            readyState: 4,
            responseHeaders: '',
            status: 0,
            statusText: (err?.name && String(err.name)) || 'error',
            finalUrl: options.url,
          } as never);
        });
      });

    return {
      abort: () => {
        try {
          controller.abort();
        } catch {
          // ignore
        }
        finishOnce(() => {
          options.onabort?.();
        });
      },
    };
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
  const hasGMStorage =
    typeof g.GM_setValue === 'function' &&
    typeof g.GM_getValue === 'function' &&
    typeof g.GM_deleteValue === 'function' &&
    typeof g.GM_listValues === 'function';

  return Object.freeze({
    hasGM: hasGMDownload || hasGMXhr,
    manager: detectManager(),
    info: safeInfo,
    async download(url: string, filename: string): Promise<void> {
      if (currentPolicy.enabled && !isUrlAllowed(url)) {
        notifyBlocked('download', url);
        return Promise.reject(new Error('blocked_by_network_policy'));
      }
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
      if (currentPolicy.enabled && options?.url && !isUrlAllowed(options.url)) {
        notifyBlocked('xhr', options.url);
        // 차단 시 onerror 콜백 알림 (상태 0)
        try {
          options.onerror?.({
            responseText: '',
            readyState: 4,
            responseHeaders: '',
            status: 0,
            statusText: 'blocked_by_network_policy',
            finalUrl: options.url,
          } as never);
        } catch {
          // ignore
        }
        return undefined;
      }
      if (hasGMXhr) {
        try {
          return g.GM_xmlhttpRequest(options);
        } catch {
          // 실패 시 fallback
        }
      }
      return fallbackXhr(options);
    },
    storage: {
      async get(key: string): Promise<string | null> {
        try {
          if (hasGMStorage) {
            // GM_getValue는 동기/비동기 구현 차이가 있으므로 안전하게 직접 호출
            return g.GM_getValue(key, null) as unknown as string | null;
          }
          if (typeof localStorage !== 'undefined') {
            return localStorage.getItem(key);
          }
          return null;
        } catch {
          return null;
        }
      },
      async set(key: string, value: string): Promise<void> {
        try {
          if (hasGMStorage) {
            await g.GM_setValue(key, value);
            return;
          }
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, value);
          }
        } catch {
          // ignore
        }
      },
      async remove(key: string): Promise<void> {
        try {
          if (hasGMStorage) {
            await g.GM_deleteValue(key);
            return;
          }
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
          }
        } catch {
          // ignore
        }
      },
      async keys(): Promise<string[]> {
        try {
          if (hasGMStorage) {
            const ks = g.GM_listValues();
            return Array.isArray(ks) ? ks.slice() : [];
          }
          if (typeof localStorage !== 'undefined') {
            const arr: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k) arr.push(k);
            }
            return arr;
          }
          return [];
        } catch {
          return [];
        }
      },
    },
  });
}

export default getUserscript;
