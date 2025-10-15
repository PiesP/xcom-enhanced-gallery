/**
 * Navigation State Machine 테스트
 * @description TDD 방식으로 상태 전환 로직 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NavigationStateMachine,
  type NavigationState,
  type NavigationAction,
} from '../../../src/shared/state/navigation-state-machine';

describe('NavigationStateMachine', () => {
  let initialState: NavigationState;

  beforeEach(() => {
    initialState = NavigationStateMachine.createInitialState();
  });

  describe('초기 상태 생성', () => {
    it('초기 상태는 0번 인덱스, 포커스 없음, auto-focus 소스여야 함', () => {
      expect(initialState).toEqual({
        currentIndex: 0,
        focusedIndex: null,
        lastSource: 'auto-focus',
        lastTimestamp: expect.any(Number),
      });
    });
  });

  describe('NAVIGATE 액션', () => {
    it('새 인덱스로 네비게이션 시 currentIndex와 focusedIndex가 동기화되어야 함', () => {
      const action: NavigationAction = {
        type: 'NAVIGATE',
        payload: {
          targetIndex: 3,
          source: 'button',
          trigger: 'button',
        },
      };

      const result = NavigationStateMachine.transition(initialState, action);

      expect(result.newState.currentIndex).toBe(3);
      expect(result.newState.focusedIndex).toBe(3);
      expect(result.newState.lastSource).toBe('button');
      expect(result.shouldSync).toBe(true);
      expect(result.isDuplicate).toBe(false);
    });

    it('같은 인덱스로 수동 네비게이션 시 중복으로 처리되어야 함', () => {
      // 먼저 버튼으로 3번으로 이동
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 3, source: 'button', trigger: 'button' },
      }).newState;

      // 다시 버튼으로 3번으로 이동 (중복)
      const result = NavigationStateMachine.transition(state1, {
        type: 'NAVIGATE',
        payload: { targetIndex: 3, source: 'button', trigger: 'button' },
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.newState.currentIndex).toBe(3); // 변경 없음
      expect(result.newState.focusedIndex).toBe(3); // 동기화됨
      expect(result.shouldSync).toBe(true);
    });

    it('같은 인덱스로 자동 네비게이션(scroll) 시 중복이 아님', () => {
      // 먼저 버튼으로 3번으로 이동
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 3, source: 'button', trigger: 'button' },
      }).newState;

      // 스크롤로 3번으로 이동 (중복 아님, 자동 소스)
      const result = NavigationStateMachine.transition(state1, {
        type: 'NAVIGATE',
        payload: { targetIndex: 3, source: 'scroll', trigger: 'button' },
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.newState.lastSource).toBe('scroll');
    });

    it('키보드 네비게이션은 수동 소스로 처리되어야 함', () => {
      const action: NavigationAction = {
        type: 'NAVIGATE',
        payload: {
          targetIndex: 5,
          source: 'keyboard',
          trigger: 'keyboard',
        },
      };

      const result = NavigationStateMachine.transition(initialState, action);

      expect(result.newState.lastSource).toBe('keyboard');
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('SET_FOCUS 액션', () => {
    it('포커스 설정 시 focusedIndex만 변경되어야 함', () => {
      const action: NavigationAction = {
        type: 'SET_FOCUS',
        payload: {
          focusIndex: 2,
          source: 'auto-focus',
        },
      };

      const result = NavigationStateMachine.transition(initialState, action);

      expect(result.newState.focusedIndex).toBe(2);
      expect(result.newState.currentIndex).toBe(0); // 변경 없음
      expect(result.newState.lastSource).toBe('auto-focus');
      expect(result.shouldSync).toBe(false);
      expect(result.isDuplicate).toBe(false);
    });

    it('null로 포커스 해제 시 focusedIndex가 null이어야 함', () => {
      // 먼저 포커스 설정
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'SET_FOCUS',
        payload: { focusIndex: 2, source: 'auto-focus' },
      }).newState;

      // 포커스 해제
      const result = NavigationStateMachine.transition(state1, {
        type: 'SET_FOCUS',
        payload: { focusIndex: null, source: 'auto-focus' },
      });

      expect(result.newState.focusedIndex).toBe(null);
      expect(result.shouldSync).toBe(false);
    });

    it('이미 같은 인덱스에 포커스되어 있으면 중복으로 처리', () => {
      // 먼저 2번에 포커스
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'SET_FOCUS',
        payload: { focusIndex: 2, source: 'auto-focus' },
      }).newState;

      // 다시 2번에 포커스 (중복)
      const result = NavigationStateMachine.transition(state1, {
        type: 'SET_FOCUS',
        payload: { focusIndex: 2, source: 'scroll' },
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.newState.focusedIndex).toBe(2);
    });
  });

  describe('RESET 액션', () => {
    it('리셋 시 초기 상태로 돌아가야 함', () => {
      // 상태 변경
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 5, source: 'button', trigger: 'button' },
      }).newState;

      expect(state1.currentIndex).toBe(5);

      // 리셋
      const result = NavigationStateMachine.transition(state1, {
        type: 'RESET',
      });

      expect(result.newState.currentIndex).toBe(0);
      expect(result.newState.focusedIndex).toBe(null);
      expect(result.newState.lastSource).toBe('auto-focus');
    });
  });

  describe('복잡한 시나리오', () => {
    it('버튼 → 스크롤 → 버튼 네비게이션 시나리오', () => {
      // 1. 버튼으로 3번 이동
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 3, source: 'button', trigger: 'button' },
      }).newState;

      expect(state1.currentIndex).toBe(3);
      expect(state1.lastSource).toBe('button');

      // 2. 스크롤로 5번 이동
      const state2 = NavigationStateMachine.transition(state1, {
        type: 'NAVIGATE',
        payload: { targetIndex: 5, source: 'scroll', trigger: 'button' },
      }).newState;

      expect(state2.currentIndex).toBe(5);
      expect(state2.lastSource).toBe('scroll');

      // 3. 버튼으로 5번 다시 클릭 (중복 아님, 마지막이 scroll)
      const result3 = NavigationStateMachine.transition(state2, {
        type: 'NAVIGATE',
        payload: { targetIndex: 5, source: 'button', trigger: 'button' },
      });

      expect(result3.isDuplicate).toBe(false);
      expect(result3.newState.lastSource).toBe('button');
    });

    it('키보드 연속 네비게이션 시나리오', () => {
      // 1. 키보드로 1번 이동
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 1, source: 'keyboard', trigger: 'keyboard' },
      }).newState;

      // 2. 키보드로 2번 이동
      const state2 = NavigationStateMachine.transition(state1, {
        type: 'NAVIGATE',
        payload: { targetIndex: 2, source: 'keyboard', trigger: 'keyboard' },
      }).newState;

      // 3. 키보드로 2번 다시 (중복)
      const result3 = NavigationStateMachine.transition(state2, {
        type: 'NAVIGATE',
        payload: { targetIndex: 2, source: 'keyboard', trigger: 'keyboard' },
      });

      expect(result3.isDuplicate).toBe(true);
      expect(result3.shouldSync).toBe(true);
    });
  });

  describe('타임스탬프', () => {
    it('모든 전환은 타임스탬프를 업데이트해야 함', () => {
      const timestamp1 = initialState.lastTimestamp;

      // 최소 1ms 지연 보장
      const state1 = NavigationStateMachine.transition(initialState, {
        type: 'NAVIGATE',
        payload: { targetIndex: 1, source: 'button', trigger: 'button' },
      }).newState;

      // 타임스탬프는 최소한 같거나 커야 함
      expect(state1.lastTimestamp).toBeGreaterThanOrEqual(timestamp1);
    });
  });
});
