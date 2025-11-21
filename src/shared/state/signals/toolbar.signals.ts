/**
 * Toolbar state management
 */

import { logger } from '@shared/logging';
import { createSignalSafe, type SafeSignal } from '@shared/state/signals/signal-factory';

// ============================================================================
// Types
// ============================================================================

/**
 * Toolbar mode state
 *
 * @description Defines the display mode state of the toolbar.
 * Different from UI state (ToolbarState in toolbar.types.ts).
 *
 * - 'gallery': Gallery mode
 * - 'settings': Settings mode
 * - 'download': Download mode
 */
export type ToolbarModeState = 'gallery' | 'settings' | 'download';

/**
 * Toolbar state (mode management)
 *
 * @description Manages current toolbar mode and accessibility settings.
 * @note For UI state, see ToolbarState in @shared/types/toolbar.types.ts
 */
export interface ToolbarModeStateData {
  readonly currentMode: ToolbarModeState;
}

export interface ToolbarExpandableState {
  readonly isSettingsExpanded: boolean;
}

export type ToolbarEvents = {
  'toolbar:mode-change': { mode: ToolbarModeState };
  'toolbar:settings-expanded': { expanded: boolean };
};

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_TOOLBAR_STATE: ToolbarModeStateData = {
  currentMode: 'gallery',
};

const INITIAL_EXPANDABLE_STATE: ToolbarExpandableState = {
  isSettingsExpanded: false,
};

// ============================================================================
// Signals
// ============================================================================

const toolbarStateSignal: SafeSignal<ToolbarModeStateData> =
  createSignalSafe(INITIAL_TOOLBAR_STATE);
const expandableStateSignal: SafeSignal<ToolbarExpandableState> =
  createSignalSafe(INITIAL_EXPANDABLE_STATE);

// ============================================================================
// State Accessors
// ============================================================================

/**
 * Toolbar state with subscription support
 */
export const toolbarState = {
  get value(): ToolbarModeStateData {
    return toolbarStateSignal.value;
  },

  set value(newState: ToolbarModeStateData) {
    toolbarStateSignal.value = newState;
  },

  subscribe(callback: (state: ToolbarModeStateData) => void): () => void {
    return toolbarStateSignal.subscribe(state => {
      try {
        callback(state);
      } catch (error) {
        logger.warn('toolbar state callback error', { error });
      }
    });
  },
};

// ============================================================================
// Event Dispatcher
// ============================================================================

function dispatchEvent<K extends keyof ToolbarEvents>(event: K, data: ToolbarEvents[K]): void {
  const detail = { ...data };
  const doc = globalThis.document;

  if (!doc || typeof doc.dispatchEvent !== 'function') {
    logger.debug(`Event dispatch skipped: ${event} (no document)`, detail);
    return;
  }

  const CustomEventCtor = globalThis.CustomEvent;
  if (typeof CustomEventCtor !== 'function') {
    logger.debug(`Event dispatch skipped: ${event} (no CustomEvent)`, detail);
    return;
  }

  try {
    const customEvent = new CustomEventCtor(`xeg-${event}`, { detail });
    doc.dispatchEvent(customEvent);
    logger.debug(`Event dispatched: ${event}`, detail);
  } catch (error) {
    logger.warn(`Failed to dispatch event: ${event}`, { error, detail });
  }
}

// ============================================================================
// Actions
// ============================================================================

/**
 * Change toolbar mode
 */
export function updateToolbarMode(mode: ToolbarModeState): void {
  const currentState = toolbarStateSignal.value;

  if (currentState.currentMode !== mode) {
    toolbarStateSignal.value = { ...currentState, currentMode: mode };
    dispatchEvent('toolbar:mode-change', { mode });
    logger.debug(`Toolbar mode changed to: ${mode}`);
  }
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get current toolbar mode
 */
export function getCurrentToolbarMode(): ToolbarModeState {
  return toolbarStateSignal.value.currentMode;
}

/**
 * Get toolbar info summary
 *
 * @description Returns a snapshot of the toolbar mode signal for hover/ARIA helpers.
 */
export function getToolbarInfo(): ToolbarModeStateData {
  const state = toolbarStateSignal.value;
  return {
    currentMode: state.currentMode,
  };
}

/**
 * Register event listener
 */
export function addEventListener<K extends keyof ToolbarEvents>(
  event: K,
  handler: (data: ToolbarEvents[K]) => void
): () => void {
  const doc = globalThis.document;
  if (!doc || typeof doc.addEventListener !== 'function') {
    logger.debug(`Listener skipped: ${event} (no document)`);
    return () => {};
  }

  const eventName = `xeg-${event}`;

  const listener = (e: CustomEvent) => {
    try {
      handler(e.detail as ToolbarEvents[K]);
    } catch (error) {
      logger.warn(`Listener callback failed: ${event}`, { error });
    }
  };

  doc.addEventListener(eventName, listener as EventListener);

  return () => {
    doc.removeEventListener(eventName, listener as EventListener);
  };
}

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
