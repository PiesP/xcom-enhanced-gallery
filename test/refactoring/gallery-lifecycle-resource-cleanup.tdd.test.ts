/**
 * @fileoverview TDD RED: 갤러리 라이프사이클 리소스(이벤트) 정리 검증
 * 목표(현재 실패 예상):
 * 1) 갤러리 닫기(closeGallery) 후 갤러리 관련 이벤트 리스너가 모두 제거되어야 한다 -> 활성 리스너 0 기대
 * 2) 다중 Open/Close 사이클에서 누적 리스너가 증가하지 않아야 한다
 * 3) 갤러리 닫힌 후 getGalleryEventStatus().initialized 가 false 여야 한다
 *
 * 현재 구현 추정:
 * - closeGallery() 는 상태(isOpen 등)만 업데이트하고 이벤트 리스너 정리를 호출하지 않음
 * - cleanupGalleryEvents() 를 직접 호출해야 정리됨
 * - 따라서 본 테스트는 RED 단계에서 실패해야 TDD 사이클 성립
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import {
  initializeGalleryEvents,
  getGalleryEventStatus,
  getActiveListenerCount,
  cleanupGalleryEvents,
} from '@shared/utils/events';

// 최소 MediaInfo 대역 - openGallery 가 mediaItems 배열 길이만 사용하므로 필수 속성만 형식상 제공
interface MinimalMediaInfo {
  id: string;
  type?: string;
}

const dummyItems: MinimalMediaInfo[] = [{ id: 'm1', type: 'image' }];

describe('TDD RED: Gallery 라이프사이클 리소스 정리', () => {
  beforeEach(async () => {
    // 매 테스트마다 새로 초기화
    await initializeGalleryEvents({
      // 필수 핸들러 최소 구현 (noop)
      onMediaClick: () => {},
      onGalleryClose: () => {},
      onKeyboardEvent: () => {},
    });
  });

  afterEach(() => {
    // 안전 정리 (GREEN 단계에서 closeGallery 내부 정리가 추가되면 여전히 통과)
    cleanupGalleryEvents();
  });

  it('RED: closeGallery 후 활성 이벤트 리스너가 0 이어야 한다', () => {
    // Given: 이벤트 초기화됨
    const statusBefore = getGalleryEventStatus();
    expect(statusBefore.initialized).toBe(true);
    const listenersBefore = getActiveListenerCount();
    expect(listenersBefore).toBeGreaterThan(0); // 보호적 가정

    // When: 갤러리 열고 닫기
    openGallery(dummyItems as any, 0);
    closeGallery();

    // Then (기대 - 아직 구현 X): 자동 정리 → 0
    // 현재는 cleanupGalleryEvents() 를 호출하지 않았으므로 실패 예상
    const activeAfterClose = getActiveListenerCount();
    expect(activeAfterClose).toBe(0); // RED
  });

  it('RED: closeGallery 후 이벤트 시스템 initialized 가 false 여야 한다', () => {
    openGallery(dummyItems as any, 0);
    closeGallery();

    const status = getGalleryEventStatus();
    // 기대: 닫힌 즉시 initialized=false (현재는 true 유지 가능성 → 실패)
    expect(status.initialized).toBe(false); // RED
  });

  it('RED: 여러 번 Open/Close 반복 후 리스너 누수 없어야 한다', () => {
    const cycles = 3;
    for (let i = 0; i < cycles; i++) {
      openGallery(dummyItems as any, 0);
      closeGallery();
    }

    // 기대: 누적 리스너 0 (현재는 누수 가능 → 실패)
    expect(getActiveListenerCount()).toBe(0); // RED
  });
});
