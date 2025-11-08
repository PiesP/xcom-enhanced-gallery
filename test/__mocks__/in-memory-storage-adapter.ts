/**
 * 테스트용 인메모리 저장소 어댑터
 * @fileoverview 격리된 테스트 환경에서 사용하는 저장소 구현
 */

import type { StorageAdapter } from '@shared/services/storage';

/**
 * 인메모리 저장소 어댑터
 * - 메모리 기반 데이터 저장소
 * - 테스트 격리 보장
 * - 비동기 API 준수
 *
 * @example
 * ```typescript
 * const storage = new InMemoryStorageAdapter();
 * await storage.setItem('key', 'value');
 * const value = await storage.getItem('key'); // 'value'
 * await storage.clear(); // 모두 초기화
 * ```
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly data = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  /**
   * 테스트 헬퍼: 모든 저장된 항목 조회
   */
  getAll(): Map<string, string> {
    return new Map(this.data);
  }

  /**
   * 테스트 헬퍼: 현재 크기 반환
   */
  size(): number {
    return this.data.size;
  }

  /**
   * 테스트 헬퍼: 특정 키 존재 여부
   */
  has(key: string): boolean {
    return this.data.has(key);
  }
}
