/**
 * @fileoverview Bootstrap - Global Events Wiring
 * @description 전역 이벤트 핸들러 연결 및 해제
 * @module bootstrap/events
 */
import { logger } from '@/shared/logging';

/**
 * 이벤트 핸들러 해제 함수 타입
 */
export type Unregister = () => void;

/**
 * 전역 이벤트 핸들러를 연결합니다
 * - beforeunload, pagehide 이벤트를 구독하여 정리 작업 수행
 * - 호출 시에만 등록 (사이드이펙트 최소화)
 *
 * @param {() => void} onBeforeUnload - 페이지 언로드 시 실행할 콜백
 * @returns {Unregister} 이벤트 핸들러 해제 함수
 */
export function wireGlobalEvents(onBeforeUnload: () => void): Unregister {
  const beforeUnloadHandler = (): void => {
    onBeforeUnload();
  };

  window.addEventListener('beforeunload', beforeUnloadHandler);
  window.addEventListener('pagehide', beforeUnloadHandler);

  logger.debug('[events] 🧩 Global events wired');

  return () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.removeEventListener('pagehide', beforeUnloadHandler);
    logger.debug('[events] 🧩 Global events unwired');
  };
}
