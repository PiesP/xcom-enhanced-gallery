/**
 * @fileoverview Toolbar State Management
 * @version 2.1.0 - createSignalSafe Pattern (Phase A5.3)
 *
 * 간소화된 툴바 상태 관리 시스템
 * - CSS 호버 기반으로 대부분의 상태 관리 제거
 * - 설정 및 모드 관리만 유지
 * - 타입 안전성 보장
 * - Phase A5.3: createSignalSafe 패턴으로 표준화
 */

import { logger } from '@shared/logging/logger';
import { createSignalSafe, type SafeSignal } from '@shared/state/signals/signal-factory';

/**
 * 간소화된 툴바 상태 인터페이스
 */
export interface ToolbarState {
  readonly currentMode: 'gallery' | 'settings' | 'download';
  readonly needsHighContrast: boolean;
}

/**
 * 확장 가능한 설정 패널 상태 인터페이스 (Phase 44)
 */
export interface ToolbarExpandableState {
  readonly isSettingsExpanded: boolean;
}

/**
 * 초기 툴바 상태
 */
const INITIAL_TOOLBAR_STATE: ToolbarState = {
  currentMode: 'gallery',
  needsHighContrast: false,
};

/**
 * 초기 확장 가능한 설정 패널 상태 (Phase 44)
 */
const INITIAL_EXPANDABLE_STATE: ToolbarExpandableState = {
  isSettingsExpanded: false,
};

/**
 * 툴바 이벤트 타입
 */
export type ToolbarEvents = {
  'toolbar:mode-change': { mode: ToolbarState['currentMode'] };
  'toolbar:settings-expanded': { expanded: boolean };
};

// Phase A5.3: createSignalSafe 기반 immediate initialization
const toolbarStateSignal: SafeSignal<ToolbarState> = createSignalSafe(INITIAL_TOOLBAR_STATE);
const expandableStateSignal: SafeSignal<ToolbarExpandableState> =
  createSignalSafe(INITIAL_EXPANDABLE_STATE);

/**
 * 툴바 상태 접근자
 * Phase A5.3: createSignalSafe 기반
 */
export const toolbarState = {
  get value(): ToolbarState {
    return toolbarStateSignal.value;
  },

  set value(newState: ToolbarState) {
    toolbarStateSignal.value = newState;
  },

  /**
   * 상태 변경 구독
   * Phase A5.3: 에러 처리 개선
   */
  subscribe(callback: (state: ToolbarState) => void): () => void {
    try {
      return toolbarStateSignal.subscribe(state => {
        try {
          callback(state);
        } catch (error) {
          logger.warn('toolbar state callback 실행 중 에러', { error });
        }
      });
    } catch (error) {
      logger.warn('toolbar state 구독 실패', { error });
      return () => {};
    }
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
 * Phase A5.3: createSignalSafe 사용
 */
export function updateToolbarMode(mode: ToolbarState['currentMode']): void {
  const currentState = toolbarStateSignal.value;

  if (currentState.currentMode !== mode) {
    toolbarStateSignal.value = { ...currentState, currentMode: mode };
    dispatchEvent('toolbar:mode-change', { mode });
    logger.debug(`Toolbar mode changed to: ${mode}`);
  }
}

/**
 * 고대비 모드 설정
 * Phase A5.3: createSignalSafe 사용
 */
export function setHighContrast(enabled: boolean): void {
  const currentState = toolbarStateSignal.value;

  if (currentState.needsHighContrast !== enabled) {
    toolbarStateSignal.value = { ...currentState, needsHighContrast: enabled };
    logger.debug(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// =============================================================================
// 간소화된 선택자 함수들
// =============================================================================

/**
 * 현재 툴바 모드 가져오기
 * Phase A5.3: createSignalSafe 사용
 */
export function getCurrentToolbarMode(): ToolbarState['currentMode'] {
  return toolbarStateSignal.value.currentMode;
}

/**
 * 툴바 상태 요약 정보 (CSS 호버 시스템용으로 간소화)
 * Phase A5.3: createSignalSafe 사용
 */
export function getToolbarInfo(): {
  currentMode: string;
  needsHighContrast: boolean;
} {
  const state = toolbarStateSignal.value;
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

// =============================================================================
// Phase 44: 확장 가능한 설정 패널 API
// =============================================================================

/**
 * 확장 가능한 설정 패널 상태 가져오기
 * Phase A5.3: createSignalSafe 사용
 */
export function getToolbarExpandableState(): ToolbarExpandableState {
  return expandableStateSignal.value;
}

/**
 * 설정 패널 확장 상태 accessor (반응형)
 * Solid.js 반응성을 보장하기 위해 signal accessor 직접 노출
 * Phase A5.3: createSignalSafe의 subscribe 사용
 * @returns Signal accessor (() => boolean)
 */
export function getSettingsExpanded(): () => boolean {
  return () => expandableStateSignal.value.isSettingsExpanded;
}

/**
 * 설정 패널 확장 상태 토글
 * Phase A5.3: createSignalSafe 사용
 */
export function toggleSettingsExpanded(): void {
  const currentExpanded = expandableStateSignal.value.isSettingsExpanded;
  const newExpanded = !currentExpanded;

  expandableStateSignal.value = { isSettingsExpanded: newExpanded };

  dispatchEvent('toolbar:settings-expanded', { expanded: newExpanded });
  logger.debug(`Settings panel ${newExpanded ? 'expanded' : 'collapsed'}`);
}

/**
 * 설정 패널 확장 상태 명시적 설정
 * Phase A5.3: createSignalSafe 사용
 */
export function setSettingsExpanded(expanded: boolean): void {
  const currentExpanded = expandableStateSignal.value.isSettingsExpanded;

  if (currentExpanded !== expanded) {
    expandableStateSignal.value = { isSettingsExpanded: expanded };
    dispatchEvent('toolbar:settings-expanded', { expanded });
    logger.debug(`Settings panel set to ${expanded ? 'expanded' : 'collapsed'}`);
  }
}
