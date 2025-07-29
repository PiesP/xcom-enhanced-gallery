/**
 * @fileoverview Workers 유틸리티 재사용 모듈 (간단한 작업 매니저)
 * @description Phase C2: 복잡한 워커 시스템을 간단한 작업 매니저로 단순화
 */

// Phase C2: 기본 작업 매니저로 대체
export { SimpleTaskManager, globalTaskManager } from './SimpleTaskManager';
export { processImageTask, processCompressionTask } from './SimpleTaskManager';
export type { Task, TaskType } from './SimpleTaskManager';

// 하위 호환성을 위한 별칭
export { SimpleTaskManager as WorkerPoolManager } from './SimpleTaskManager';
export { globalTaskManager as workerPoolManager } from './SimpleTaskManager';
export type { TaskType as WorkerTaskType } from './SimpleTaskManager';
export type { Task as WorkerTask } from './SimpleTaskManager';
