/**
 * @fileoverview 기본 서비스 구현체
 * @description 중복되는 서비스 패턴을 통합한 베이스 클래스
 * @version 1.0.0 - Phase 2: 중복 통합
 */

import { logger } from '@shared/logging';
import type { BaseService } from '@shared/types/app.types';

/**
 * 기본 서비스 구현체
 *
 * 모든 서비스에서 공통으로 사용되는 패턴을 통합:
 * - 싱글톤 패턴
 * - 초기화 상태 관리
 * - BaseService 인터페이스 구현
 * - 표준 로깅
 */
export abstract class BaseServiceImpl implements BaseService {
  protected _isInitialized = false;
  protected readonly serviceName: string;

  protected constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * 서비스 초기화
   * 서브클래스에서 필요한 경우 onInitialize를 오버라이드하여 구현
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }

    logger.info(`${this.serviceName} initializing...`);

    try {
      await this.onInitialize();
      this._isInitialized = true;
      logger.info(`${this.serviceName} initialized`);
    } catch (error) {
      logger.error(`${this.serviceName} initialization failed:`, error);
      throw error;
    }
  }

  /**
   * 서비스 정리
   * 서브클래스에서 필요한 경우 onDestroy를 오버라이드하여 구현
   */
  public destroy(): void {
    if (!this._isInitialized) {
      return;
    }

    logger.info(`${this.serviceName} destroying...`);

    try {
      this.onDestroy();
      this._isInitialized = false;
      logger.info(`${this.serviceName} destroyed`);
    } catch (error) {
      logger.error(`${this.serviceName} destroy failed:`, error);
    }
  }

  /**
   * 초기화 상태 확인
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 서브클래스에서 구현할 초기화 로직
   */
  protected abstract onInitialize(): Promise<void> | void;

  /**
   * 서브클래스에서 구현할 정리 로직
   */
  protected abstract onDestroy(): void;
}

/**
 * 싱글톤 서비스 베이스 클래스
 *
 * 싱글톤 패턴을 자동으로 처리하는 베이스 클래스
 */
export abstract class SingletonServiceImpl extends BaseServiceImpl {
  private static readonly instances = new Map<string, BaseServiceImpl>();

  protected constructor(serviceName: string) {
    super(serviceName);
  }

  /**
   * 싱글톤 인스턴스 가져오기
   * 서브클래스에서 타입 안전성을 위해 래핑하여 사용
   */
  protected static getSingletonInstance<T extends BaseServiceImpl>(
    serviceClass: new (...args: unknown[]) => T,
    serviceName: string,
    ...constructorArgs: unknown[]
  ): T {
    if (!this.instances.has(serviceName)) {
      const instance = new serviceClass(...constructorArgs);
      this.instances.set(serviceName, instance);
    }
    return this.instances.get(serviceName) as T;
  }

  /**
   * 싱글톤 인스턴스 초기화 (테스트용)
   */
  protected static resetSingleton(serviceName: string): void {
    if (this.instances.has(serviceName)) {
      const instance = this.instances.get(serviceName);
      instance?.destroy();
      this.instances.delete(serviceName);
    }
  }
}
