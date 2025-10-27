/**
 * @fileoverview Storage Adapter 인터페이스
 * @description 저장소 구현을 추상화하여 테스트 및 전환 용이성 제공
 */

/**
 * 저장소 어댑터 인터페이스
 *
 * 저장소 구현을 추상화하여:
 * - 테스트 용이성 향상 (모킹/스텁 가능)
 * - 다양한 저장소 구현 지원 (GM_*, localStorage, IndexedDB 등)
 * - 의존성 주입 패턴 적용
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(private storage: StorageAdapter) {}
 *
 *   async saveData(key: string, value: unknown) {
 *     await this.storage.setItem(key, JSON.stringify(value));
 *   }
 * }
 * ```
 */
export interface StorageAdapter {
  /**
   * 항목 조회
   * @param key 저장소 키
   * @returns 저장된 값 (없으면 null)
   */
  getItem(key: string): Promise<string | null>;

  /**
   * 항목 저장
   * @param key 저장소 키
   * @param value 저장할 값 (문자열)
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * 항목 삭제
   * @param key 저장소 키
   */
  removeItem(key: string): Promise<void>;

  /**
   * 모든 항목 삭제 (선택적)
   */
  clear?(): Promise<void>;
}
