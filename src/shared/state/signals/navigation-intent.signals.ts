/**
 * @fileoverview Navigation intent signals for gallery focus/scroll coordination
 * @description Distinguishes source of index changes to avoid unwanted auto scroll.
 */
import { getPreactSignals } from '@shared/external/vendors';

export type NavigationIntent =
  | 'idle'
  | 'toolbar'
  | 'toolbar-prev'
  | 'toolbar-next'
  | 'user-scroll'
  | 'auto';

interface NavigationIntentState {
  intent: NavigationIntent;
  lastUserScrollAt: number; // epoch ms
}

const { signal } = getPreactSignals();

const stateSignal = signal<NavigationIntentState>({ intent: 'idle', lastUserScrollAt: 0 });

export const navigationIntentState = {
  get value(): NavigationIntentState {
    return stateSignal.value;
  },
  set value(v: NavigationIntentState) {
    stateSignal.value = v;
  },
  setIntent(intent: NavigationIntent) {
    // 동일 intent 반복 설정 시 불필요한 re-render 방지 (테스트 OOM 루프 예방)
    if (stateSignal.value.intent === intent) return;
    stateSignal.value = { ...stateSignal.value, intent };
  },
  markUserScroll() {
    const now = Date.now();
    stateSignal.value = { intent: 'user-scroll', lastUserScrollAt: now };
  },
  resetIf(predicate: (s: NavigationIntentState) => boolean) {
    const cur = stateSignal.value;
    if (predicate(cur)) {
      stateSignal.value = { ...cur, intent: 'idle' };
    }
  },
};

export function getNavigationIntent(): NavigationIntent {
  return navigationIntentState.value.intent;
}

export function setToolbarIntent(direction: 'prev' | 'next'): void {
  const intent = direction === 'prev' ? 'toolbar-prev' : 'toolbar-next';
  navigationIntentState.setIntent(intent);
}

export function setAutoIntent(): void {
  navigationIntentState.setIntent('auto');
}

export function markUserScroll(): void {
  navigationIntentState.markUserScroll();
}

export function resetIntent(): void {
  navigationIntentState.setIntent('idle');
}
