import { getUserscriptApi } from '@shared/external/userscript-api';
import type { KeyValueStore } from './key-value-store';
import { GMKeyValueStore, LocalStorageKeyValueStore } from './key-value-store';

const MIGRATION_FLAG_KEY = 'xeg-storage-migrated';
const DEFAULT_MIGRATE_KEYS = ['xeg-app-settings', 'xeg-image-fit-mode', 'xeg_theme'] as const;

let cachedStore: KeyValueStore | null = null;

export function getKeyValueStore(): KeyValueStore {
  if (cachedStore) return cachedStore;

  const api = getUserscriptApi();
  const gmStore = api ? new GMKeyValueStore(api) : null;
  const lsStore = new LocalStorageKeyValueStore();

  cachedStore = gmStore ?? lsStore;

  try {
    if (gmStore && !gmStore.getItem<boolean>(MIGRATION_FLAG_KEY)) {
      for (const key of DEFAULT_MIGRATE_KEYS) {
        // 마이그레이션은 원본 문자열을 유지해야 하므로 raw localStorage 값을 사용
        const raw = globalThis?.localStorage?.getItem?.(key) ?? undefined;
        if (typeof raw !== 'undefined' && raw !== null) {
          gmStore.setItem<string>(key, raw);
        }
      }
      gmStore.setItem<boolean>(MIGRATION_FLAG_KEY, true);
    }
  } catch {
    // ignore migration errors
  }
  return cachedStore;
}

// 테스트를 위한 캐시 초기화 유틸리티 (프로덕션 코드에서는 사용하지 않음)
export function __resetKeyValueStoreForTests(): void {
  cachedStore = null;
}
