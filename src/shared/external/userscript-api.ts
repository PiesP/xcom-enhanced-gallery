/**
 * Userscript API Getter (의존성 격리)
 * - 전역 GM_* 존재 여부를 검사하여 안전하게 접근
 */
export type UserscriptAPI = {
  getValue: <T = unknown>(key: string, defaultValue?: T) => T | undefined;
  setValue: <T = unknown>(key: string, value: T) => void;
};

export function getUserscriptApi(): UserscriptAPI | null {
  try {
    const g = globalThis as unknown as {
      GM_getValue?: (key: string, defaultValue?: unknown) => unknown;
      GM_setValue?: (key: string, value: unknown) => void;
    };
    const rawGet = typeof g.GM_getValue === 'function' ? g.GM_getValue : undefined;
    const rawSet = typeof g.GM_setValue === 'function' ? g.GM_setValue : undefined;
    if (rawGet && rawSet) {
      const wrapped: UserscriptAPI = {
        getValue: <T = unknown>(key: string, defaultValue?: T): T | undefined => {
          return rawGet(key, defaultValue) as T | undefined;
        },
        setValue: <T = unknown>(key: string, value: T): void => {
          rawSet(key, value);
        },
      };
      return wrapped;
    }
  } catch {
    // ignore
  }
  return null;
}
