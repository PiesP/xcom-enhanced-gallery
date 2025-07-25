/**
 * @fileoverview Download State Management with Signals
 * @version 1.0.0 - Clean Architecture 적용
 *
 * Result 타입 패턴과 브랜드 타입을 활용한 타입 안전한 다운로드 상태 관리
 */

import type { MediaInfo, MediaId } from '@shared/types/media.types';
import type { Result } from '../../types/core/core-types';
import { getPreactSignals } from '@shared/external/vendors';
import { defaultLogger, type ILogger } from '../../services/core-services';

// Signal 타입 정의
type Signal<T> = {
  value: T;
  subscribe?: (callback: (value: T) => void) => () => void;
};

/**
 * 다운로드 작업 상태
 */
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed';

/**
 * 다운로드 작업 정보
 */
export interface DownloadTask {
  readonly id: string;
  readonly mediaId: MediaId;
  readonly mediaUrl: string;
  readonly filename: string;
  readonly status: DownloadStatus;
  readonly progress: number;
  readonly error?: string;
  readonly startedAt: number;
  readonly completedAt?: number;
}

/**
 * 다운로드 상태 인터페이스
 */
export interface DownloadState {
  readonly activeTasks: ReadonlyMap<string, DownloadTask>;
  readonly queue: readonly string[];
  readonly isProcessing: boolean;
  readonly globalProgress: number;
}

/**
 * 초기 다운로드 상태
 */
const INITIAL_STATE: DownloadState = {
  activeTasks: new Map(),
  queue: [],
  isProcessing: false,
  globalProgress: 0,
};

/**
 * 다운로드 이벤트 타입
 */
export type DownloadEvents = {
  'download:started': { taskId: string; mediaId: MediaId };
  'download:progress': { taskId: string; progress: number };
  'download:completed': { taskId: string; mediaId: MediaId };
  'download:failed': { taskId: string; error: string };
  'download:queue-updated': { queueLength: number };
};

// Preact Signals 지연 초기화
let downloadStateSignal: Signal<DownloadState> | null = null;

// 로거 인스턴스 (의존성 주입 가능)
const logger: ILogger = defaultLogger;

function getDownloadState(): Signal<DownloadState> {
  if (!downloadStateSignal) {
    const { signal } = getPreactSignals();
    downloadStateSignal = signal<DownloadState>(INITIAL_STATE);
  }
  return downloadStateSignal!;
}

/**
 * 다운로드 상태 접근자
 */
export const downloadState = {
  get value(): DownloadState {
    return getDownloadState().value;
  },

  set value(newState: DownloadState) {
    getDownloadState().value = newState;
  },

  /**
   * 상태 변경 구독
   */
  subscribe(callback: (state: DownloadState) => void): () => void {
    const { effect } = getPreactSignals();
    return effect(() => {
      callback(this.value);
    });
  },
};

/**
 * 이벤트 디스패처
 */
function dispatchEvent<K extends keyof DownloadEvents>(event: K, data: DownloadEvents[K]): void {
  const customEvent = new CustomEvent(`xeg:${event}`, {
    detail: { ...data, timestamp: Date.now() },
  });
  document.dispatchEvent(customEvent);
  logger.debug(`[Download] ${event} 이벤트 발생`, data);
}

// =============================================================================
// 액션 함수들
// =============================================================================

/**
 * 다운로드 작업 생성
 */
