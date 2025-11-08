/**
 * @fileoverview Settings State Machine 테스트
 * @description 설정 패널 상태 머신의 상태 전환 로직 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  SettingsStateMachine,
  type SettingsState,
  type SettingsAction,
} from '@/shared/state/machines/settings-state-machine';

describe('SettingsStateMachine', () => {
  setupGlobalTestIsolation();

  describe('createInitialState', () => {
    it('초기 상태를 생성해야 함', () => {
      const state = SettingsStateMachine.createInitialState();

      expect(state.status).toBe('closed');
      expect(state.isAnimating).toBe(false);
      expect(state.openCount).toBe(0);
      expect(state.closeCount).toBe(0);
    });

    it('초기 상태는 매번 새로운 객체여야 함', () => {
      const state1 = SettingsStateMachine.createInitialState();
      const state2 = SettingsStateMachine.createInitialState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('상태 전환: closed → opening', () => {
    let state: SettingsState;

    beforeEach(() => {
      state = SettingsStateMachine.createInitialState();
    });

    it('OPEN 액션으로 closed에서 opening으로 전환', () => {
      const action: SettingsAction = {
        type: 'OPEN',
      };

      const result = SettingsStateMachine.transition(state, action);

      expect(result.newState.status).toBe('opening');
      expect(result.newState.isAnimating).toBe(true);
      expect(result.shouldSync).toBe(true);
    });

    it('중복 OPEN은 무시해야 함', () => {
      const result1 = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      });

      const result2 = SettingsStateMachine.transition(result1.newState, {
        type: 'OPEN',
      });

      expect(result2.newState).toEqual(result1.newState);
      expect(result2.isDuplicate).toBe(true);
    });
  });

  describe('상태 전환: opening → open', () => {
    let state: SettingsState;

    beforeEach(() => {
      state = SettingsStateMachine.createInitialState();
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;
    });

    it('OPEN_COMPLETE 액션으로 opening에서 open으로 전환', () => {
      const result = SettingsStateMachine.transition(state, {
        type: 'OPEN_COMPLETE',
      });

      expect(result.newState.status).toBe('open');
      expect(result.newState.isAnimating).toBe(false);
      expect(result.newState.openCount).toBe(1);
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('상태 전환: open → closing', () => {
    let state: SettingsState;

    beforeEach(() => {
      state = SettingsStateMachine.createInitialState();
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN_COMPLETE',
      }).newState;
    });

    it('CLOSE 액션으로 open에서 closing으로 전환', () => {
      const result = SettingsStateMachine.transition(state, {
        type: 'CLOSE',
      });

      expect(result.newState.status).toBe('closing');
      expect(result.newState.isAnimating).toBe(true);
      expect(result.shouldSync).toBe(true);
    });

    it('중복 CLOSE는 무시해야 함', () => {
      const result1 = SettingsStateMachine.transition(state, {
        type: 'CLOSE',
      });

      const result2 = SettingsStateMachine.transition(result1.newState, {
        type: 'CLOSE',
      });

      expect(result2.newState).toEqual(result1.newState);
      expect(result2.isDuplicate).toBe(true);
    });
  });

  describe('상태 전환: closing → closed', () => {
    let state: SettingsState;

    beforeEach(() => {
      state = SettingsStateMachine.createInitialState();
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN_COMPLETE',
      }).newState;
      state = SettingsStateMachine.transition(state, {
        type: 'CLOSE',
      }).newState;
    });

    it('CLOSE_COMPLETE 액션으로 closing에서 closed로 전환', () => {
      const result = SettingsStateMachine.transition(state, {
        type: 'CLOSE_COMPLETE',
      });

      expect(result.newState.status).toBe('closed');
      expect(result.newState.isAnimating).toBe(false);
      expect(result.newState.closeCount).toBe(1);
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('상태 전환: opening → closed (즉시 닫기)', () => {
    let state: SettingsState;

    beforeEach(() => {
      state = SettingsStateMachine.createInitialState();
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;
    });

    it('CLOSE 액션을 OPEN_COMPLETE 전에 호출할 수 있어야 함', () => {
      const result = SettingsStateMachine.transition(state, {
        type: 'CLOSE',
      });

      expect(result.newState.status).toBe('closing');
      expect(result.newState.isAnimating).toBe(true);
      expect(result.newState.openCount).toBe(0);
    });

    it('CLOSE_COMPLETE로 즉시 완료', () => {
      let state1 = SettingsStateMachine.transition(state, {
        type: 'CLOSE',
      }).newState;

      state1 = SettingsStateMachine.transition(state1, {
        type: 'CLOSE_COMPLETE',
      }).newState;

      expect(state1.status).toBe('closed');
      expect(state1.closeCount).toBe(1);
    });
  });

  describe('상태 전환: FORCE_CLOSE (강제 닫기)', () => {
    let state: SettingsState;

    beforeEach(() => {
      state = SettingsStateMachine.createInitialState();
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN_COMPLETE',
      }).newState;
    });

    it('FORCE_CLOSE 액션으로 any → closed 전환', () => {
      const result = SettingsStateMachine.transition(state, {
        type: 'FORCE_CLOSE',
      });

      expect(result.newState.status).toBe('closed');
      expect(result.newState.isAnimating).toBe(false);
      expect(result.shouldSync).toBe(true);
    });

    it('FORCE_CLOSE는 애니메이션을 생략할 수 있음', () => {
      const openingState = SettingsStateMachine.transition(
        SettingsStateMachine.createInitialState(),
        { type: 'OPEN' }
      ).newState;

      const result = SettingsStateMachine.transition(openingState, {
        type: 'FORCE_CLOSE',
      });

      expect(result.newState.status).toBe('closed');
      expect(result.newState.isAnimating).toBe(false);
    });
  });

  describe('상태 전환: RESET', () => {
    let state: SettingsState;

    beforeEach(() => {
      state = SettingsStateMachine.createInitialState();
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN_COMPLETE',
      }).newState;
      state = SettingsStateMachine.transition(state, {
        type: 'CLOSE',
      }).newState;
      state = SettingsStateMachine.transition(state, {
        type: 'CLOSE_COMPLETE',
      }).newState;
    });

    it('RESET 액션으로 완전 초기화', () => {
      const result = SettingsStateMachine.transition(state, {
        type: 'RESET',
      });

      const initialState = SettingsStateMachine.createInitialState();
      expect(result.newState).toEqual(initialState);
      expect(result.shouldSync).toBe(true);
    });
  });

  describe('통합 시나리오', () => {
    it('전체 설정 패널 열고 닫기 흐름', () => {
      let state = SettingsStateMachine.createInitialState();

      // 1. 초기: closed
      expect(state.status).toBe('closed');
      expect(state.openCount).toBe(0);

      // 2. 사용자 열기
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;

      expect(state.status).toBe('opening');
      expect(state.isAnimating).toBe(true);

      // 3. 애니메이션 완료
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN_COMPLETE',
      }).newState;

      expect(state.status).toBe('open');
      expect(state.isAnimating).toBe(false);
      expect(state.openCount).toBe(1);

      // 4. 사용자 닫기
      state = SettingsStateMachine.transition(state, {
        type: 'CLOSE',
      }).newState;

      expect(state.status).toBe('closing');
      expect(state.isAnimating).toBe(true);

      // 5. 닫기 애니메이션 완료
      state = SettingsStateMachine.transition(state, {
        type: 'CLOSE_COMPLETE',
      }).newState;

      expect(state.status).toBe('closed');
      expect(state.isAnimating).toBe(false);
      expect(state.closeCount).toBe(1);

      // 6. 다시 열기
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;

      expect(state.status).toBe('opening');

      state = SettingsStateMachine.transition(state, {
        type: 'OPEN_COMPLETE',
      }).newState;

      expect(state.openCount).toBe(2);
    });

    it('에러 복구: 애니메이션 중 강제 닫기', () => {
      let state = SettingsStateMachine.createInitialState();

      // 1. 열기 시작
      state = SettingsStateMachine.transition(state, {
        type: 'OPEN',
      }).newState;

      expect(state.status).toBe('opening');
      expect(state.isAnimating).toBe(true);

      // 2. 강제 닫기 (에러 시나리오)
      state = SettingsStateMachine.transition(state, {
        type: 'FORCE_CLOSE',
      }).newState;

      expect(state.status).toBe('closed');
      expect(state.isAnimating).toBe(false);
      expect(state.openCount).toBe(0); // 완료되지 않았으므로 카운트 안 증가
    });
  });
});
