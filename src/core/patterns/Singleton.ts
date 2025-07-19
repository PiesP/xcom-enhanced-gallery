/**
 * @fileoverview 표준화된 Singleton 베이스 클래스
 * @description 모든 싱글톤 클래스의 중복을 제거하고 일관된 패턴 제공
 * @version 1.0.0 - Core Layer
 */

import { logger } from '@core/logging/logger';

/**
 * 표준화된 Singleton 베이스 클래스
 *
 * 모든 싱글톤 클래스의 중복 코드를 제거하고
 * 일관된 인스턴스 관리를 제공합니다.
 *
 * @example
 * ```typescript
 * class MyService extends Singleton<MyService> {
 *   protected constructor() {
 *     super();
 *   }
 *
 *   public doSomething() {
 *     // service implementation
 *   }
 * }
 *
 * // Usage
 * const service = MyService.getInstance();
 * ```
 */
export abstract class Singleton<_T> {
  private static readonly instances = new Map<string, unknown>();

  protected constructor() {
    // 서브클래스에서 super() 호출 필요
  }

  /**
   * 싱글톤 인스턴스 가져오기
   *
   * @param key 선택적 키 (동일 클래스의 여러 인스턴스를 위해)
   * @returns 싱글톤 인스턴스
   */
  public static getInstance<T extends Singleton<T>>(this: new () => T, key?: string): T {
    const className = this.name;
    const instanceKey = key ? `${className}:${key}` : className;

    if (!Singleton.instances.has(instanceKey)) {
      try {
        const instance = new this();
        Singleton.instances.set(instanceKey, instance);
        logger.debug(`[Singleton] Created instance: ${instanceKey}`);
      } catch (error) {
        logger.error(`[Singleton] Failed to create instance: ${instanceKey}`, { error });
        throw error;
      }
    }

    return Singleton.instances.get(instanceKey) as T;
  }

  /**
   * 특정 인스턴스 재설정
   *
   * @param key 선택적 키
   * @returns 인스턴스가 제거되었는지 여부
   */
  public static resetInstance<T extends Singleton<T>>(this: new () => T, key?: string): boolean {
    const className = this.name;
    const instanceKey = key ? `${className}:${key}` : className;

    const existed = Singleton.instances.has(instanceKey);
    if (existed) {
      // cleanup 메서드가 있다면 호출
      const instance = Singleton.instances.get(instanceKey) as unknown;
      if (instance && typeof (instance as { cleanup?: () => void }).cleanup === 'function') {
        try {
          (instance as { cleanup: () => void }).cleanup();
        } catch (error) {
          logger.warn(`[Singleton] Cleanup failed for ${instanceKey}:`, { error });
        }
      }

      Singleton.instances.delete(instanceKey);
      logger.debug(`[Singleton] Reset instance: ${instanceKey}`);
    }

    return existed;
  }

  /**
   * 모든 싱글톤 인스턴스 재설정
   * 주로 테스트나 애플리케이션 종료 시 사용
   */
  public static resetAll(): void {
    const instanceCount = Singleton.instances.size;

    // 모든 인스턴스에 대해 cleanup 호출
    for (const [key, instance] of Singleton.instances.entries()) {
      if (instance && typeof (instance as { cleanup?: () => void }).cleanup === 'function') {
        try {
          (instance as { cleanup: () => void }).cleanup();
        } catch (error) {
          logger.warn(`[Singleton] Cleanup failed for ${key}:`, { error });
        }
      }
    }

    Singleton.instances.clear();
    logger.debug(`[Singleton] Reset all instances: ${instanceCount} cleared`);
  }

  /**
   * 현재 활성 인스턴스 수 반환
   */
  public static getActiveInstanceCount(): number {
    return Singleton.instances.size;
  }

  /**
   * 디버그 정보 반환
   */
  public static getDebugInfo(): Record<string, unknown> {
    const instances: string[] = [];

    for (const key of Singleton.instances.keys()) {
      instances.push(key);
    }

    return {
      totalInstances: Singleton.instances.size,
      instances,
    };
  }
}
