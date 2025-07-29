/**
 * @fileoverview 간단한 작업 처리 유틸리티
 * @description 유저스크립트에 적합한 기본적인 비동기 작업 처리
 * @version 1.0.0 - Phase C2: 단순화
 */

import { logger } from '@shared/logging/logger';

/**
 * 작업 타입
 */
export type TaskType = 'image-processing' | 'compression' | 'download' | 'analysis';

/**
 * 작업 정의
 */
export interface Task<T = unknown> {
  id: string;
  type: TaskType;
  data: T;
  priority: number;
}

/**
 * 간단한 작업 처리 매니저
 */
export class SimpleTaskManager {
  private readonly taskQueue: Array<{
    task: Task;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];
  private isProcessing = false;

  /**
   * 작업 추가
   */
  async addTask<T, R>(task: Omit<Task<T>, 'id'>, processor: (data: T) => Promise<R>): Promise<R> {
    const fullTask: Task<T> = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...task,
    };

    return new Promise<R>((resolve, reject) => {
      this.taskQueue.push({
        task: fullTask,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.processQueue(processor);
    });
  }

  /**
   * 대기 중인 작업 수
   */
  getPendingTaskCount(): number {
    return this.taskQueue.length;
  }

  /**
   * 모든 작업 취소
   */
  clearTasks(): void {
    this.taskQueue.forEach(({ reject }) => {
      reject(new Error('Task cancelled'));
    });
    this.taskQueue.length = 0;
  }

  private async processQueue<T, R>(processor: (data: T) => Promise<R>): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // 우선순위 정렬
      this.taskQueue.sort((a, b) => b.task.priority - a.task.priority);

      while (this.taskQueue.length > 0) {
        const { task, resolve, reject } = this.taskQueue.shift()!;

        try {
          const result = await processor(task.data as T);
          resolve(result);
          logger.debug(`Task ${task.id} completed`);
        } catch (error) {
          reject(error);
          logger.error(`Task ${task.id} failed:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

/**
 * 글로벌 작업 매니저
 */
export const globalTaskManager = new SimpleTaskManager();

/**
 * 편의 함수: 이미지 처리 작업
 */
export async function processImageTask<T, R>(
  data: T,
  processor: (data: T) => Promise<R>,
  priority = 1
): Promise<R> {
  return globalTaskManager.addTask({ type: 'image-processing', data, priority }, processor);
}

/**
 * 편의 함수: 압축 작업
 */
export async function processCompressionTask<T, R>(
  data: T,
  processor: (data: T) => Promise<R>,
  priority = 2
): Promise<R> {
  return globalTaskManager.addTask({ type: 'compression', data, priority }, processor);
}

// 하위 호환성을 위한 별칭
export { SimpleTaskManager as WorkerPoolManager };
export { globalTaskManager as workerPoolManager };
