/**
 * @fileoverview 배치 DOM 업데이트 매니저
 * @description Phase 6: requestAnimationFrame을 활용한 DOM 최적화
 * @version 6.0.0
 */

import { logger } from '@shared/logging/logger';
import { rafThrottle } from '@shared/utils/performance/performance-utils';

/**
 * DOM 업데이트 작업 타입
 */
export enum DOMUpdateType {
  STYLE = 'style',
  ATTRIBUTE = 'attribute',
  TEXT_CONTENT = 'textContent',
  CLASS_LIST = 'classList',
  PROPERTY = 'property',
  INSERT = 'insert',
  REMOVE = 'remove',
}

/**
 * DOM 업데이트 작업
 */
export interface DOMUpdateTask {
  id: string;
  type: DOMUpdateType;
  element: HTMLElement;
  property?: string;
  value?: unknown;
  priority: number;
  callback?: () => void;
}

/**
 * 스타일 변경 배치
 */
interface StyleBatch {
  element: HTMLElement;
  changes: Record<string, string>;
}

/**
 * 클래스 변경 배치
 */
interface ClassBatch {
  element: HTMLElement;
  add: Set<string>;
  remove: Set<string>;
}

/**
 * 배치 업데이트 옵션
 */
interface BatchUpdateOptions {
  /** 배치 크기 임계값 */
  batchSizeThreshold: number;
  /** 지연 시간 (ms) */
  debounceTime: number;
  /** 우선순위 임계값 */
  priorityThreshold: number;
  /** 성능 모니터링 활성화 */
  enablePerformanceMonitoring: boolean;
}

/**
 * 성능 메트릭
 */
interface PerformanceMetrics {
  totalUpdates: number;
  batchedUpdates: number;
  averageBatchSize: number;
  totalTime: number;
  averageTime: number;
  layoutThrashingPrevented: number;
}

/**
 * 배치 DOM 업데이트 매니저
 *
 * 특징:
 * - requestAnimationFrame 기반 배치 처리
 * - Layout thrashing 방지
 * - 우선순위 기반 스케줄링
 * - 성능 모니터링
 */
export class BatchDOMUpdateManager {
  private static instance: BatchDOMUpdateManager;

  private readonly options: Required<BatchUpdateOptions>;
  private readonly updateQueue: DOMUpdateTask[] = [];
  private readonly styleBatches = new Map<HTMLElement, StyleBatch>();
  private readonly classBatches = new Map<HTMLElement, ClassBatch>();

  private rafId: number | null = null;
  private isProcessing = false;
  private metrics: PerformanceMetrics;

  private readonly processUpdates: () => void;

  private constructor(options: Partial<BatchUpdateOptions> = {}) {
    this.options = {
      batchSizeThreshold: options.batchSizeThreshold ?? 50,
      debounceTime: options.debounceTime ?? 16, // ~60fps
      priorityThreshold: options.priorityThreshold ?? 100,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
    };

    this.metrics = this.initializeMetrics();
    this.processUpdates = rafThrottle(this.executeBatch.bind(this), {
      leading: false,
      trailing: true,
    });
  }

