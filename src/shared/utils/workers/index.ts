/**
 * @fileoverview Workers 유틸리티 재사용 모듈 (간단한 작업 매니저)
 * @description Phase C2: 복잡한 워커 시스템을 간단한 작업 매니저로 단순화
 */

// Phase C2: 기본 작업 매니저로 대체
export { TaskManager, globalTaskManager } from './TaskManager';
export { processImageTask, processCompressionTask } from './TaskManager';
export type { Task, TaskType } from './TaskManager';

// 하위 호환성을 위한 별칭
export { TaskManager as WorkerPoolManager } from './TaskManager';
export { globalTaskManager as workerPoolManager } from './TaskManager';
export type { TaskType as WorkerTaskType } from './TaskManager';
export type { Task as WorkerTask } from './TaskManager';
