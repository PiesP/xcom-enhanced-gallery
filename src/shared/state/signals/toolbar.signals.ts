/**
 * @fileoverview Simplified Toolbar State Management
 * @version 2.0.0 - CSS Hover System
 *
 * 간소화된 툴바 상태 관리 시스템
 * - CSS 호버 기반으로 대부분의 상태 관리 제거
 * - 설정 및 모드 관리만 유지
 * - 타입 안전성 보장
 */

import { logger } from '@shared/logging/logger';

/**
 * 간소화된 툴바 상태 인터페이스
 */
export interface ToolbarState {
  readonly currentMode: 'gallery' | 'settings' | 'download';
  readonly needsHighContrast: boolean;
}

/**
 * 초기 툴바 상태
 */
const INITIAL_TOOLBAR_STATE: ToolbarState = {
  currentMode: 'gallery',
  needsHighContrast: false,
};

/**
 * 툴바 이벤트 타입
 */
export type ToolbarEvents = {
  'toolbar:mode-change': { mode: ToolbarState['currentMode'] };
};

// Signal 타입 정의 (Preact Signals 지연 로딩 대응)
type Signal<T> = {
  value: T;
  subscribe?: (callback: (value: T) => void) => () => void;
};

// Preact Signals 지연 초기화
let toolbarStateSignal: Signal<ToolbarState> | null = null;

function getToolbarStateSignal(): Signal<ToolbarState> {
  if (!toolbarStateSignal) {
    try {
      // Preact Signals 동적 로딩
      const signalsModule = require('@preact/signals');
      const { signal } = signalsModule;
      toolbarStateSignal = signal(INITIAL_TOOLBAR_STATE);
      logger.debug('Simplified toolbar state signal initialized');
    } catch (error) {
      logger.warn('Failed to initialize Preact Signals, using fallback', { error });
      // 폴백 구현
      toolbarStateSignal = {
        value: INITIAL_TOOLBAR_STATE,
        subscribe: () => () => {},
      };
    }
  }
  return toolbarStateSignal!;
}

/**
 * 툴바 상태 접근자
 */
export const toolbarState = {
  get value(): ToolbarState {
    return getToolbarStateSignal().value;
  },

  set value(newState: ToolbarState) {
    const signal = getToolbarStateSignal();
    signal.value = newState;
  },

  /**
   * 상태 변경 구독
   */
  subscribe(callback: (state: ToolbarState) => void): () => void {
    const signal = getToolbarStateSignal();
    return signal.subscribe?.(callback) || (() => {});
  },
};

/**
 * 이벤트 디스패처
 */
function dispatchEvent<K extends keyof ToolbarEvents>(event: K, data: ToolbarEvents[K]): void {
  try {
    const customEvent = new CustomEvent(`xeg-${event}`, { detail: data });
    document.dispatchEvent(customEvent);
    logger.debug(`Event dispatched: ${event}`, data);
  } catch (error) {
    logger.warn(`Failed to dispatch event: ${event}`, { error, data });
  }
}

// =============================================================================
// 간소화된 액션 함수들 (CSS 호버 시스템에 필요한 것만 유지)
// =============================================================================

/**
 * 툴바 모드 변경
 */
export function updateToolbarMode(mode: ToolbarState['currentMode']): void {
  const currentState = toolbarState.value;

  if (currentState.currentMode !== mode) {
    toolbarState.value = { ...currentState, currentMode: mode };
    dispatchEvent('toolbar:mode-change', { mode });
    logger.debug(`Toolbar mode changed to: ${mode}`);
  }
}

/**
 * 고대비 모드 설정
 */
export function setHighContrast(enabled: boolean): void {
  const currentState = toolbarState.value;

  if (currentState.needsHighContrast !== enabled) {
    toolbarState.value = { ...currentState, needsHighContrast: enabled };
    logger.debug(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// =============================================================================
// 간소화된 선택자 함수들
// =============================================================================

/**
 * 현재 툴바 모드 가져오기
 */
export function getCurrentToolbarMode(): ToolbarState['currentMode'] {
  return toolbarState.value.currentMode;
}

/**
 * 툴바 상태 요약 정보 (CSS 호버 시스템용으로 간소화)
 */
export function getToolbarInfo(): {
  currentMode: string;
  needsHighContrast: boolean;
} {
  const state = toolbarState.value;
  return {
    currentMode: state.currentMode,
    needsHighContrast: state.needsHighContrast,
  };
}

/**
 * 이벤트 리스너 등록
 */
export function addEventListener<K extends keyof ToolbarEvents>(
  event: K,
  handler: (data: ToolbarEvents[K]) => void
): () => void {
  const eventName = `xeg-${event}`;

  const listener = (e: CustomEvent) => {
    handler(e.detail);
  };

  document.addEventListener(eventName, listener as EventListener);

  return () => {
    document.removeEventListener(eventName, listener as EventListener);
  };
}

// 레거시 호환성을 위한 별칭들 (CSS 호버 시스템에서는 항상 true 반환)
export const getCurrentMode = getCurrentToolbarMode;
