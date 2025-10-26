/**
 * @fileoverview 키보드 이벤트 debounce 유틸리티
 * 연타 입력 시 과도한 함수 호출을 방지하여 CPU 사용률 감소
 * 특히 ArrowUp/Down(볼륨), M(음소거) 같은 비디오 제어 키에서 효과적
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
 * 키보드 이벤트 debounce: 최소 시간 간격 유지
 *
 * 목표:
 * - ArrowUp/Down 연타 시 볼륨 조절 과도한 호출 방지 (100ms 간격)
 * - M 키 연타 시 음소거 토글 중복 방지 (100ms 간격)
 * - Space 연타 시 재생/일시정지 중복 방지 (100ms 간격)
 * - 네비게이션 키는 debounce 불필요 (즉시 반응)
 *
 * @param key 키보드 이벤트 키
 * @param minInterval 최소 실행 간격 (ms) - 기본 100ms
 * @returns true이면 실행 허용, false이면 제한 (debounce 중)
 */
export function shouldExecuteKeyboardAction(key: string, minInterval: number = 100): boolean {
  const now = Date.now();
  const timeSinceLastExecution = now - debounceState.lastExecutionTime;

  // 같은 키이고 최소 간격 미만이면 제한
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
 * 비디오 제어 키 debounce (100ms 간격)
 * ArrowUp/Down, M 키에 권장
 */
export function shouldExecuteVideoControlKey(key: string): boolean {
  const videoControlKeys = ['ArrowUp', 'ArrowDown', 'm', 'M'];
  if (!videoControlKeys.includes(key)) return true;
  return shouldExecuteKeyboardAction(key, 100);
}

/**
 * 재생/일시정지 키 debounce (150ms 간격, 더 느린 반응 원함)
 * Space 키에 권장
 */
export function shouldExecutePlayPauseKey(key: string): boolean {
  if (key !== ' ' && key !== 'Space') return true;
  return shouldExecuteKeyboardAction(key, 150);
}

/**
 * Debounce 상태 초기화 (갤러리 닫기 시 호출)
 */
export function resetKeyboardDebounceState(): void {
  debounceState.lastExecutionTime = 0;
  debounceState.lastKey = '';
  logger.debug('[Keyboard Debounce] State reset');
}
