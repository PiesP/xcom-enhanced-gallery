/**
 * TDD: SettingsService가 Storage Provider(GM 우선)를 경유해 저장/로드한다 (RED)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SettingsService } from '@/features/settings/services/settings-service';
import { getKeyValueStore, __resetKeyValueStoreForTests } from '@shared/storage/provider';

vi.mock('@shared/storage/provider', async () => {
  const actual = await vi.importActual<any>('@shared/storage/provider');
  // 간단한 스파이용 Mock Provider - 호출 유무만 검증
  const backing = new Map<string, unknown>();
  return {
    ...actual,
    getKeyValueStore: () => ({
      getItem: (k: string) => backing.get(k),
      setItem: (k: string, v: unknown) => backing.set(k, v),
    }),
  };
});

describe('[TDD][RED] SettingsService x Storage Provider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    __resetKeyValueStoreForTests();
  });

  it('initialize() 시 Provider로부터 설정을 로드한다', async () => {
    const service = new SettingsService();
    await service.initialize();
    // 기본값으로 초기화되었고, 에러 없이 동작
    expect(service.isInitialized()).toBe(true);
  });

  it('set() 이후 saveSettings가 Provider를 통해 호출된다', async () => {
    const service = new SettingsService();
    await service.initialize();

    await service.set('performance.debugMode', true);

    // Storage Provider mock이 setItem을 호출했는지 간접 확인
    const store = getKeyValueStore();
    const raw = store.getItem<string>('xeg-app-settings');
    expect(raw).toBeDefined();
  });
});
