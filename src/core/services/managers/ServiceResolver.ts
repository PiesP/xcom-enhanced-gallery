/**
 * @fileoverview Service Resolver
 * @version 3.0.0
 *
 * ServiceRegistry 의존성을 제거하고 ServiceConfig를 직접 받아서 처리
 * 기본적인 서비스 인스턴스 생성에 집중
 */

import { logger } from '@core/logging/logger';
import type { BaseService, ServiceConfig } from '../ServiceManager';

/**
 * 서비스 상태
 */
export type ServiceState = 'registered' | 'initializing' | 'initialized' | 'error' | 'destroyed';

/**
 * 서비스 인스턴스 레코드
 */
export interface ServiceInstance<T = unknown> {
  instance?: T;
  state: ServiceState;
  error?: Error;
  createdAt?: number;
}

/**
 * 서비스 해결자
 * 기본적인 서비스 생성에 집중
 */
export class ServiceResolver {
  private readonly instances = new Map<string, ServiceInstance>();

  /**
   * 서비스 설정을 받아서 인스턴스를 해결합니다
   */
  public async resolve<T = BaseService>(name: string, config: ServiceConfig<T>): Promise<T> {
    let instance = this.instances.get(name);

    if (!instance) {
      instance = { state: 'registered' };
      this.instances.set(name, instance);
    }

    // 이미 해결된 경우
    if (instance.instance && instance.state === 'initialized') {
      return instance.instance as T;
    }

    // 초기화 중인 경우 대기
    if (instance.state === 'initializing') {
      await this.waitForInitialization(name);
      const waitedInstance = this.instances.get(name);
      if (waitedInstance?.instance) {
        return waitedInstance.instance as T;
      }
    }

    // 에러 상태인 경우 재시도
    if (instance.state === 'error') {
      logger.warn(`Retrying failed service: ${name}`);
    }

    instance.state = 'initializing';

    try {
      const serviceInstance = await config.factory();
      instance.instance = serviceInstance;
      instance.state = 'initialized';
      instance.createdAt = Date.now();

      logger.debug(`Service resolved: ${name}`);
      return serviceInstance as T;
    } catch (error) {
      instance.state = 'error';
      instance.error = error as Error;
      logger.error(`Failed to resolve service ${name}:`, error);
      throw error;
    }
  }

  /**
   * 서비스 초기화 상태 확인
   */
  public isInitialized(name: string): boolean {
    const instance = this.instances.get(name);
    return instance?.state === 'initialized' && !!instance.instance;
  }

  /**
   * 서비스 상태 조회
   */
  public getState(name: string): ServiceState {
    return this.instances.get(name)?.state ?? 'registered';
  }

  /**
   * 초기화된 서비스 목록
   */
  public getInitializedServices(): string[] {
    return Array.from(this.instances.entries())
      .filter(([, instance]) => instance.state === 'initialized')
      .map(([name]) => name);
  }

  /**
   * 서비스 인스턴스 직접 조회
   */
  public getInstance<T = BaseService>(name: string): T {
    const instance = this.instances.get(name);
    if (!instance?.instance || instance.state !== 'initialized') {
      throw new Error(`Service not initialized: ${name}`);
    }
    return instance.instance as T;
  }

  /**
   * 모든 서비스 정리
   */
  public async destroyAll(): Promise<void> {
    const destroyPromises: Promise<void>[] = [];

    for (const [name, instance] of this.instances) {
      if (instance.instance && instance.state === 'initialized') {
        instance.state = 'destroyed';

        // Cleanup 메서드가 있으면 호출
        const serviceInstance = instance.instance as Record<string, unknown>;
        if (typeof serviceInstance.cleanup === 'function') {
          destroyPromises.push(
            Promise.resolve(serviceInstance.cleanup()).catch((error: Error) =>
              logger.error(`Failed to cleanup service ${name}:`, error)
            )
          );
        }
      }
    }

    await Promise.all(destroyPromises);
    this.instances.clear();
  }

  /**
   * 초기화 완료 대기
   */
  private async waitForInitialization(name: string, timeout = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const instance = this.instances.get(name);
      if (!instance || instance.state !== 'initializing') {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }

    throw new Error(`Service initialization timeout: ${name}`);
  }
}