  /**
   * Get pending updates for testing
   */
  getPendingUpdates(): DOMUpdateTask[] {
    return [...this.updateQueue];
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(options?: Partial<BatchUpdateOptions>): BatchDOMUpdateManager {
    if (!this.instance) {
      this.instance = new BatchDOMUpdateManager(options);
    }
    return this.instance;
  }

  /**
   * 메트릭 초기화
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      totalUpdates: 0,
      batchedUpdates: 0,
      averageBatchSize: 0,
      totalTime: 0,
      averageTime: 0,
      layoutThrashingPrevented: 0,
    };
  }

  /**
   * DOM 업데이트 스케줄링
   */
  scheduleUpdate(task: Omit<DOMUpdateTask, 'id'>): string {
    const fullTask: DOMUpdateTask = {
      ...task,
      id: this.generateTaskId(),
    };

    // 우선순위 기반 삽입
    const insertIndex = this.updateQueue.findIndex(t => t.priority < fullTask.priority);
    if (insertIndex === -1) {
      this.updateQueue.push(fullTask);
    } else {
      this.updateQueue.splice(insertIndex, 0, fullTask);
    }

    // 배치 처리 최적화
    this.optimizeBatch(fullTask);

    // 높은 우선순위 작업은 즉시 처리
    if (fullTask.priority >= this.options.priorityThreshold) {
      this.executeImmediately(fullTask);
    } else {
      this.scheduleExecution();
    }

    return fullTask.id;
  }

  /**
   * 스타일 업데이트 (편의 메서드)
   */
  updateStyle(element: HTMLElement, styles: Record<string, string>, priority = 0): string {
    return this.scheduleUpdate({
      type: DOMUpdateType.STYLE,
      element,
      value: styles,
      priority,
    });
  }

  /**
   * 클래스 업데이트 (편의 메서드)
   */
  updateClass(
    element: HTMLElement,
    action: 'add' | 'remove' | 'toggle',
    className: string,
    priority = 0
  ): string {
    return this.scheduleUpdate({
      type: DOMUpdateType.CLASS_LIST,
      element,
      property: action,
      value: className,
      priority,
    });
  }

  /**
   * 텍스트 콘텐츠 업데이트 (편의 메서드)
   */
  updateTextContent(element: HTMLElement, text: string, priority = 0): string {
    return this.scheduleUpdate({
      type: DOMUpdateType.TEXT_CONTENT,
      element,
      value: text,
      priority,
    });
  }

  /**
   * 배치 최적화
   */
  private optimizeBatch(task: DOMUpdateTask): void {
    switch (task.type) {
      case DOMUpdateType.STYLE:
        this.optimizeStyleBatch(task);
        break;
      case DOMUpdateType.CLASS_LIST:
        this.optimizeClassBatch(task);
        break;
    }
  }

  /**
   * 스타일 배치 최적화
   */
  private optimizeStyleBatch(task: DOMUpdateTask): void {
    if (!task.value || typeof task.value !== 'object') return;

    let batch = this.styleBatches.get(task.element);
    if (!batch) {
      batch = { element: task.element, changes: {} };
      this.styleBatches.set(task.element, batch);
    }

    // 스타일 변경사항 병합
    Object.assign(batch.changes, task.value);
  }

  /**
   * 클래스 배치 최적화
   */
  private optimizeClassBatch(task: DOMUpdateTask): void {
    if (!task.property || !task.value) return;

    let batch = this.classBatches.get(task.element);
    if (!batch) {
      batch = { element: task.element, add: new Set(), remove: new Set() };
      this.classBatches.set(task.element, batch);
    }

    const className = task.value as string;
    switch (task.property) {
      case 'add':
        batch.add.add(className);
        batch.remove.delete(className);
        break;
      case 'remove':
        batch.remove.add(className);
        batch.add.delete(className);
        break;
      case 'toggle':
        if (task.element.classList.contains(className)) {
          batch.remove.add(className);
          batch.add.delete(className);
        } else {
          batch.add.add(className);
          batch.remove.delete(className);
        }
        break;
    }
  }

  /**
   * 실행 스케줄링
   */
  private scheduleExecution(): void {
    if (this.rafId !== null) return;

    // 배치 크기 체크
    if (this.updateQueue.length >= this.options.batchSizeThreshold) {
      this.executeImmediately();
      return;
    }

    // RAF로 다음 프레임에 실행
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.processUpdates();
    });
  }

  /**
   * 즉시 실행
   */
  private executeImmediately(singleTask?: DOMUpdateTask): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (singleTask) {
      this.executeSingleTask(singleTask);
    } else {
      this.executeBatch();
    }
  }

  /**
   * 단일 작업 실행
   */
  private executeSingleTask(task: DOMUpdateTask): void {
    const startTime = this.options.enablePerformanceMonitoring ? performance.now() : 0;

    try {
      this.applyUpdate(task);

      if (task.callback) {
        task.callback();
      }
    } catch (error) {
      logger.error('DOM update failed:', error);
    }

    if (this.options.enablePerformanceMonitoring) {
      this.updateMetrics(1, performance.now() - startTime);
    }
  }

  /**
   * 배치 실행
   */
  private executeBatch(): void {
    if (this.isProcessing || this.updateQueue.length === 0) return;

    this.isProcessing = true;
    const startTime = this.options.enablePerformanceMonitoring ? performance.now() : 0;
    const batchSize = this.updateQueue.length;

    try {
      // 1단계: 읽기 작업 (Layout 유발 방지)
      this.executeReadPhase();

      // 2단계: 쓰기 작업 (DOM 변경)
      this.executeWritePhase();

      // 3단계: 배치 최적화 적용
      this.applyBatchOptimizations();

      // 4단계: 콜백 실행
      this.executeCallbacks();
    } catch (error) {
      logger.error('Batch DOM update failed:', error);
    } finally {
      this.updateQueue.length = 0;
      this.styleBatches.clear();
      this.classBatches.clear();
      this.isProcessing = false;

      if (this.options.enablePerformanceMonitoring) {
        this.updateMetrics(batchSize, performance.now() - startTime);
      }
    }
  }

  /**
   * 읽기 단계 실행
   */
  private executeReadPhase(): void {
    // DOM 속성 읽기가 필요한 작업들을 먼저 처리
    // Layout thrashing 방지를 위해 모든 읽기를 먼저 수행
    for (const task of this.updateQueue) {
      if (this.requiresRead(task)) {
        // 읽기 작업 수행 (예: 현재 스타일 값 캐싱)
        this.cacheCurrentValues(task);
      }
    }
  }

  /**
   * 쓰기 단계 실행
   */
  private executeWritePhase(): void {
    for (const task of this.updateQueue) {
      if (!this.isBatchOptimized(task)) {
        this.applyUpdate(task);
      }
    }
  }

  /**
   * 배치 최적화 적용
   */
  private applyBatchOptimizations(): void {
    // 스타일 배치 적용
    for (const batch of this.styleBatches.values()) {
      Object.assign(batch.element.style, batch.changes);
    }

    // 클래스 배치 적용
    for (const batch of this.classBatches.values()) {
      batch.remove.forEach(className => {
        batch.element.classList.remove(className);
      });
      batch.add.forEach(className => {
        batch.element.classList.add(className);
      });
    }

    if (this.options.enablePerformanceMonitoring) {
      this.metrics.layoutThrashingPrevented += this.styleBatches.size + this.classBatches.size;
    }
  }

  /**
   * 콜백 실행
   */
  private executeCallbacks(): void {
    for (const task of this.updateQueue) {
      if (task.callback) {
        try {
          task.callback();
        } catch (error) {
          logger.error('DOM update callback failed:', error);
        }
      }
    }
  }

  /**
   * DOM 업데이트 적용
   */
  private applyUpdate(task: DOMUpdateTask): void {
    const { element, type, property, value } = task;

    switch (type) {
      case DOMUpdateType.STYLE:
        if (property && typeof value === 'string') {
          (element.style as unknown as Record<string, string>)[property] = value as string;
        } else if (typeof value === 'object' && value !== null) {
          Object.assign(element.style, value);
        }
        break;

      case DOMUpdateType.ATTRIBUTE:
        if (property) {
          if (value === null || value === undefined) {
            element.removeAttribute(property);
          } else {
            element.setAttribute(property, String(value));
          }
        }
        break;

      case DOMUpdateType.TEXT_CONTENT:
        element.textContent = String(value ?? '');
        break;

      case DOMUpdateType.CLASS_LIST:
        if (property && typeof value === 'string') {
          switch (property) {
            case 'add':
              element.classList.add(value);
              break;
            case 'remove':
              element.classList.remove(value);
              break;
            case 'toggle':
              element.classList.toggle(value);
              break;
          }
        }
        break;

      case DOMUpdateType.PROPERTY:
        if (property) {
          (element as unknown as Record<string, unknown>)[property] = value;
        }
        break;

      case DOMUpdateType.INSERT:
        if (value instanceof Node && element.parentNode) {
          element.parentNode.insertBefore(value, element.nextSibling);
        }
        break;

      case DOMUpdateType.REMOVE:
        element.remove();
        break;
    }
  }

  /**
   * 읽기가 필요한 작업인지 확인
   */
  private requiresRead(task: DOMUpdateTask): boolean {
    return task.type === DOMUpdateType.STYLE && task.property === 'computed';
  }

  /**
   * 현재 값 캐싱
   */
  private cacheCurrentValues(_task: DOMUpdateTask): void {
    // 현재 스타일 값 등을 캐싱
    // 실제 구현에서는 필요에 따라 구현
  }

  /**
   * 배치 최적화된 작업인지 확인
   */
  private isBatchOptimized(task: DOMUpdateTask): boolean {
    switch (task.type) {
      case DOMUpdateType.STYLE:
        return this.styleBatches.has(task.element);
      case DOMUpdateType.CLASS_LIST:
        return this.classBatches.has(task.element);
      default:
        return false;
    }
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(batchSize: number, duration: number): void {
    this.metrics.totalUpdates += batchSize;
    this.metrics.batchedUpdates++;
    this.metrics.totalTime += duration;

    this.metrics.averageBatchSize = this.metrics.totalUpdates / this.metrics.batchedUpdates;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.batchedUpdates;
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 메트릭 리셋
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * 대기 중인 업데이트 강제 실행
   */
  flush(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.executeBatch();
  }

  /**
   * 정리
   */
  dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.updateQueue.length = 0;
    this.styleBatches.clear();
    this.classBatches.clear();
    this.isProcessing = false;

    BatchDOMUpdateManager.instance = undefined as unknown as BatchDOMUpdateManager;
  }

  /**
   * 작업 ID 생성
   */
  private generateTaskId(): string {
    return `dom_update_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}
