/**
 * @fileoverview Event Management Module
 * @version 3.0.0 - Simplified Event System
 *
 * @deprecated 이 디렉토리는 Phase 3에서 제거됩니다.
 * 새로운 이벤트 시스템을 사용하세요:
 * - @shared/utils/event-dispatcher
 * - @shared/utils/event-utils
 */

// 레거시 호환성을 위한 재export (사용 금지)
export {
  initializeGalleryEvents,
  cleanupGalleryEvents,
  getGalleryEventStatus,
  updateGalleryEventOptions,
  GalleryEventCoordinator,
  type EventHandlers,
  type GalleryEventOptions,
} from '../event-utils';
