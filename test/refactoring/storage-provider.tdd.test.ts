/**
 * TDD: Storage Provider 우선순위/폴백/마이그레이션 테스트 (RED)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 아직 구현되지 않은 Provider를 참조하여 컴파일/실행 시 실패를 유도 (RED)
import { getKeyValueStore, __resetKeyValueStoreForTests } from '@shared/storage/provider';

const MIGRATION_FLAG_KEY = 'xeg-storage-migrated';

describe('[TDD][RED] Storage Provider', () => {
  beforeEach(() => {
    // reset environment
    localStorage.clear();
    // GM mocks are provided by test setup, ensure fresh spies
    // @ts-expect-error runtime test override
    global.GM_getValue = typeof global.GM_getValue === 'function' ? global.GM_getValue : vi.fn();
    // @ts-expect-error runtime test override
    global.GM_setValue = typeof global.GM_setValue === 'function' ? global.GM_setValue : vi.fn();
    vi.clearAllMocks();
    __resetKeyValueStoreForTests();
  });

  it('GM API가 있으면 GM 저장소를 우선 사용한다', () => {
    // Arrange
    localStorage.setItem('key', 'lsValue');
    // @ts-expect-error test spy
    (global.GM_getValue as any).mockImplementation((k: string, d?: unknown) =>
      k === 'key' ? 'gmValue' : d
    );

    // Act
    const store = getKeyValueStore();
    const value = store.getItem('key');

    // Assert
    expect(value).toBe('gmValue');
    // @ts-expect-error spy check
    expect(global.GM_getValue).toHaveBeenCalled();
  });

  it('GM API가 없으면 localStorage를 사용한다 (폴백)', () => {
    // Arrange: GM 제거
    // @ts-expect-error remove at runtime
    global.GM_getValue = undefined;
    // @ts-expect-error remove at runtime
    global.GM_setValue = undefined;
    localStorage.setItem('key2', 'lsOnly');

    // Act
    const store = getKeyValueStore();
    const value = store.getItem('key2');

    // Assert
    expect(value).toBe('lsOnly');
  });

  it('마이그레이션: GM 값이 없고 localStorage에만 있으면 1회 GM으로 이관한다', () => {
    // Arrange
    const appSettings = JSON.stringify({ a: 1 });
    localStorage.setItem('xeg-app-settings', appSettings);
    localStorage.setItem('xeg-image-fit-mode', 'fitWidth');

    // GM은 비어있다고 가정, setValue 호출만 추적
    // @ts-expect-error spy
    (global.GM_getValue as any).mockImplementation((_k: string, d?: unknown) => d);

    // Act: 최초 접근 시 마이그레이션 수행
    getKeyValueStore();

    // Assert: 두 키 + 플래그 세팅 호출
    // @ts-expect-error spy check
    expect(global.GM_setValue).toHaveBeenCalledWith('xeg-app-settings', appSettings);
    // @ts-expect-error spy check
    expect(global.GM_setValue).toHaveBeenCalledWith('xeg-image-fit-mode', 'fitWidth');
    // @ts-expect-error spy check
    expect(global.GM_setValue).toHaveBeenCalledWith(MIGRATION_FLAG_KEY, true);
  });
});
