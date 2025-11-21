import { safePerformanceNow } from '../../utils/timer-management';

export type FocusSource = 'auto' | 'manual' | 'external';

export interface FocusState {
  index: number | null;
  source: FocusSource;
  timestamp: number;
}

export interface FocusTracking {
  lastAutoFocusedIndex: number | null;
  lastAppliedIndex: number | null;
  hasPendingRecompute: boolean;
  lastUpdateTime: number;
}
export const INITIAL_FOCUS_STATE: FocusState = {
  index: null,
  source: 'auto',
  timestamp: 0,
};

export const INITIAL_FOCUS_TRACKING: FocusTracking = {
  lastAutoFocusedIndex: null,
  lastAppliedIndex: null,
  hasPendingRecompute: false,
  lastUpdateTime: 0,
};
export function isValidFocusState(state: FocusState): boolean {
  if (state.index !== null) {
    if (typeof state.index !== 'number' || Number.isNaN(state.index) || state.index < 0) {
      return false;
    }
  }

  if (!(['auto', 'manual', 'external'] as const).includes(state.source as FocusSource)) {
    return false;
  }

  if (typeof state.timestamp !== 'number' || state.timestamp < 0) {
    return false;
  }

  return true;
}
export function createFocusState(index: number | null, source: FocusSource = 'auto'): FocusState {
  return {
    index,
    source,
    timestamp: Date.now(),
  };
}

export function createFocusTracking(
  overrides?: Partial<Omit<FocusTracking, 'lastUpdateTime'>>
): FocusTracking {
  return {
    ...INITIAL_FOCUS_TRACKING,
    lastUpdateTime: safePerformanceNow(),
    ...overrides,
  };
}
export function isSameFocusState(state1: FocusState, state2: FocusState): boolean {
  return state1.index === state2.index && state1.source === state2.source;
}

export function isSameFocusTracking(tracking1: FocusTracking, tracking2: FocusTracking): boolean {
  return (
    tracking1.lastAutoFocusedIndex === tracking2.lastAutoFocusedIndex &&
    tracking1.lastAppliedIndex === tracking2.lastAppliedIndex &&
    tracking1.hasPendingRecompute === tracking2.hasPendingRecompute
  );
}
export function updateFocusTracking(
  tracking: FocusTracking,
  updates: Partial<Omit<FocusTracking, 'lastUpdateTime'>>
): FocusTracking {
  return {
    ...tracking,
    ...updates,
    lastUpdateTime: safePerformanceNow(),
  };
}
export function resetFocusTracking(): FocusTracking {
  return createFocusTracking();
}
