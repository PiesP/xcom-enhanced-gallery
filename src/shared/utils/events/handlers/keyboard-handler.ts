/**
 * @fileoverview 키보드 이벤트 핸들러
 * PC-only 정책: 키보드 이벤트만 처리
 * 지원 키: Space (재생/일시정지), 화살표 (네비게이션), M (음소거)
 */

import { logger } from '@shared/logging';
import {
  navigateToItem,
  navigatePrevious,
  navigateNext,
  gallerySignals,
} from '../../../state/signals/gallery.signals';
import { shouldExecuteVideoControlKey, shouldExecutePlayPauseKey } from '../../keyboard-debounce';
import { executeVideoControl } from './video-control-helper';
import type { EventHandlers, GalleryEventOptions } from '../core/event-context';

/**
 * 갤러리 열린 상태 확인
 */
function checkGalleryOpen(): boolean {
  return gallerySignals.isOpen.value;
}

/**
 * 안전한 함수 실행 래퍼 (에러 로깅 포함)
 */
function safeExecute(fn: () => void, _ctx: string): void {
  try {
    fn();
  } catch {
    // 무시
  }
}

/**
 * 키보드 이벤트 처리
 * Space: 재생/일시정지, 화살표: 네비게이션, M: 음소거
 */
export function handleKeyboardEvent(
  event: KeyboardEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): void {
  if (!options.enableKeyboard) return;

  try {
    // 갤러리 열린 상태에서 네비게이션 키들의 기본 스크롤을 차단하여 충돌 방지
    if (checkGalleryOpen()) {
      const key = event.key;
      const isNavKey =
        key === 'Home' ||
        key === 'End' ||
        key === 'PageDown' ||
        key === 'PageUp' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === ' ' ||
        key === 'Space';

      // 비디오 제어 키: Space(재생/일시정지), ArrowUp/Down(볼륨), M/m(음소거)
      const isVideoKey =
        key === ' ' ||
        key === 'Space' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown' ||
        key === 'm' ||
        key === 'M';

      if (isNavKey || isVideoKey) {
        // 기본 스크롤/페이지 전환을 차단
        event.preventDefault();
        event.stopPropagation();

        switch (key) {
          case ' ':
          case 'Space':
            // Keyboard debounce: Space 반복 입력 시 재생/일시정지 중복 호출 방지 (150ms 간격)
            if (shouldExecutePlayPauseKey(event.key)) {
              safeExecute(() => executeVideoControl('togglePlayPause'), 'togglePlayPauseCurrent');
            }
            break;
          case 'ArrowLeft':
            safeExecute(() => navigatePrevious('keyboard'), 'navigatePrevious');
            break;
          case 'ArrowRight':
            safeExecute(() => navigateNext('keyboard'), 'navigateNext');
            break;
          case 'Home':
            safeExecute(() => navigateToItem(0, 'keyboard'), 'navigateToItem(Home)');
            break;
          case 'End':
            safeExecute(() => {
              const lastIndex = Math.max(0, gallerySignals.mediaItems.value.length - 1);
              navigateToItem(lastIndex, 'keyboard');
            }, 'navigateToItem(End)');
            break;
          case 'PageDown':
            safeExecute(() => {
              // Page Down: +5 items
              const nextIndex = Math.min(
                gallerySignals.mediaItems.value.length - 1,
                gallerySignals.currentIndex.value + 5
              );
              navigateToItem(nextIndex, 'keyboard');
            }, 'navigateToItem(PageDown)');
            break;
          case 'PageUp':
            safeExecute(() => {
              // Page Up: -5 items
              const prevIndex = Math.max(0, gallerySignals.currentIndex.value - 5);
              navigateToItem(prevIndex, 'keyboard');
            }, 'navigateToItem(PageUp)');
            break;
          case 'ArrowUp':
            // Keyboard debounce: ArrowUp 반복 입력 시 볼륨 조절 과도 호출 방지 (100ms 간격)
            if (shouldExecuteVideoControlKey(event.key)) {
              safeExecute(() => executeVideoControl('volumeUp'), 'volumeUpCurrent');
            }
            break;
          case 'ArrowDown':
            // Keyboard debounce: ArrowDown 반복 입력 시 볼륨 조절 과도 호출 방지 (100ms 간격)
            if (shouldExecuteVideoControlKey(event.key)) {
              safeExecute(() => executeVideoControl('volumeDown'), 'volumeDownCurrent');
            }
            break;
          case 'm':
          case 'M':
            // Keyboard debounce: M 키 반복 입력 시 음소거 토글 중복 호출 방지 (100ms 간격)
            if (shouldExecuteVideoControlKey(event.key)) {
              safeExecute(() => executeVideoControl('toggleMute'), 'toggleMuteCurrent');
            }
            break;
        }

        // 커스텀 핸들러 위임
        if (handlers.onKeyboardEvent) {
          handlers.onKeyboardEvent(event);
        }
        return;
      }
    }

    // ESC 키로 갤러리 닫기
    if (event.key === 'Escape' && checkGalleryOpen()) {
      handlers.onGalleryClose();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // 커스텀 키보드 핸들러 호출
    if (handlers.onKeyboardEvent) {
      handlers.onKeyboardEvent(event);
    }
  } catch (error) {
    logger.error('Error handling keyboard event:', error);
  }
}
