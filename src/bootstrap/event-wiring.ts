import { logger } from '@/shared/logging';

export type Unregister = () => void;

/**
 * 전역 이벤트 핸들러 연결 (사이드이펙트 없는 호출 기반)
 */
export function wireGlobalEvents(onBeforeUnload: () => void): Unregister {
  const beforeUnloadHandler = (): void => {
    onBeforeUnload();
  };

  window.addEventListener('beforeunload', beforeUnloadHandler);
  window.addEventListener('pagehide', beforeUnloadHandler);

  logger.debug('🧩 Global events wired');
  if (import.meta.env.MODE === 'test') {
    logger.debug('[TEST] wired global events: beforeunload + pagehide');
  }

  return () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    window.removeEventListener('pagehide', beforeUnloadHandler);
    logger.debug('🧩 Global events unwired');
    if (import.meta.env.MODE === 'test') {
      logger.debug('[TEST] unwired global events: beforeunload + pagehide');
    }
  };
}
