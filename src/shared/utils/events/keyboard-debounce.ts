/**
 * @fileoverview Keyboard event debounce utility
 * Prevent excessive function calls during rapid key input to reduce CPU usage
 * Particularly effective for video control keys like ArrowUp/Down (volume), M (mute)
 */

import { logger } from '@shared/logging';

interface DebounceState {
  lastExecutionTime: number;
  lastKey: string;
}

const debounceState: DebounceState = {
  lastExecutionTime: 0,
  lastKey: '',
};

/**
 * Keyboard event debounce: maintain minimum time interval
 *
 * Goals:
 * - Prevent excessive volume control calls on ArrowUp/Down rapid input (100ms interval)
 * - Prevent duplicate mute toggle on M key rapid input (100ms interval)
 * - Prevent duplicate play/pause on Space rapid input (100ms interval)
 * - Navigation keys don't need debounce (immediate response)
 *
 * @param key Keyboard event key
 * @param minInterval Minimum execution interval (ms) - default 100ms
 * @returns true allows execution, false blocks (debounced)
 */
export function shouldExecuteKeyboardAction(key: string, minInterval: number = 100): boolean {
  const now = Date.now();
  const timeSinceLastExecution = now - debounceState.lastExecutionTime;

  // Block if same key and interval is below minimum
  if (key === debounceState.lastKey && timeSinceLastExecution < minInterval) {
    logger.debug(
      `[Keyboard Debounce] Blocked ${key} (${timeSinceLastExecution}ms < ${minInterval}ms)`
    );
    return false;
  }

  debounceState.lastExecutionTime = now;
  debounceState.lastKey = key;
  return true;
}

/**
 * Video control key debounce (100ms interval)
 * Recommended for ArrowUp/Down, M keys
 */
export function shouldExecuteVideoControlKey(key: string): boolean {
  const videoControlKeys = ['ArrowUp', 'ArrowDown', 'm', 'M'];
  if (!videoControlKeys.includes(key)) return true;
  return shouldExecuteKeyboardAction(key, 100);
}

/**
 * Play/pause key debounce (150ms interval, want slower response)
 * Recommended for Space key
 */
export function shouldExecutePlayPauseKey(key: string): boolean {
  if (key !== ' ' && key !== 'Space') return true;
  return shouldExecuteKeyboardAction(key, 150);
}

/**
 * Reset debounce state (call when closing gallery)
 */
export function resetKeyboardDebounceState(): void {
  debounceState.lastExecutionTime = 0;
  debounceState.lastKey = '';
  logger.debug('[Keyboard Debounce] State reset');
}
