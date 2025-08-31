/**
 * @fileoverview useUnifiedState Hook - Signal과 React 상태 통합 훅
 * @description StateManager를 통해 Signal과 React 상태를 자동 동기화하는 훅
 * @version 1.0.0 - Phase 2.2 상태 통합 Hook
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { StateManager } from '@shared/services/StateManager';
import { createScopedLogger } from '../logging/logger';

// useUnifiedState 전용 로거
const logger = createScopedLogger('useUnifiedState');

interface StateHistory {
  timestamp: number;
  action: string;
  state: object;
  path?: string;
}

interface GalleryState {
  isOpen: boolean;
  currentMediaIndex: number;
  mediaCount?: number;
  currentUrl?: string | undefined;
}

type StateKey = 'gallery';
type StateValue<T extends StateKey> = T extends 'gallery' ? GalleryState : unknown;

/**
 * Signal과 React 상태를 통합하는 훅
 */
export function useGalleryState(): {
  state: GalleryState | undefined;
  updateState: (newState: Partial<GalleryState>) => void;
  syncWithSignals: () => void;
} {
  const stateManager = StateManager.getInstance();
  const [state, setState] = useState<GalleryState | undefined>();

  // 상태 업데이트 함수
  const updateState = useCallback(
    (newState: Partial<GalleryState>): void => {
      try {
        const currentState = stateManager.getState('gallery') as GalleryState;
        const updatedState = { ...currentState, ...newState };

        // StateManager를 통해 Signal과 동기화
        stateManager.syncState('gallery', updatedState, 'react');
        setState(updatedState);
      } catch (error) {
        logger.error('상태 업데이트 오류:', error);
      }
    },
    [stateManager]
  );

  // Signal과 동기화 함수
  const syncWithSignals = useCallback((): void => {
    try {
      const currentState = stateManager.getState('gallery') as GalleryState;
      setState(currentState);
    } catch (error) {
      logger.error('Signal 동기화 오류:', error);
    }
  }, [stateManager]);

  // StateManager 구독 설정
  useEffect(() => {
    const unsubscribe = stateManager.subscribe('gallery', (newState: unknown) => {
      setState(newState as GalleryState);
    });

    // 초기 상태 로드
    syncWithSignals();

    return unsubscribe;
  }, [stateManager, syncWithSignals]);

  return {
    state,
    updateState,
    syncWithSignals,
  };
}

/**
 * 통합 상태 훅 (제네릭 버전)
 */
export function useUnifiedState<T extends StateKey>(
  stateKey: T
): {
  state: StateValue<T> | undefined;
  updateState: (newState: Partial<StateValue<T>>) => void;
  syncWithSignals: () => void;
} {
  const stateManager = StateManager.getInstance();
  const [state, setState] = useState<StateValue<T> | undefined>();

  // 상태 업데이트 함수
  const updateState = useCallback(
    (newState: Partial<StateValue<T>>): void => {
      try {
        const currentState = stateManager.getState(stateKey);
        const updatedState = {
          ...((currentState as object) || {}),
          ...(newState as object),
        } as StateValue<T>;

        // StateManager를 통해 Signal과 동기화
        stateManager.syncState(stateKey, updatedState, 'react');
        setState(updatedState);
      } catch (error) {
        logger.error('상태 업데이트 오류:', error);
      }
    },
    [stateManager, stateKey]
  );

  // Signal과 동기화 함수
  const syncWithSignals = useCallback((): void => {
    try {
      const currentState = stateManager.getState(stateKey);
      if (currentState) {
        setState(currentState as StateValue<T>);
      }
    } catch (error) {
      logger.error('Signal 동기화 오류:', error);
    }
  }, [stateManager, stateKey]);

  // StateManager 구독 설정
  useEffect(() => {
    const unsubscribe = stateManager.subscribe(stateKey, (newState: unknown) => {
      setState(newState as StateValue<T>);
    });

    // 초기 상태 로드
    syncWithSignals();

    return unsubscribe;
  }, [stateManager, stateKey, syncWithSignals]);

  return {
    state,
    updateState,
    syncWithSignals,
  };
}

/**
 * 상태 디버그 정보 훅
 */
export function useStateDebug(): {
  debugInfo: object;
  performanceMetrics: object;
  history: StateHistory[];
} {
  const stateManager = StateManager.getInstance();
  const [debugData, setDebugData] = useState<{
    debugInfo: object;
    performanceMetrics: object;
    history: StateHistory[];
  }>({
    debugInfo: {},
    performanceMetrics: {},
    history: [],
  });

  useEffect(() => {
    const updateDebugData = () => {
      const debugInfo = stateManager.getDebugInfo();
      const performanceMetrics = stateManager.getPerformanceMetrics();

      setDebugData({
        debugInfo,
        performanceMetrics,
        history: debugInfo.history,
      });
    };

    // 주기적으로 디버그 정보 업데이트 (개발 모드에서만)
    const interval = setInterval(updateDebugData, 1000);
    updateDebugData(); // 초기 로드

    return () => clearInterval(interval);
  }, [stateManager]);

  return debugData;
}

export default useGalleryState;
