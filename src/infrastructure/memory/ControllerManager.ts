/**
 * @fileoverview Controller Manager - AbortController 관리
 * @version 1.0.0
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * AbortController 관리 유틸리티
 * fetch 요청과 기타 비동기 작업의 AbortController들을 추적하고 정리합니다.
 */
export class ControllerManager {
  private readonly controllers = new Map<string, AbortController>();

  /**
   * 새로운 AbortController를 생성하고 추적합니다.
   */
  public createController(key: string): AbortController {
    // 기존 controller가 있다면 중단
    const existing = this.controllers.get(key);
    if (existing) {
      existing.abort();
    }

    const controller = new AbortController();
    this.controllers.set(key, controller);

    logger.debug(`[ControllerManager] Controller created: ${key}`);
    return controller;
  }

  /**
   * 특정 controller를 가져옵니다.
   */
  public getController(key: string): AbortController | undefined {
    return this.controllers.get(key);
  }

  /**
   * 특정 controller를 중단합니다.
   */
  public abortController(key: string): void {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
      logger.debug(`[ControllerManager] Controller aborted: ${key}`);
    }
  }

  /**
   * 모든 controller를 중단합니다.
   */
  public abortAll(): void {
    const count = this.controllers.size;

    for (const [key, controller] of this.controllers) {
      controller.abort();
      logger.debug(`[ControllerManager] Controller aborted: ${key}`);
    }

    this.controllers.clear();
    logger.debug(`[ControllerManager] Aborted ${count} controllers`);
  }

  /**
   * 완료된 controller들을 정리합니다.
   */
  public cleanup(): void {
    const toRemove: string[] = [];

    for (const [key, controller] of this.controllers) {
      if (controller.signal.aborted) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      this.controllers.delete(key);
    }

    logger.debug(`[ControllerManager] Cleaned up ${toRemove.length} aborted controllers`);
  }

  /**
   * 현재 활성 controller 수 조회
   */
  public getActiveCount(): number {
    return this.controllers.size;
  }

  /**
   * 모든 활성 controller 키 목록 조회
   */
  public getActiveKeys(): string[] {
    return Array.from(this.controllers.keys());
  }

  /**
   * 특정 controller가 활성 상태인지 확인
   */
  public isActive(key: string): boolean {
    const controller = this.controllers.get(key);
    return controller ? !controller.signal.aborted : false;
  }
}
