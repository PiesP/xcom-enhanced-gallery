/**
 * SettingsService – Hybrid storage & one-time migration
 * RED: SettingsService는 내부 readStore/writeStore로만 저장을 수행하고,
 * 초기화 시 기존 localStorage('xeg-app-settings')가 있으면 우선 저장소(GM)로 1회 이관한다.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from '@/features/settings/services/SettingsService';

// 메모리 localStorage 폴리필
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

const KEY = 'xeg-app-settings';

describe('SettingsService – hybrid storage migration', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
  });

  it('migrates existing localStorage config to GM store on first initialize (idempotent)', async () => {
    // 1) 기존 localStorage에 구 데이터가 존재
    const legacy = {
      gallery: { imageFitMode: 'fitWidth' },
      download: { showProgressToast: false },
      tokens: {},
      performance: { debugMode: false },
      accessibility: { reduceMotion: false },
      version: '1',
      lastModified: Date.now(),
    } as any;
    (globalThis as any).localStorage.setItem(KEY, JSON.stringify(legacy));

    // 2) GM 환경 제공 (마이그레이션 대상 저장소)
    const g: any = globalThis as any;
    const gmStore = new Map<string, string>();
    g.GM_setValue = vi.fn((k: string, v: string) => {
      gmStore.set(k, v);
    });
    g.GM_getValue = vi.fn((k: string, d?: string) => gmStore.get(k) ?? d ?? null);
    g.GM_deleteValue = vi.fn((k: string) => {
      gmStore.delete(k);
    });
    g.GM_listValues = vi.fn(() => Array.from(gmStore.keys()));

    const svc = new SettingsService();
    await svc.initialize();

    // 3) 마이그레이션 결과: GM 저장소에 최신 설정이 저장되고, 재호출 시 중복 이관 없음
    const gmRaw = g.GM_getValue(KEY, null);
    expect(gmRaw).toBeTruthy();

    const parsed = JSON.parse(String(gmRaw));
    expect(parsed?.gallery?.imageFitMode).toBeDefined();

    // 4) 재초기화 시에도 동일(중복 이관 X)
    const svc2 = new SettingsService();
    await svc2.initialize();
    const gmRaw2 = g.GM_getValue(KEY, null);
    expect(gmRaw2).toBe(gmRaw);
  });

  it('critical keys save via writeStore() immediately', async () => {
    // GM 우선 환경
    const g: any = globalThis as any;
    const gmStore = new Map<string, string>();
    g.GM_setValue = vi.fn((k: string, v: string) => {
      gmStore.set(k, v);
    });
    g.GM_getValue = vi.fn((k: string, d?: string) => gmStore.get(k) ?? d ?? null);
    g.GM_deleteValue = vi.fn((k: string) => {
      gmStore.delete(k);
    });
    g.GM_listValues = vi.fn(() => Array.from(gmStore.keys()));

    const svc = new SettingsService();
    await svc.initialize();

    await svc.set('gallery.imageFitMode', 'fitHeight');

    const gmRaw = g.GM_getValue(KEY, null);
    expect(gmRaw).toBeTruthy();
    const parsed = JSON.parse(String(gmRaw));
    expect(parsed?.gallery?.imageFitMode).toBe('fitHeight');
  });
});
