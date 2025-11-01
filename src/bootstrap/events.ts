/**
 * @fileoverview Global Events Wiring
 * @description 전역 이벤트 핸들러 연결 및 해제 (pagehide 전용)
 * @module bootstrap/events
 */

import { logger } from '../shared/logging';

/**
 * 이벤트 핸들러 해제 함수 타입
 */
export type Unregister = () => void;

/**
 * 전역 이벤트 핸들러 연결
 *
 * beforeunload, pagehide 이벤트를 구독하여 페이지 언로드 시 정리 작업 수행합니다.
 * 호출 시에만 등록하며, 반환된 함수로 언제든지 해제 가능합니다.
 *
 * @param onBeforeUnload - 페이지 언로드 시 실행할 콜백
 * @returns 이벤트 핸들러 해제 함수
 */
export function wireGlobalEvents(onBeforeUnload: () => void): Unregister {
  // BFCache 호환성: beforeunload 등록은 브라우저의 페이지 스냅샷(BFCache) 탑재를 막을 수 있음
  // 정리는 pagehide에서만 수행하여 뒤로가기 시 즉시 복원 품질을 보존한다.
  const handler = (): void => {
    onBeforeUnload();
  };

  window.addEventListener('pagehide', handler);

  logger.debug('[events] 🧩 Global events wired (pagehide only)');

  return () => {
    window.removeEventListener('pagehide', handler);
    logger.debug('[events] 🧩 Global events unwired');
  };
}
