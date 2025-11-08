/**
 * @fileoverview Core module barrel export
 * @description Integration export of event listener management features
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
