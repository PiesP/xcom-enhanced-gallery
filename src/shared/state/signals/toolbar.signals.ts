/**
 * Toolbar state management
 */

import { logger } from '@shared/logging';
import { createSignalSafe, type SafeSignal } from '@shared/state/signals/signal-factory';

// ============================================================================
// Types
// ============================================================================

export interface ToolbarState {
  readonly currentMode: 'gallery' | 'settings' | 'download';
  readonly needsHighContrast: boolean;
}

export interface ToolbarExpandableState {
  readonly isSettingsExpanded: boolean;
}

export type ToolbarEvents = {
  'toolbar:mode-change': { mode: ToolbarState['currentMode'] };
  'toolbar:settings-expanded': { expanded: boolean };
};

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_TOOLBAR_STATE: ToolbarState = {
  currentMode: 'gallery',
  needsHighContrast: false,
};

const INITIAL_EXPANDABLE_STATE: ToolbarExpandableState = {
  isSettingsExpanded: false,
};

// ============================================================================
// Signals
// ============================================================================

const toolbarStateSignal: SafeSignal<ToolbarState> = createSignalSafe(INITIAL_TOOLBAR_STATE);
const expandableStateSignal: SafeSignal<ToolbarExpandableState> =
  createSignalSafe(INITIAL_EXPANDABLE_STATE);

// ============================================================================
// State Accessors
// ============================================================================

/**
 * Toolbar state with subscription support
 */
export const toolbarState = {
  get value(): ToolbarState {
    return toolbarStateSignal.value;
  },

  set value(newState: ToolbarState) {
    toolbarStateSignal.value = newState;
  },

  subscribe(callback: (state: ToolbarState) => void): () => void {
    try {
      return toolbarStateSignal.subscribe(state => {
        try {
          callback(state);
        } catch (error) {
          logger.warn('toolbar state callback error', { error });
        }
      });
    } catch (error) {
      logger.warn('toolbar state subscribe failed', { error });
      return () => {};
    }
  },
};

// ============================================================================
// Event Dispatcher
// ============================================================================

function dispatchEvent<K extends keyof ToolbarEvents>(event: K, data: ToolbarEvents[K]): void {
  try {
    const customEvent = new CustomEvent(`xeg-${event}`, { detail: data });
    document.dispatchEvent(customEvent);
    logger.debug(`Event dispatched: ${event}`, data);
  } catch (error) {
    logger.warn(`Failed to dispatch event: ${event}`, { error, data });
  }
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Change toolbar mode
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
 * Set high contrast mode
 */
export function setHighContrast(enabled: boolean): void {
  const currentState = toolbarStateSignal.value;

  if (currentState.needsHighContrast !== enabled) {
    toolbarStateSignal.value = { ...currentState, needsHighContrast: enabled };
    logger.debug(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get current toolbar mode
 */
export function getCurrentToolbarMode(): ToolbarState['currentMode'] {
  return toolbarStateSignal.value.currentMode;
}

/**
 * 툴바 상태 요약 정보 (CSS 호버 시스템용으로 간소화)
 * Phase A5.3: createSignalSafe 사용
/**
 * Get toolbar info summary
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
 * Register event listener
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

// Legacy alias
export const getCurrentMode = getCurrentToolbarMode;

// ============================================================================
// Expandable Panel API
// ============================================================================

/**
 * Get expandable panel state
 */
export function getToolbarExpandableState(): ToolbarExpandableState {
  return expandableStateSignal.value;
}

/**
 * Get settings expanded state accessor
 */
export function getSettingsExpanded(): () => boolean {
  return () => expandableStateSignal.value.isSettingsExpanded;
}

/**
 * Toggle settings panel
 */
export function toggleSettingsExpanded(): void {
  const currentExpanded = expandableStateSignal.value.isSettingsExpanded;
  const newExpanded = !currentExpanded;

  expandableStateSignal.value = { isSettingsExpanded: newExpanded };

  dispatchEvent('toolbar:settings-expanded', { expanded: newExpanded });
  logger.debug(`Settings panel ${newExpanded ? 'expanded' : 'collapsed'}`);
}

/**
 * Set settings panel expansion
 */
export function setSettingsExpanded(expanded: boolean): void {
  const currentExpanded = expandableStateSignal.value.isSettingsExpanded;

  if (currentExpanded !== expanded) {
    expandableStateSignal.value = { isSettingsExpanded: expanded };
    dispatchEvent('toolbar:settings-expanded', { expanded });
    logger.debug(`Settings panel set to ${expanded ? 'expanded' : 'collapsed'}`);
  }
}