export function createDownloadTask(mediaInfo: MediaInfo, filename?: string): Result<string, Error> {
  try {
    // MediaInfo의 id가 없는 경우 임시 ID 생성
    const mediaId = mediaInfo.id ?? `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const taskId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task: DownloadTask = {
      id: taskId,
      mediaId: mediaId as MediaId,
      mediaUrl: mediaInfo.url,
      filename: filename ?? mediaInfo.filename ?? `media_${mediaId}`,
      status: 'pending',
      progress: 0,
      startedAt: Date.now(),
    };

    const currentState = downloadState.value;
    const newTasks = new Map(currentState.activeTasks);
    newTasks.set(taskId, task);

    downloadState.value = {
      ...currentState,
      activeTasks: newTasks,
      queue: [...currentState.queue, taskId],
    };

    logger.info(`[Download] 작업 생성: ${taskId} - ${mediaInfo.url}`);
    dispatchEvent('download:queue-updated', { queueLength: downloadState.value.queue.length });

    return { success: true, data: taskId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('[Download] 작업 생성 실패:', errorMsg);
    return { success: false, error: new Error(errorMsg) };
  }
}

/**
 * 다운로드 시작
 */
export function startDownload(taskId: string): Result<void, Error> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    const error = new Error(`Task not found: ${taskId}`);
    logger.error('[Download] 작업을 찾을 수 없음:', taskId);
    return { success: false, error };
  }

  if (task.status !== 'pending') {
    const error = new Error(`Task is not pending: ${taskId}`);
    logger.warn('[Download] 작업이 대기 상태가 아님:', task.status);
    return { success: false, error };
  }

  const updatedTask: DownloadTask = {
    ...task,
    status: 'downloading',
    startedAt: Date.now(),
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    isProcessing: true,
  };

  logger.info(`[Download] 다운로드 시작: ${taskId}`);
  dispatchEvent('download:started', { taskId, mediaId: task.mediaId });

  return { success: true, data: undefined };
}

/**
 * 다운로드 진행률 업데이트
 */
export function updateDownloadProgress(taskId: string, progress: number): Result<void, Error> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    const error = new Error(`Task not found: ${taskId}`);
    return { success: false, error };
  }

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const updatedTask: DownloadTask = {
    ...task,
    progress: clampedProgress,
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  // 전체 진행률 계산
  const allTasks = Array.from(newTasks.values());
  const totalProgress = allTasks.reduce((sum, t) => sum + t.progress, 0) / allTasks.length;

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    globalProgress: totalProgress,
  };

  dispatchEvent('download:progress', { taskId, progress: clampedProgress });

  return { success: true, data: undefined };
}

/**
 * 다운로드 완료
 */
export function completeDownload(taskId: string): Result<void, Error> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    const error = new Error(`Task not found: ${taskId}`);
    return { success: false, error };
  }

  const updatedTask: DownloadTask = {
    ...task,
    status: 'completed',
    progress: 100,
    completedAt: Date.now(),
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  const newQueue = currentState.queue.filter(id => id !== taskId);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    queue: newQueue,
    isProcessing: newQueue.length > 0,
  };

  logger.info(`[Download] 다운로드 완료: ${taskId}`);
  dispatchEvent('download:completed', { taskId, mediaId: task.mediaId });

  return { success: true, data: undefined };
}

/**
 * 다운로드 실패
 */
export function failDownload(taskId: string, error: string): Result<void, Error> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    const err = new Error(`Task not found: ${taskId}`);
    return { success: false, error: err };
  }

  const updatedTask: DownloadTask = {
    ...task,
    status: 'failed',
    error,
    completedAt: Date.now(),
  };

  const newTasks = new Map(currentState.activeTasks);
  newTasks.set(taskId, updatedTask);

  const newQueue = currentState.queue.filter(id => id !== taskId);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
    queue: newQueue,
    isProcessing: newQueue.length > 0,
  };

  logger.error(`[Download] 다운로드 실패: ${taskId} - ${error}`);
  dispatchEvent('download:failed', { taskId, error });

  return { success: true, data: undefined };
}

/**
 * 작업 제거 (완료/실패한 작업 정리)
 */
export function removeTask(taskId: string): Result<void, Error> {
  const currentState = downloadState.value;
  const task = currentState.activeTasks.get(taskId);

  if (!task) {
    const error = new Error(`Task not found: ${taskId}`);
    return { success: false, error };
  }

  if (task.status === 'downloading') {
    const error = new Error(`Cannot remove active download: ${taskId}`);
    return { success: false, error };
  }

  const newTasks = new Map(currentState.activeTasks);
  newTasks.delete(taskId);

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
  };

  logger.debug(`[Download] 작업 제거: ${taskId}`);

  return { success: true, data: undefined };
}

/**
 * 모든 완료된 작업 정리
 */
export function clearCompletedTasks(): void {
  const currentState = downloadState.value;
  const newTasks = new Map<string, DownloadTask>();

  for (const [id, task] of currentState.activeTasks) {
    if (task.status === 'downloading' || task.status === 'pending') {
      newTasks.set(id, task);
    }
  }

  downloadState.value = {
    ...currentState,
    activeTasks: newTasks,
  };

  logger.info('[Download] 완료된 작업들 정리');
}

// =============================================================================
// 선택자 함수들
// =============================================================================

/**
 * 특정 작업 가져오기
 */
export function getDownloadTask(taskId: string): DownloadTask | null {
  return downloadState.value.activeTasks.get(taskId) ?? null;
}

/**
 * 다운로드 정보 요약
 */
export function getDownloadInfo(): {
  isAnyDownloading: boolean;
  currentCount: number;
  totalCount: number;
  totalTasks: number;
  activeTasks: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
  queueLength: number;
  isProcessing: boolean;
  globalProgress: number;
} {
  const state = downloadState.value;
  const tasks = Array.from(state.activeTasks.values());

  return {
    isAnyDownloading: tasks.some(t => t.status === 'downloading'),
    currentCount: tasks.filter(t => t.status === 'downloading').length,
    totalCount: tasks.length,
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => t.status === 'downloading').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    failedTasks: tasks.filter(t => t.status === 'failed').length,
    queueLength: state.queue.length,
    isProcessing: state.isProcessing,
    globalProgress: state.globalProgress,
  };
}

/**
 * 이벤트 리스너 등록
 */
export function addEventListener<K extends keyof DownloadEvents>(
  event: K,
  handler: (data: DownloadEvents[K]) => void
): () => void {
  const eventHandler = (e: Event): void => {
    const customEvent = e as CustomEvent<DownloadEvents[K]>;
    handler(customEvent.detail);
  };

  const eventName = `xeg:${event}`;
  document.addEventListener(eventName, eventHandler);

  return () => {
    document.removeEventListener(eventName, eventHandler);
  };
}
