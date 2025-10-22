/**
 * @fileoverview Toast State Machine 테스트
 * @description 토스트 알림 상태 머신의 상태 전환 로직 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ToastStateMachine,
  type ToastState,
  type ToastAction,
  type ToastItem,
} from '../../../src/shared/state/toast-state-machine';

describe('ToastStateMachine', () => {
  describe('createInitialState', () => {
    it('초기 상태를 생성해야 함', () => {
      const state = ToastStateMachine.createInitialState();

      expect(state.status).toBe('idle');
      expect(state.activeToast).toBeNull();
      expect(state.queue).toEqual([]);
      expect(state.shownCount).toBe(0);
      expect(state.dismissedCount).toBe(0);
    });

    it('초기 상태는 매번 새로운 객체여야 함', () => {
      const state1 = ToastStateMachine.createInitialState();
      const state2 = ToastStateMachine.createInitialState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('상태 전환: idle → showing', () => {
    let state: ToastState;

    beforeEach(() => {
      state = ToastStateMachine.createInitialState();
    });

    it('ENQUEUE 액션으로 idle에서 showing으로 전환', () => {
      const toast: ToastItem = {
        id: 'toast-1',
        type: 'info',
        title: 'Title',
        message: 'Message',
      };

      const action: ToastAction = {
        type: 'ENQUEUE',
        payload: { toast },
      };

      const result = ToastStateMachine.transition(state, action);

      expect(result.newState.status).toBe('showing');
      expect(result.newState.activeToast?.id).toBe('toast-1');
      expect(result.shouldSync).toBe(true);
    });

    it('여러 토스트를 queue에 추가할 수 있어야 함', () => {
      const state1 = ToastStateMachine.createInitialState();

      const result1 = ToastStateMachine.transition(state1, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-1',
            type: 'info',
            title: 'Title 1',
            message: 'Message 1',
          },
        },
      });

      const result2 = ToastStateMachine.transition(result1.newState, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-2',
            type: 'success',
            title: 'Title 2',
            message: 'Message 2',
          },
        },
      });

      expect(result2.newState.queue.length).toBe(1);
      expect(result2.newState.queue[0]?.id).toBe('toast-2');
      expect(result2.newState.activeToast?.id).toBe('toast-1');
    });
  });

  describe('상태 전환: showing → waiting', () => {
    let state: ToastState;

    beforeEach(() => {
      state = ToastStateMachine.createInitialState();
      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-1',
            type: 'info',
            title: 'Title',
            message: 'Message',
            duration: 3000,
          },
        },
      }).newState;
    });

    it('SHOWN 액션으로 showing에서 waiting으로 전환', () => {
      const action: ToastAction = {
        type: 'SHOWN',
      };

      const result = ToastStateMachine.transition(state, action);

      expect(result.newState.status).toBe('waiting');
      expect(result.newState.activeToast?.id).toBe('toast-1');
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('상태 전환: waiting → hidden', () => {
    let state: ToastState;

    beforeEach(() => {
      state = ToastStateMachine.createInitialState();
      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-1',
            type: 'info',
            title: 'Title',
            message: 'Message',
          },
        },
      }).newState;
      state = ToastStateMachine.transition(state, {
        type: 'SHOWN',
      }).newState;
    });

    it('DISMISS 액션으로 waiting에서 hidden으로 전환', () => {
      const result = ToastStateMachine.transition(state, {
        type: 'DISMISS',
      });

      expect(result.newState.status).toBe('idle');
      expect(result.newState.activeToast).toBeNull();
      expect(result.newState.dismissedCount).toBe(1);
      expect(result.shouldSync).toBe(true);
    });

    it('queue가 비어있지 않으면 다음 토스트 자동 표시', () => {
      const state1 = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-2',
            type: 'success',
            title: 'Title 2',
            message: 'Message 2',
          },
        },
      }).newState;

      const result = ToastStateMachine.transition(state1, {
        type: 'DISMISS',
      });

      expect(result.newState.status).toBe('showing');
      expect(result.newState.activeToast?.id).toBe('toast-2');
      expect(result.newState.queue.length).toBe(0);
      expect(result.newState.dismissedCount).toBe(1);
    });
  });

  describe('상태 전환: showing → hidden (즉시 dismiss)', () => {
    let state: ToastState;

    beforeEach(() => {
      state = ToastStateMachine.createInitialState();
      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-1',
            type: 'error',
            title: 'Error',
            message: 'Error Message',
          },
        },
      }).newState;
    });

    it('DISMISS 액션을 SHOWN 전에 호출할 수 있어야 함', () => {
      const result = ToastStateMachine.transition(state, {
        type: 'DISMISS',
      });

      expect(result.newState.status).toBe('idle');
      expect(result.newState.activeToast).toBeNull();
      expect(result.newState.dismissedCount).toBe(1);
    });
  });

  describe('상태 전환: * → DISMISS_ALL (모두 닫기)', () => {
    let state: ToastState;

    beforeEach(() => {
      state = ToastStateMachine.createInitialState();
      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-1',
            type: 'info',
            title: 'Title 1',
            message: 'Message 1',
          },
        },
      }).newState;
      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-2',
            type: 'success',
            title: 'Title 2',
            message: 'Message 2',
          },
        },
      }).newState;
      state = ToastStateMachine.transition(state, {
        type: 'SHOWN',
      }).newState;
    });

    it('DISMISS_ALL 액션으로 모든 토스트 정리', () => {
      expect(state.queue.length).toBe(1);
      expect(state.activeToast?.id).toBe('toast-1');

      const result = ToastStateMachine.transition(state, {
        type: 'DISMISS_ALL',
      });

      expect(result.newState.status).toBe('idle');
      expect(result.newState.activeToast).toBeNull();
      expect(result.newState.queue.length).toBe(0);
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('상태 전환: RESET', () => {
    let state: ToastState;

    beforeEach(() => {
      state = ToastStateMachine.createInitialState();
      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-1',
            type: 'info',
            title: 'Title',
            message: 'Message',
          },
        },
      }).newState;
      state = ToastStateMachine.transition(state, {
        type: 'SHOWN',
      }).newState;
      state = ToastStateMachine.transition(state, {
        type: 'DISMISS',
      }).newState;
    });

    it('RESET 액션으로 완전 초기화', () => {
      const result = ToastStateMachine.transition(state, {
        type: 'RESET',
      });

      const initialState = ToastStateMachine.createInitialState();
      expect(result.newState).toEqual(initialState);
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('통합 시나리오', () => {
    it('전체 토스트 표시 흐름: 3개 토스트 순차 표시', () => {
      let state = ToastStateMachine.createInitialState();

      // 1. 3개 토스트 queue
      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-1',
            type: 'info',
            title: 'Info',
            message: 'Information message',
          },
        },
      }).newState;

      expect(state.status).toBe('showing');
      expect(state.activeToast?.id).toBe('toast-1');

      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-2',
            type: 'success',
            title: 'Success',
            message: 'Success message',
          },
        },
      }).newState;

      expect(state.queue.length).toBe(1);

      state = ToastStateMachine.transition(state, {
        type: 'ENQUEUE',
        payload: {
          toast: {
            id: 'toast-3',
            type: 'error',
            title: 'Error',
            message: 'Error message',
          },
        },
      }).newState;

      expect(state.queue.length).toBe(2);

      // 2. toast-1 표시 완료 (SHOWN)
      state = ToastStateMachine.transition(state, {
        type: 'SHOWN',
      }).newState;

      expect(state.status).toBe('waiting');

      // 3. toast-1 dismiss → toast-2 자동 표시
      state = ToastStateMachine.transition(state, {
        type: 'DISMISS',
      }).newState;

      expect(state.dismissedCount).toBe(1);
      expect(state.activeToast?.id).toBe('toast-2');
      expect(state.queue.length).toBe(1);

      // 4. toast-2 표시 완료
      state = ToastStateMachine.transition(state, {
        type: 'SHOWN',
      }).newState;

      // 5. toast-2 dismiss → toast-3 자동 표시
      state = ToastStateMachine.transition(state, {
        type: 'DISMISS',
      }).newState;

      expect(state.dismissedCount).toBe(2);
      expect(state.activeToast?.id).toBe('toast-3');
      expect(state.queue.length).toBe(0);

      // 6. toast-3 표시 완료
      state = ToastStateMachine.transition(state, {
        type: 'SHOWN',
      }).newState;

      // 7. toast-3 dismiss → idle
      state = ToastStateMachine.transition(state, {
        type: 'DISMISS',
      }).newState;

      expect(state.dismissedCount).toBe(3);
      expect(state.status).toBe('idle');
      expect(state.activeToast).toBeNull();
      expect(state.queue.length).toBe(0);
      expect(state.shownCount).toBe(3);
    });
  });
});
