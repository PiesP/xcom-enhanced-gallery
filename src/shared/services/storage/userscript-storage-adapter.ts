/**
 * @fileoverview Userscript 기반 저장소 어댑터
 * @description GM_* API를 사용하는 StorageAdapter 구현
 */

import { getUserscript } from '@shared/external/userscript/adapter';
import type { StorageAdapter } from './storage-adapter.interface';
import { logger } from '@shared/logging';

/**
 * Userscript 기반 저장소 어댑터
 *
 * GM_setValue/GM_getValue를 사용하여 Tampermonkey의 저장소에 안전하게 접근합니다.
 *
 * @example
 * ```typescript
 * const storage = new UserscriptStorageAdapter();
 * await storage.setItem('key', 'value');
 * const value = await storage.getItem('key');
 * ```
 */
export class UserscriptStorageAdapter implements StorageAdapter {
  /**
   * @param userscript getUserscript() API (테스트 시 모킹 가능)
   */
  constructor(private readonly userscript = getUserscript()) {}

  /**
   * 항목 조회
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await this.userscript.getValue<unknown>(key);
      if (value === undefined || value === null) return null;

      // 문자열이면 그대로 반환, 아니면 JSON 직렬화
      return typeof value === 'string' ? value : JSON.stringify(value);
    } catch (error) {
      logger.error('StorageAdapter.getItem 실패:', error);
      return null;
    }
  }

  /**
   * 항목 저장
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // JSON 파싱 시도 후 객체로 저장 (GM_setValue는 객체 직접 저장 지원)
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        // JSON이 아니면 문자열 그대로
        parsed = value;
      }
      await this.userscript.setValue(key, parsed);
    } catch (error) {
      logger.error('StorageAdapter.setItem 실패:', error);
      throw error;
    }
  }

  /**
   * 항목 삭제
   */
  async removeItem(key: string): Promise<void> {
    try {
      await this.userscript.deleteValue(key);
    } catch (error) {
      logger.error('StorageAdapter.removeItem 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 항목 삭제
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.userscript.listValues();
      await Promise.all(keys.map(key => this.userscript.deleteValue(key)));
    } catch (error) {
      logger.error('StorageAdapter.clear 실패:', error);
      throw error;
    }
  }
}
