/**
 * @fileoverview Core 모듈 배럴 export
 * @description 이벤트 리스너 관리 기능 통합 export
 */

export {
  type EventContext,
  type EventHandlingResult,
  type EventHandlers,
  type GalleryEventOptions,
  type GalleryEventSnapshot,
} from './event-context';
export { listenerRegistry } from './listener-registry';
export {
  addListener,
  removeEventListenerManaged,
  removeEventListenersByContext,
  removeAllEventListeners,
  getEventListenerStatus,
} from './listener-manager';
