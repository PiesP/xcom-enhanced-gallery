/**
 * @fileoverview 중앙 AbortController 관리자
 * @description Phase 1.1: AbortController 충돌 해결을 위한 통합 관리자
 * @version 1.0.0
 */

import { logger } from '@shared/logging/logger';
import type { ILogger } from './interfaces';

/**
 * 중앙 AbortController 관리자
 *
 * 기능:
 * - 여러 서비스에서 사용되는 AbortController 통합 관리
 * - 충돌 방지 및 메모리 누수 방지
 * - 개별 및 전체 abort 지원
 */
export class AbortManager {
  private readonly controllers = new Map<string, AbortController>();
  private readonly completedControllers = new Set<string>();

  // (DI Hook) 외부 로깅/메트릭 서비스 주입 가능 (테스트 DI 패턴 식별용)
  constructor(private readonly loggingService: ILogger = logger) {}

  /**
   * 새로운 AbortController 생성
   * @param id - 컨트롤러 식별자
   * @returns AbortController 인스턴스
   */
  createController(id: string): AbortController {
    // 기존 컨트롤러가 있으면 정리
    if (this.controllers.has(id)) {
      this.abort(id);
    }

    const controller = new AbortController();
    this.controllers.set(id, controller);

    // abort 시 자동 정리를 위한 리스너 등록
    controller.signal.addEventListener('abort', () => {
      this.completedControllers.add(id);
      (this.loggingService.debug || logger.debug).call(
        this.loggingService,
        `[AbortManager] Controller ${id} aborted`
      );
    });

    (this.loggingService.debug || logger.debug).call(
      this.loggingService,
      `[AbortManager] Created controller: ${id}`
    );
    return controller;
  }

  /**
   * 특정 컨트롤러 abort
   * @param id - 컨트롤러 식별자
   */
  abort(id: string): void {
    const controller = this.controllers.get(id);
    if (controller && !controller.signal.aborted) {
      controller.abort();
      (this.loggingService.debug || logger.debug).call(
        this.loggingService,
        `[AbortManager] Aborted controller: ${id}`
      );
    }
    this.controllers.delete(id);
  }

  /**
   * 모든 활성 컨트롤러 abort
   */
  abortAll(): void {
    const activeIds = Array.from(this.controllers.keys());

    (this.loggingService.debug || logger.debug).call(
      this.loggingService,
      `[AbortManager] Aborting all controllers: ${activeIds.length}`
    );

    for (const id of activeIds) {
      this.abort(id);
    }
  }

  /**
   * 완료된 컨트롤러 정리 (특정 키 또는 전체)
   */
  cleanup(id?: string): void {
    if (id) {
      // 특정 컨트롤러만 정리
      if (this.completedControllers.has(id)) {
        this.controllers.delete(id);
        this.completedControllers.delete(id);
        (this.loggingService.debug || logger.debug).call(
          this.loggingService,
          `[AbortManager] Cleaned up controller: ${id}`
        );
      }
      return;
    }

    // 모든 완료된 컨트롤러 정리
    const cleanupCount = this.completedControllers.size;

    for (const controllerId of this.completedControllers) {
      this.controllers.delete(controllerId);
    }
    this.completedControllers.clear();

    (this.loggingService.debug || logger.debug).call(
      this.loggingService,
      `[AbortManager] Cleaned up ${cleanupCount} completed controllers`
    );
  }

  /**
   * 특정 키에 대한 컨트롤러가 존재하는지 확인
   */
  public hasController(key: string): boolean {
    return this.controllers.has(key);
  }

  /**
   * 특정 키의 컨트롤러가 중단되었는지 확인
   */
  public isAborted(key: string): boolean {
    const controller = this.controllers.get(key);
    return controller?.signal.aborted ?? false;
  }

  /**
   * 현재 활성 컨트롤러 수 반환
   */
  public getActiveControllerCount(): number {
    return this.controllers.size;
  }

  /**
   * 특정 컨트롤러의 signal 반환
   */
  getSignal(id: string): AbortSignal | null {
    const controller = this.controllers.get(id);
    return controller?.signal || null;
  }

  /**
   * 모든 활성 컨트롤러 ID 목록 반환
   */
  getActiveControllerIds(): string[] {
    return Array.from(this.controllers.keys());
  }
}

/**
 * 전역 AbortManager 인스턴스
 */
export const globalAbortManager = new AbortManager();

/**
 * 편의 함수: 새 컨트롤러 생성
 */
export function createAbortController(id: string): AbortController {
  return globalAbortManager.createController(id);
}

/**
 * 편의 함수: 컨트롤러 abort
 */
export function abortController(id: string): void {
  globalAbortManager.abort(id);
}

/**
 * 편의 함수: 모든 컨트롤러 abort
 */
export function abortAllControllers(): void {
  globalAbortManager.abortAll();
}
