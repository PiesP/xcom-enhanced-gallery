/**
 * @fileoverview 테스트용 인메모리 저장소 어댑터
 * @description 테스트 환경에서 사용하는 간단한 저장소 구현
 */

import type { StorageAdapter } from '@shared/services/storage/storage-adapter.interface';

/**
 * 테스트용 인메모리 저장소 어댑터
 *
 * 실제 저장소 없이 메모리에만 데이터를 저장합니다.
 * 테스트 시 격리된 환경을 제공합니다.
 *
 * @example
 * ```typescript
 * const storage = new InMemoryStorageAdapter();
 * await storage.setItem('key', 'value');
 * const value = await storage.getItem('key'); // 'value'
 * ```
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly storage = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  /**
   * 테스트 헬퍼: 모든 저장된 항목 조회
   */
  getAll(): Map<string, string> {
    return new Map(this.storage);
  }
}
