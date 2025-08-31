/**
 * @fileoverview ApplicationLifecycle - 애플리케이션 생명주기 관리자
 * @description TDD Phase 2 - GREEN 단계: 최소 구현
 *
 * main.ts의 복잡한 초기화 로직을 체계적으로 관리하는 클래스
 */

import { logger } from '@shared/logging/logger';

/**
 * 단계 실행 함수 타입
 */
export type StageHandler = () => Promise<void>;

/**
 * 단계 실행 결과 인터페이스
 */
export interface StageExecutionResult {
  name: string;
  duration: number;
  success: boolean;
  error?: Error;
}

/**
 * 전체 실행 결과 인터페이스
 */
export interface LifecycleExecutionResult {
  totalTime: number;
  stages: StageExecutionResult[];
  success: boolean;
}

/**
 * 애플리케이션 생명주기 관리자
 *
 * 책임:
 * - 초기화 단계 등록/관리
 * - 순차적 단계 실행
 * - 에러 처리 및 복구
 * - 실행 상태 추적
 */
export class ApplicationLifecycle {
  private readonly stages = new Map<string, StageHandler>();
  private isRunningFlag = false;

  /**
   * 초기화 단계 추가
   *
   * @param name 단계 이름
   * @param handler 단계 실행 함수
   * @param allowOverwrite 덮어쓰기 허용 여부 (기본: true)
   */
  public addStage(name: string, handler: StageHandler, allowOverwrite = true): void {
    // 덮어쓰기 방지 검사
    if (!allowOverwrite && this.stages.has(name)) {
      throw new Error(`Stage already exists: ${name}`);
    }

    this.stages.set(name, handler);
    logger.debug(`[ApplicationLifecycle] 단계 등록: ${name}`);
  }

  /**
   * 라이프사이클 시작
   *
   * @returns 완료 Promise
   */
  public async start(): Promise<void> {
    // 중복 실행 방지
    if (this.isRunningFlag) {
      throw new Error('Lifecycle is already running');
    }

    this.isRunningFlag = true;

    try {
      logger.info(`[ApplicationLifecycle] 생명주기 시작: ${this.stages.size}개 단계`);

      // 등록된 순서대로 단계 실행
      for (const [name, handler] of this.stages) {
        logger.debug(`[ApplicationLifecycle] 단계 실행: ${name}`);
        await handler();
        logger.debug(`[ApplicationLifecycle] 단계 완료: ${name}`);
      }

      logger.info('[ApplicationLifecycle] 생명주기 완료');
    } finally {
      this.isRunningFlag = false;
    }
  }

  /**
   * 실행 시간 측정과 함께 라이프사이클 시작
   *
   * @returns 실행 결과
   */
  public async startWithTiming(): Promise<LifecycleExecutionResult> {
    if (this.isRunningFlag) {
      throw new Error('Lifecycle is already running');
    }

    this.isRunningFlag = true;
    const startTime = performance.now();
    const stageResults: StageExecutionResult[] = [];

    try {
      logger.info(
        `[ApplicationLifecycle] 시간 측정 모드로 생명주기 시작: ${this.stages.size}개 단계`
      );

      for (const [name, handler] of this.stages) {
        const stageStartTime = performance.now();
        let stageResult: StageExecutionResult;

        try {
          await handler();
          const stageEndTime = performance.now();
          stageResult = {
            name,
            duration: stageEndTime - stageStartTime,
            success: true,
          };
          logger.debug(
            `[ApplicationLifecycle] 단계 완료: ${name} (${stageResult.duration.toFixed(2)}ms)`
          );
        } catch (error) {
          const stageEndTime = performance.now();
          stageResult = {
            name,
            duration: stageEndTime - stageStartTime,
            success: false,
            error: error as Error,
          };
          stageResults.push(stageResult);
          throw error; // 에러 재전파
        }

        stageResults.push(stageResult);
      }

      const endTime = performance.now();
      const result: LifecycleExecutionResult = {
        totalTime: endTime - startTime,
        stages: stageResults,
        success: true,
      };

      logger.info(`[ApplicationLifecycle] 생명주기 완료 (총 ${result.totalTime.toFixed(2)}ms)`);
      return result;
    } catch {
      const endTime = performance.now();
      return {
        totalTime: endTime - startTime,
        stages: stageResults,
        success: false,
      };
    } finally {
      this.isRunningFlag = false;
    }
  }

  /**
   * 실행 상태 확인
   *
   * @returns 실행 중 여부
   */
  public isRunning(): boolean {
    return this.isRunningFlag;
  }

  /**
   * 단계 존재 여부 확인
   *
   * @param name 단계 이름
   * @returns 존재 여부
   */
  public hasStage(name: string): boolean {
    return this.stages.has(name);
  }

  /**
   * 등록된 단계 목록 반환
   *
   * @returns 단계 이름 배열
   */
  public getStages(): string[] {
    return Array.from(this.stages.keys());
  }

  /**
   * 단계 제거
   *
   * @param name 제거할 단계 이름
   * @returns 제거 성공 여부
   */
  public removeStage(name: string): boolean {
    const removed = this.stages.delete(name);
    if (removed) {
      logger.debug(`[ApplicationLifecycle] 단계 제거: ${name}`);
    }
    return removed;
  }

  /**
   * 모든 단계 초기화 (테스트용)
   */
  public reset(): void {
    this.stages.clear();
    this.isRunningFlag = false;
    logger.debug('[ApplicationLifecycle] 모든 단계 초기화됨');
  }
}
