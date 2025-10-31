/**
 * @file Window Load Wait Utility
 * @description window의 load 이벤트가 발생할 때까지 대기하는 Promise 유틸리티
 * - 이미 로드 완료 상태(document.readyState === 'complete')면 즉시 resolve
 * - 지정된 시간 내 load가 오지 않으면 타임아웃으로 resolve(false)
 * - 타이머는 globalTimerManager로 관리하여 테스트/정리에 안전
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from './timer-management';

export interface WaitForWindowLoadOptions {
  /** 최대 대기 시간(ms). 기본 8000ms */
  timeoutMs?: number;
  /** 테스트를 위해 fast-path(readyState === 'complete')를 무시하고 load 이벤트 대기 경로를 강제 */
  forceEventPath?: boolean;
}

/**
 * window load까지 대기
 * @returns true(load 감지) | false(타임아웃)
 */
export function waitForWindowLoad(options: WaitForWindowLoadOptions = {}): Promise<boolean> {
  const { timeoutMs = 8000, forceEventPath = false } = options;

  // 이미 로드 완료 상태면 즉시 성공
  if (!forceEventPath && document.readyState === 'complete') {
    if (import.meta.env.DEV) {
      logger.debug('[window-load] already complete');
    }
    return Promise.resolve(true);
  }

  return new Promise<boolean>(resolve => {
    let done = false;

    const onLoad = () => {
      if (done) return;
      done = true;
      if (import.meta.env.DEV) {
        logger.debug('[window-load] load event received');
      }
      cleanup();
      resolve(true);
    };

    const onTimeout = () => {
      if (done) return;
      done = true;
      logger.warn('[window-load] timeout reached before load', { timeoutMs });
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      window.removeEventListener('load', onLoad);
      if (timeoutId) {
        globalTimerManager.clearTimeout(timeoutId);
      }
    };

    // 이벤트 등록 (PC 전용 정책에 부합 - load는 Window 이벤트)
    window.addEventListener('load', onLoad, { once: true });

    const timeoutId = globalTimerManager.setTimeout(onTimeout, timeoutMs);
  });
}
