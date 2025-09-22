/**
 * Userscript storage adapter – hybrid (GM -> localStorage fallback)
 * RED: getUserscript().storage API가 존재하고, GM이 있으면 GM_*를, 없으면 localStorage를 사용해야 한다.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import getUserscript from '@/shared/external/userscript/adapter';

// 간단한 메모리 localStorage 폴리필
const memoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('localStorage', memoryStorage as any);

describe('Userscript storage adapter – hybrid', () => {
  const KEY = 'xeg-app-settings';

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
  });

  it('uses GM storage when GM_* is available', async () => {
    // GM 모킹 (test/setup에서 기본 제공되지만 안전하게 보장)
    const g: any = globalThis as any;
    g.GM_setValue = vi.fn();
    g.GM_getValue = vi.fn(() => null);
    g.GM_deleteValue = vi.fn();
    g.GM_listValues = vi.fn(() => []);

    const us: any = getUserscript() as any;
    expect(us.storage).toBeTruthy();

    await us.storage.set(KEY, '{"a":1}');
    expect(g.GM_setValue).toHaveBeenCalledWith(KEY, '{"a":1}');

    g.GM_getValue.mockReturnValue('{"a":1}');
    const got = await us.storage.get(KEY);
    expect(got).toBe('{"a":1}');
  });

  it('falls back to localStorage when GM_* is not available', async () => {
    const g: any = globalThis as any;
    // GM_* 제거
    delete g.GM_setValue;
    delete g.GM_getValue;
    delete g.GM_deleteValue;
    delete g.GM_listValues;

    const us: any = getUserscript() as any;
    expect(us.storage).toBeTruthy();

    await us.storage.set(KEY, '{"b":2}');
    const raw = (globalThis as any).localStorage.getItem(KEY);
    expect(raw).toBe('{"b":2}');

    const got = await us.storage.get(KEY);
    expect(got).toBe('{"b":2}');
  });
});
