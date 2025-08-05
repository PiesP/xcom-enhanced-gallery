/**
 * @fileoverview 통합 컴포넌트 관리자
 * @description 모든 컴포넌트의 중복된 훅, 상태 관리, 이벤트 처리를 통합 관리
 * @version 1.0.0
 */

import { getPreactHooks, type PreactHooksAPI } from '@shared/external/vendors';
import { logger } from '../logging/logger';

/**
 * 컴포넌트 매니저 인터페이스
 */
export interface ComponentManagerInterface {
  createComponent(name: string): ComponentInstance;
  getHookManager(): HookManager;
  getStateManager(): StateManager;
  getEventManager(): EventManager;
  withHooks<T>(component: T): T & WithHooksInterface;
  withStateManagement<T>(component: T): T & WithStateInterface;
  withEventHandling<T>(component: T): T & WithEventInterface;
}

/**
 * 컴포넌트 인스턴스 인터페이스
 */
export interface ComponentInstance {
  name: string;
  withHooks<T>(component: T): T & WithHooksInterface;
  withStateManagement<T>(component: T): T & WithStateInterface;
  withEventHandling<T>(component: T): T & WithEventInterface;
}

/**
 * 훅 매니저 인터페이스 - Preact hooks와 완전히 호환되는 타입
 */
export interface HookManager extends PreactHooksAPI {
  // PreactHooksAPI의 모든 hooks를 상속받음
}

/**
 * 상태 매니저 인터페이스
 */
export interface StateManager {
  createSharedState<T>(key: string, initialValue: T): SharedState<T>;
  useSharedState<T>(key: string): [T, (value: T) => void];
  syncState<T>(key: string, value: T): void;
}

/**
 * 이벤트 매니저 인터페이스
 */
export interface EventManager {
  createClickHandler(handler: (event: Event) => void): (event: Event) => void;
  createKeyboardHandler(handler: (event: KeyboardEvent) => void): (event: KeyboardEvent) => void;
  createScrollHandler(handler: (event: Event) => void): (event: Event) => void;
}

/**
 * HOC 인터페이스들
 */
export interface WithHooksInterface {
  hooks: HookManager;
}

export interface WithStateInterface {
  state: StateManager;
}

export interface WithEventInterface {
  events: EventManager;
}

/**
 * 공유 상태 인터페이스
 */
export interface SharedState<T> {
  value: T;
  setValue: (value: T) => void;
  subscribe: (callback: (value: T) => void) => () => void;
}

/**
 * 통합 컴포넌트 관리자 구현
 */
class UnifiedComponentManagerImpl implements ComponentManagerInterface {
  private readonly hookManager: HookManager;
  private readonly stateManager: StateManager;
  private readonly eventManager: EventManager;
  private readonly sharedStates = new Map<string, SharedState<unknown>>();

  constructor() {
    this.hookManager = this.createHookManager();
    this.stateManager = this.createStateManager();
    this.eventManager = this.createEventManager();

    logger.info('[UnifiedComponentManager] 초기화 완료');
  }

  /**
   * 컴포넌트 인스턴스 생성
   */
  createComponent(name: string): ComponentInstance {
    logger.debug(`[UnifiedComponentManager] 컴포넌트 생성: ${name}`);

    return {
      name,
      withHooks: <T>(component: T) => this.withHooks(component),
      withStateManagement: <T>(component: T) => this.withStateManagement(component),
      withEventHandling: <T>(component: T) => this.withEventHandling(component),
    };
  }

  /**
   * 훅 매니저 반환
   */
  getHookManager(): HookManager {
    return this.hookManager;
  }

  /**
   * 상태 매니저 반환
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }

  /**
   * 이벤트 매니저 반환
   */
  getEventManager(): EventManager {
    return this.eventManager;
  }

  /**
   * 훅 기능 추가
   */
  withHooks<T>(component: T): T & WithHooksInterface {
    return {
      ...component,
      hooks: this.hookManager,
    };
  }

  /**
   * 상태 관리 기능 추가
   */
  withStateManagement<T>(component: T): T & WithStateInterface {
    return {
      ...component,
      state: this.stateManager,
    };
  }

  /**
   * 이벤트 처리 기능 추가
   */
  withEventHandling<T>(component: T): T & WithEventInterface {
    return {
      ...component,
      events: this.eventManager,
    };
  }

