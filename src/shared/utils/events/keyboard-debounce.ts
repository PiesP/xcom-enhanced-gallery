/**
 * @fileoverview Keyboard debounce helpers.
 *
 * This module is intentionally small and dependency-free.
 */

interface KeyboardDebounceState {
  lastExecutionTime: number;
  lastKey: string;
}

const keyboardDebounceState: KeyboardDebounceState = {
  lastExecutionTime: 0,
  lastKey: '',
};

export function shouldExecuteKeyboardAction(key: string, minIntervalMs: number): boolean {
  const now = Date.now();
  const timeSinceLastExecution = now - keyboardDebounceState.lastExecutionTime;

  if (key === keyboardDebounceState.lastKey && timeSinceLastExecution < minIntervalMs) {
    return false;
  }

  keyboardDebounceState.lastExecutionTime = now;
  keyboardDebounceState.lastKey = key;
  return true;
}

export function shouldExecuteVideoControlKey(key: string): boolean {
  // Volume / mute keys are spammy when held down.
  return key === 'ArrowUp' || key === 'ArrowDown' || key === 'm' || key === 'M'
    ? shouldExecuteKeyboardAction(key, 100)
    : true;
}

export function shouldExecutePlayPauseKey(key: string): boolean {
  return key === ' ' || key === 'Space' ? shouldExecuteKeyboardAction(key, 150) : true;
}

export function resetKeyboardDebounceState(): void {
  keyboardDebounceState.lastExecutionTime = 0;
  keyboardDebounceState.lastKey = '';
}
