/**
 * @fileoverview 이벤트 핸들러 및 컨텍스트 타입 정의
 * @description Phase 329: 파일 분리 (SRP 준수)
 *              events.ts에서 타입 정의 분리
 */

import type { MediaInfo } from '../../../types/media.types';

/**
 * 이벤트 리스너 컨텍스트
 * 등록된 리스너의 메타데이터 추적
 */
export interface EventContext {
  id: string;
  element: EventTarget;
  type: string;
  listener: EventListener;
  options?: AddEventListenerOptions | undefined;
  context?: string | undefined;
  created: number;
}

/**
 * 이벤트 처리 결과
 */
export interface EventHandlingResult {
  handled: boolean;
  reason?: string;
  mediaInfo?: MediaInfo;
}

/**
 * 갤러리 이벤트 핸들러 인터페이스
 */
export interface EventHandlers {
  onMediaClick: (mediaInfo: MediaInfo, element: HTMLElement, event: MouseEvent) => Promise<void>;
  onGalleryClose: () => void;
  onKeyboardEvent?: (event: KeyboardEvent) => void;
}

/**
 * 갤러리 이벤트 옵션
 */
export interface GalleryEventOptions {
  enableKeyboard: boolean;
  enableMediaDetection: boolean;
  debugMode: boolean;
  preventBubbling: boolean;
  context: string;
}

/**
 * 갤러리 이벤트 상태 스냅샷
 */
export interface GalleryEventSnapshot {
  initialized: boolean;
  listenerCount: number;
  options: GalleryEventOptions | null;
  hasHandlers: boolean;
  hasScopedTarget: boolean;
}
