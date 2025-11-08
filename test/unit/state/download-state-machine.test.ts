/**
 * @fileoverview Download State Machine 테스트
 * @description 다운로드 상태 머신의 상태 전환 로직 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  DownloadStateMachine,
  type DownloadState,
  type DownloadAction,
} from '@shared/state/machines/download-state-machine';

describe('DownloadStateMachine', () => {
  setupGlobalTestIsolation();

  describe('createInitialState', () => {
    it('초기 상태를 생성해야 함', () => {
      const state = DownloadStateMachine.createInitialState();

      expect(state.status).toBe('idle');
      expect(state.queue).toEqual([]);
      expect(state.activeTask).toBeNull();
      expect(state.completedCount).toBe(0);
      expect(state.failedCount).toBe(0);
      expect(state.error).toBeNull();
    });

    it('초기 상태는 매번 새로운 객체여야 함', () => {
      const state1 = DownloadStateMachine.createInitialState();
      const state2 = DownloadStateMachine.createInitialState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('상태 전환: idle → queued', () => {
    let state: DownloadState;

    beforeEach(() => {
      state = DownloadStateMachine.createInitialState();
    });

    it('ENQUEUE 액션으로 idle에서 queued로 전환', () => {
      const action: DownloadAction = {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      };

      const result = DownloadStateMachine.transition(state, action);

      expect(result.newState.status).toBe('queued');
      expect(result.newState.queue).toEqual(['task-1']);
      expect(result.shouldSync).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('여러 작업을 queue에 추가할 수 있어야 함', () => {
      const state1 = DownloadStateMachine.createInitialState();

      const result1 = DownloadStateMachine.transition(state1, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image1.jpg',
          mediaUrl: 'https://example.com/image1.jpg',
        },
      });

      const result2 = DownloadStateMachine.transition(result1.newState, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-2',
          mediaId: 'media-2',
          filename: 'image2.jpg',
          mediaUrl: 'https://example.com/image2.jpg',
        },
      });

      expect(result2.newState.queue).toEqual(['task-1', 'task-2']);
      expect(result2.newState.status).toBe('queued');
    });

    it('중복 taskId ENQUEUE는 무시해야 함', () => {
      const state1 = DownloadStateMachine.createInitialState();

      const result1 = DownloadStateMachine.transition(state1, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      });

      const result2 = DownloadStateMachine.transition(result1.newState, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      });

      expect(result2.newState.queue).toEqual(['task-1']);
      expect(result2.isDuplicate).toBe(true);
    });
  });

  describe('상태 전환: queued → processing', () => {
    let state: DownloadState;

    beforeEach(() => {
      state = DownloadStateMachine.createInitialState();
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      }).newState;
    });

    it('START 액션으로 queued에서 processing으로 전환', () => {
      const action: DownloadAction = {
        type: 'START',
        payload: {
          taskId: 'task-1',
        },
      };

      const result = DownloadStateMachine.transition(state, action);

      expect(result.newState.status).toBe('processing');
      expect(result.newState.activeTask).toBe('task-1');
      expect(result.newState.queue).toEqual([]);
      expect(result.shouldSync).toBe(true);
    });

    it('START 액션으로 queue에서 작업을 제거해야 함', () => {
      const state1 = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-2',
          mediaId: 'media-2',
          filename: 'image2.jpg',
          mediaUrl: 'https://example.com/image2.jpg',
        },
      }).newState;

      const result = DownloadStateMachine.transition(state1, {
        type: 'START',
        payload: { taskId: 'task-1' },
      });

      expect(result.newState.activeTask).toBe('task-1');
      expect(result.newState.queue).toEqual(['task-2']);
    });
  });

  describe('상태 전환: processing → complete', () => {
    let state: DownloadState;

    beforeEach(() => {
      state = DownloadStateMachine.createInitialState();
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      }).newState;
      state = DownloadStateMachine.transition(state, {
        type: 'START',
        payload: { taskId: 'task-1' },
      }).newState;
    });

    it('COMPLETE 액션으로 processing에서 complete로 전환', () => {
      const action: DownloadAction = {
        type: 'COMPLETE',
        payload: {
          taskId: 'task-1',
        },
      };

      const result = DownloadStateMachine.transition(state, action);

      expect(result.newState.status).toBe('idle');
      expect(result.newState.activeTask).toBeNull();
      expect(result.newState.completedCount).toBe(1);
      expect(result.shouldSync).toBe(true);
    });

    it('queue가 비어있지 않으면 다음 작업으로 자동 전환', () => {
      const state1 = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-2',
          mediaId: 'media-2',
          filename: 'image2.jpg',
          mediaUrl: 'https://example.com/image2.jpg',
        },
      }).newState;

      const result = DownloadStateMachine.transition(state1, {
        type: 'COMPLETE',
        payload: { taskId: 'task-1' },
      });

      expect(result.newState.status).toBe('processing');
      expect(result.newState.activeTask).toBe('task-2');
      expect(result.newState.queue).toEqual([]);
    });
  });

  describe('상태 전환: processing → error', () => {
    let state: DownloadState;

    beforeEach(() => {
      state = DownloadStateMachine.createInitialState();
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      }).newState;
      state = DownloadStateMachine.transition(state, {
        type: 'START',
        payload: { taskId: 'task-1' },
      }).newState;
    });

    it('FAIL 액션으로 processing에서 error로 전환', () => {
      const action: DownloadAction = {
        type: 'FAIL',
        payload: {
          taskId: 'task-1',
          error: 'Network error',
        },
      };

      const result = DownloadStateMachine.transition(state, action);

      expect(result.newState.status).toBe('idle');
      expect(result.newState.activeTask).toBeNull();
      expect(result.newState.failedCount).toBe(1);
      expect(result.newState.error).toBe('Network error');
      expect(result.shouldSync).toBe(true);
    });

    it('실패 후에도 queue에 작업이 있으면 다음 작업 시작', () => {
      const state1 = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-2',
          mediaId: 'media-2',
          filename: 'image2.jpg',
          mediaUrl: 'https://example.com/image2.jpg',
        },
      }).newState;

      const result = DownloadStateMachine.transition(state1, {
        type: 'FAIL',
        payload: {
          taskId: 'task-1',
          error: 'Network error',
        },
      });

      expect(result.newState.status).toBe('processing');
      expect(result.newState.activeTask).toBe('task-2');
      expect(result.newState.failedCount).toBe(1);
    });
  });

  describe('상태 전환: * → CANCEL (queue 정리)', () => {
    let state: DownloadState;

    beforeEach(() => {
      state = DownloadStateMachine.createInitialState();
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      }).newState;
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-2',
          mediaId: 'media-2',
          filename: 'image2.jpg',
          mediaUrl: 'https://example.com/image2.jpg',
        },
      }).newState;
    });

    it('CANCEL 액션으로 queue 정리', () => {
      const result = DownloadStateMachine.transition(state, {
        type: 'CANCEL',
      });

      expect(result.newState.queue).toEqual([]);
      expect(result.newState.status).toBe('idle');
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('상태 전환: RESET', () => {
    let state: DownloadState;

    beforeEach(() => {
      state = DownloadStateMachine.createInitialState();
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      }).newState;
      state = DownloadStateMachine.transition(state, {
        type: 'START',
        payload: { taskId: 'task-1' },
      }).newState;
      state = DownloadStateMachine.transition(state, {
        type: 'COMPLETE',
        payload: { taskId: 'task-1' },
      }).newState;
    });

    it('RESET 액션으로 완전 초기화', () => {
      const result = DownloadStateMachine.transition(state, {
        type: 'RESET',
      });

      const initialState = DownloadStateMachine.createInitialState();
      expect(result.newState).toEqual(initialState);
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('에러 케이스', () => {
    let state: DownloadState;

    beforeEach(() => {
      state = DownloadStateMachine.createInitialState();
    });

    it('잘못된 taskId로 START할 수 없어야 함', () => {
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      }).newState;

      const result = DownloadStateMachine.transition(state, {
        type: 'START',
        payload: { taskId: 'task-99' },
      });

      expect(result.isValid).toBe(false);
      expect(result.newState).toEqual(state);
    });

    it('이미 처리 중인 작업을 COMPLETE할 수 없어야 함', () => {
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image.jpg',
          mediaUrl: 'https://example.com/image.jpg',
        },
      }).newState;
      state = DownloadStateMachine.transition(state, {
        type: 'START',
        payload: { taskId: 'task-1' },
      }).newState;

      const result = DownloadStateMachine.transition(state, {
        type: 'COMPLETE',
        payload: { taskId: 'task-1' },
      });

      expect(result.newState.completedCount).toBe(1);
    });
  });

  describe('통합 시나리오', () => {
    it('전체 다운로드 흐름: 3개 작업 순차 처리', () => {
      let state = DownloadStateMachine.createInitialState();

      // 1. 3개 작업 queue
      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-1',
          mediaId: 'media-1',
          filename: 'image1.jpg',
          mediaUrl: 'https://example.com/image1.jpg',
        },
      }).newState;

      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-2',
          mediaId: 'media-2',
          filename: 'image2.jpg',
          mediaUrl: 'https://example.com/image2.jpg',
        },
      }).newState;

      state = DownloadStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          taskId: 'task-3',
          mediaId: 'media-3',
          filename: 'image3.jpg',
          mediaUrl: 'https://example.com/image3.jpg',
        },
      }).newState;

      expect(state.queue.length).toBe(3);
      expect(state.status).toBe('queued');

      // 2. task-1 시작
      state = DownloadStateMachine.transition(state, {
        type: 'START',
        payload: { taskId: 'task-1' },
      }).newState;

      expect(state.status).toBe('processing');
      expect(state.activeTask).toBe('task-1');
      expect(state.queue.length).toBe(2);

      // 3. task-1 완료 → task-2 자동 시작
      state = DownloadStateMachine.transition(state, {
        type: 'COMPLETE',
        payload: { taskId: 'task-1' },
      }).newState;

      expect(state.completedCount).toBe(1);
      expect(state.activeTask).toBe('task-2');
      expect(state.queue.length).toBe(1);

      // 4. task-2 완료 → task-3 자동 시작
      state = DownloadStateMachine.transition(state, {
        type: 'COMPLETE',
        payload: { taskId: 'task-2' },
      }).newState;

      expect(state.completedCount).toBe(2);
      expect(state.activeTask).toBe('task-3');
      expect(state.queue.length).toBe(0);

      // 5. task-3 완료 → idle
      state = DownloadStateMachine.transition(state, {
        type: 'COMPLETE',
        payload: { taskId: 'task-3' },
      }).newState;

      expect(state.completedCount).toBe(3);
      expect(state.status).toBe('idle');
      expect(state.activeTask).toBeNull();
      expect(state.queue.length).toBe(0);
    });
  });
});
