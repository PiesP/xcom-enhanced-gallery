/**
 * @fileoverview Window load 이벤트 대기 유틸리티
 * @version 1.0.0 - Phase 289: 갤러리 렌더링을 로드 완료 이후로 지연
 *
 * 문서 및 서브 리소스(이미지, 폰트 등)가 완전히 로드된 이후 갤러리를 초기화하여
 * FOUC(Flash of Unstyled Content) 유사 현상과 이미지 디코드 레이스를 방지합니다.
 */

import { logger } from '../../logging';
import { safeWindow } from './safe-browser';

/**
 * Window load 이벤트 대기 타임아웃 (밀리초)
 * @default 8000 - 8초
 */
const DEFAULT_LOAD_TIMEOUT = 8000;

/**
 * Window load 완료 상태
 */
type LoadState = 'complete' | 'waiting' | 'timeout';

/**
 * Window load 이벤트를 대기합니다.
 *
 * 동작:
 * - 이미 load 완료된 경우 즉시 resolve
 * - 아직 로딩 중이면 load 이벤트 대기
 * - 타임아웃(기본 8초) 도달 시 resolve (초기화 누락 방지)
 *
 * @param timeoutMs - 타임아웃 시간 (밀리초)
 * @returns Promise<LoadState> - 완료 상태
 *
 * @example
 * ```typescript
 * const state = await waitForWindowLoad();
 * if (state === 'complete') {
 *   console.log('페이지가 이미 로드되어 있었습니다.');
 * } else if (state === 'waiting') {
 *   console.log('load 이벤트를 기다렸습니다.');
 * } else {
 *   console.log('타임아웃으로 인해 초기화를 진행합니다.');
 * }
 * ```
 */
export async function waitForWindowLoad(
  timeoutMs: number = DEFAULT_LOAD_TIMEOUT
): Promise<LoadState> {
  const win = safeWindow();

  // 브라우저 환경이 아닌 경우 (테스트 등) 즉시 반환
  if (!win) {
    logger.debug('[waitForWindowLoad] Window not available, returning immediately');
    return 'complete';
  }

  // 이미 로드 완료된 경우
  if (win.document.readyState === 'complete') {
    logger.debug('[waitForWindowLoad] Document already loaded');
    return 'complete';
  }

  logger.debug('[waitForWindowLoad] Waiting for window load event', {
    readyState: win.document.readyState,
    timeoutMs,
  });

  return new Promise<LoadState>(resolve => {
    let resolved = false;

    const handleLoad = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      logger.debug('[waitForWindowLoad] Load event received');
      resolve('waiting');
    };

    const handleTimeout = () => {
      if (resolved) return;
      resolved = true;
      win.removeEventListener('load', handleLoad);
      logger.warn('[waitForWindowLoad] Load timeout reached, proceeding anyway', {
        timeoutMs,
      });
      resolve('timeout');
    };

    // load 이벤트 리스너 등록
    win.addEventListener('load', handleLoad, { once: true });

    // 타임아웃 설정
    const timeoutId = setTimeout(handleTimeout, timeoutMs);
  });
}
