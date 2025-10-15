/**
 * @fileoverview Toolbar State Management
 * @version 2.0.0 - CSS Hover System
 *
 * 간소화된 툴바 상태 관리 시스템
 * - CSS 호버 기반으로 대부분의 상태 관리 제거
 * - 설정 및 모드 관리만 유지
 * - 타입 안전성 보장
 */

import { logger } from '@shared/logging/logger';
import { getSolid } from '@shared/external/vendors';

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

// Signal 타입 정의 (Solid Signals)
type SignalAccessor<T> = () => T;
type SignalSetter<T> = (value: T | ((prev: T) => T)) => T;

// Solid Signals 지연 초기화
let toolbarStateAccessor: SignalAccessor<ToolbarState> | null = null;
let toolbarStateSetter: SignalSetter<ToolbarState> | null = null;
let expandableStateAccessor: SignalAccessor<ToolbarExpandableState> | null = null;
let expandableStateSetter: SignalSetter<ToolbarExpandableState> | null = null;

function getToolbarStateSignal(): [SignalAccessor<ToolbarState>, SignalSetter<ToolbarState>] {
  if (!toolbarStateAccessor || !toolbarStateSetter) {
    const solid = getSolid();
    const [get, set] = solid.createSignal<ToolbarState>(INITIAL_TOOLBAR_STATE);
    toolbarStateAccessor = get;
    toolbarStateSetter = set;
    logger.debug('Toolbar state signal initialized');
  }
  return [toolbarStateAccessor!, toolbarStateSetter!];
}

/**
 * 확장 가능한 설정 패널 신호 가져오기 (Phase 44)
 */
function getExpandableStateSignal(): [
  SignalAccessor<ToolbarExpandableState>,
  SignalSetter<ToolbarExpandableState>,
] {
  if (!expandableStateAccessor || !expandableStateSetter) {
    const solid = getSolid();
    const [get, set] = solid.createSignal<ToolbarExpandableState>(INITIAL_EXPANDABLE_STATE);
    expandableStateAccessor = get;
    expandableStateSetter = set;
    logger.debug('Toolbar expandable state signal initialized');
  }
  return [expandableStateAccessor!, expandableStateSetter!];
}

/**
 * 툴바 상태 접근자
 */
export const toolbarState = {
  get value(): ToolbarState {
    const [get] = getToolbarStateSignal();
    return get();
  },

  set value(newState: ToolbarState) {
    const [, set] = getToolbarStateSignal();
    set(newState);
  },

  /**
   * 상태 변경 구독
   */
  subscribe(callback: (state: ToolbarState) => void): () => void {
    const solid = getSolid();
    return solid.createRoot(dispose => {
      solid.createEffect(() => {
        const [get] = getToolbarStateSignal();
        callback(get());
      });
      return dispose;
    });
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
  const [get, set] = getToolbarStateSignal();
  const currentState = get();

  if (currentState.currentMode !== mode) {
    set({ ...currentState, currentMode: mode });
    dispatchEvent('toolbar:mode-change', { mode });
    logger.debug(`Toolbar mode changed to: ${mode}`);
  }
}

/**
 * 고대비 모드 설정
 */
export function setHighContrast(enabled: boolean): void {
  const [get, set] = getToolbarStateSignal();
  const currentState = get();

  if (currentState.needsHighContrast !== enabled) {
    set({ ...currentState, needsHighContrast: enabled });
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
  const [get] = getToolbarStateSignal();
  return get().currentMode;
}

/**
 * 툴바 상태 요약 정보 (CSS 호버 시스템용으로 간소화)
 */
export function getToolbarInfo(): {
  currentMode: string;
  needsHighContrast: boolean;
} {
  const [get] = getToolbarStateSignal();
  const state = get();
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
 */
export function getToolbarExpandableState(): ToolbarExpandableState {
  const [get] = getExpandableStateSignal();
  return get();
}

/**
 * 설정 패널 확장 상태 accessor (반응형)
 * Solid.js 반응성을 보장하기 위해 signal accessor 직접 노출
 * @returns Signal accessor (() => boolean)
 */
export function getSettingsExpanded(): () => boolean {
  const [get] = getExpandableStateSignal();
  return () => get().isSettingsExpanded;
}

/**
 * 설정 패널 확장 상태 토글
 */
export function toggleSettingsExpanded(): void {
  const [get, set] = getExpandableStateSignal();
  const currentExpanded = get().isSettingsExpanded;
  const newExpanded = !currentExpanded;

  set({ isSettingsExpanded: newExpanded });

  dispatchEvent('toolbar:settings-expanded', { expanded: newExpanded });
  logger.debug(`Settings panel ${newExpanded ? 'expanded' : 'collapsed'}`);
}

/**
 * 설정 패널 확장 상태 명시적 설정
 */
export function setSettingsExpanded(expanded: boolean): void {
  const [get, set] = getExpandableStateSignal();
  const currentExpanded = get().isSettingsExpanded;

  if (currentExpanded !== expanded) {
    set({ isSettingsExpanded: expanded });
    dispatchEvent('toolbar:settings-expanded', { expanded });
    logger.debug(`Settings panel set to ${expanded ? 'expanded' : 'collapsed'}`);
  }
}