  /**
   * 훅 매니저 생성
   */
  private createHookManager(): HookManager {
    const preactHooks = getPreactHooks();

    return {
      useState: preactHooks.useState,
      useEffect: preactHooks.useEffect,
      useCallback: preactHooks.useCallback,
      useMemo: preactHooks.useMemo,
      useRef: preactHooks.useRef,
      useContext: preactHooks.useContext,
      useReducer: preactHooks.useReducer,
      useLayoutEffect: preactHooks.useLayoutEffect,
    };
  }

  /**
   * 상태 매니저 생성
   */
  private createStateManager(): StateManager {
    return {
      createSharedState: <T>(key: string, initialValue: T): SharedState<T> => {
        if (this.sharedStates.has(key)) {
          return this.sharedStates.get(key) as SharedState<T>;
        }

        const subscribers = new Set<(value: T) => void>();
        let currentValue = initialValue;

        const sharedState: SharedState<T> = {
          get value() {
            return currentValue;
          },
          setValue: (value: T) => {
            currentValue = value;
            subscribers.forEach(callback => callback(value));
          },
          subscribe: (callback: (value: T) => void) => {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
          },
        };

        this.sharedStates.set(key, sharedState as SharedState<unknown>);
        logger.debug(`[StateManager] 공유 상태 생성: ${key}`);

        return sharedState;
      },

      useSharedState: <T>(key: string): [T, (value: T) => void] => {
        const sharedState = this.sharedStates.get(key) as SharedState<T>;
        if (!sharedState) {
          throw new Error(`공유 상태를 찾을 수 없습니다: ${key}`);
        }

        const { useState, useEffect } = this.hookManager;
        const [state, setState] = useState(sharedState.value);

        useEffect(() => {
          const unsubscribe = sharedState.subscribe(setState);
          return unsubscribe;
        }, []);

        return [state, sharedState.setValue];
      },

      syncState: <T>(key: string, value: T) => {
        const sharedState = this.sharedStates.get(key) as SharedState<T>;
        if (sharedState) {
          sharedState.setValue(value);
        }
      },
    };
  }

  /**
   * 이벤트 매니저 생성
   */
  private createEventManager(): EventManager {
    return {
      createClickHandler: (handler: (event: Event) => void) => {
        return (event: Event) => {
          try {
            event.preventDefault();
            event.stopPropagation();
            handler(event);
          } catch (error) {
            logger.error('[EventManager] 클릭 핸들러 오류:', error);
          }
        };
      },

      createKeyboardHandler: (handler: (event: KeyboardEvent) => void) => {
        return (event: KeyboardEvent) => {
          try {
            handler(event);
          } catch (error) {
            logger.error('[EventManager] 키보드 핸들러 오류:', error);
          }
        };
      },

      createScrollHandler: (handler: (event: Event) => void) => {
        return (event: Event) => {
          try {
            handler(event);
          } catch (error) {
            logger.error('[EventManager] 스크롤 핸들러 오류:', error);
          }
        };
      },
    };
  }
}

/**
 * 싱글톤 인스턴스
 */
const unifiedComponentManager = new UnifiedComponentManagerImpl();

/**
 * 통합 컴포넌트 관리자 인스턴스
 */
export const UnifiedComponentManager: ComponentManagerInterface = unifiedComponentManager;

/**
 * 편의 함수들
 */
export const componentUtils = {
  /**
   * 훅 가져오기 (레거시 호환)
   */
  getHooks: () => UnifiedComponentManager.getHookManager(),

  /**
   * 공유 상태 생성
   */
  createSharedState: <T>(key: string, initialValue: T) =>
    UnifiedComponentManager.getStateManager().createSharedState(key, initialValue),

  /**
   * 이벤트 핸들러 생성
   */
  createEventHandler: (
    type: 'click' | 'keyboard' | 'scroll',
    handler: (event: Event | KeyboardEvent) => void
  ) => {
    const eventManager = UnifiedComponentManager.getEventManager();
    switch (type) {
      case 'click':
        return eventManager.createClickHandler(handler);
      case 'keyboard':
        return eventManager.createKeyboardHandler(handler);
      case 'scroll':
        return eventManager.createScrollHandler(handler);
      default:
        throw new Error(`지원하지 않는 이벤트 타입: ${type}`);
    }
  },
};

/**
 * Named export for backward compatibility
 */
export const ComponentManager = UnifiedComponentManager;

/**
 * 기본 내보내기
 */
export default UnifiedComponentManager;
