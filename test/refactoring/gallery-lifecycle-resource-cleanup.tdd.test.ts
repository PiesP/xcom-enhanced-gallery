/**
 * @fileoverview 갤러리 라이프사이클 - 부분 정리 전략 검증 (UPDATED 2025-08-16)
 * 변경된 설계:
 * - closeGallery() 는 전체 destroy 가 아닌 cleanup (부분 정리) 만 수행하여
 *   캡처 단계 리스너(재초기화 트리거)를 유지한다.
 * - 완전 정리(destroyGalleryEvents)는 GalleryApp.cleanup() 또는 테스트 teardown 에서만 수행.
 * 기대사항(GREEN):
 * 1) closeGallery() 직후 listener 가 0 이 아님 (>=1 유지) → 재초기화 가능
 * 2) 여러 Open/Close 반복 시 listener 개수가 선형 증가하지 않고 일정 upper bound 내 관리
 * 3) closeGallery() 후 getGalleryEventStatus().initialized 는 true 유지 (재사용 목적)
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

describe('Gallery 라이프사이클 부분 정리 전략 (Partial Cleanup)', () => {
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

  it('closeGallery 후 listener 가 유지되어 재초기화 가능해야 한다', () => {
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
    expect(activeAfterClose).toBeGreaterThan(0); // 부분 정리 전략: listener 유지
  });

  it('closeGallery 후 initialized 상태가 true 로 유지되어야 한다', () => {
    openGallery(dummyItems as any, 0);
    closeGallery();

    const status = getGalleryEventStatus();
    // 기대: 닫힌 즉시 initialized=false (현재는 true 유지 가능성 → 실패)
    expect(status.initialized).toBe(true); // 부분 정리 전략
  });

  it('여러 번 Open/Close 반복 시 listener 수가 급격히 증가하지 않아야 한다', () => {
    const cycles = 3;
    for (let i = 0; i < cycles; i++) {
      openGallery(dummyItems as any, 0);
      closeGallery();
    }

    // 기대: 누적 리스너 0 (현재는 누수 가능 → 실패)
    // 부분 정리 동안 기본 capture listener (2개 내외) 가 유지됨.
    // 반복 후에도 과도한 증가(예: > 8) 가 없어야 함.
    expect(getActiveListenerCount()).toBeLessThanOrEqual(8);
  });
});
