/**
 * Phase 11 GREEN 테스트: 갤러리 재열기 (동일 트윗 동일 미디어)
 * 목표: open -> close -> 동일 media 재클릭(시뮬레이션) 시 EventManager initialized=true 로 복구.
 * 현재 상태: close 후 soft reset 으로 initialized=false, reopen 경로에서 자동 재초기화 미구현 가능성.
 * 기대(GREEN 미래): 두 번째 open 이후 initialized === true
 * 현재(RED 예상): false 유지 → 실패 유도
 */
import { describe, it, expect } from 'vitest';
import { createGalleryTestHarness } from '../../utils/galleryTestHarness';
import { EventManager } from '@/shared/services/EventManager';

// NOTE: 테스트 파일을 JS 구문으로 취급하는 환경에서 TS interface 파싱 오류 회피를 위해 JSDoc 사용
/**
 * @typedef {Object} DummyMedia
 * @property {string} id
 * @property {string} url
 * @property {'image'} type
 * @property {string} filename
 */

/**
 * @param {string} id
 * @returns {DummyMedia}
 */
function createDummyMedia(id) {
  // 전역 헬퍼 사용 (type literal 보존)
  // @ts-ignore
  return globalThis.__xegCreateImageMedia(id);
}

describe('Phase 11 GREEN: 갤러리 재열기 (동일 트윗 동일 미디어)', () => {
  it('open -> close -> open 두 번째 open 시 initialized 가 true 로 복구되어야 한다', async () => {
    const { app, eventManager } = await createGalleryTestHarness();

    const media = [createDummyMedia('m1'), createDummyMedia('m2')];

    // 1차 open (실제 앱 경로 사용)
    await app.openGallery(media, 0);
    await new Promise(r => globalThis.setTimeout(r, 5));

    // 초기 상태 접근 (미래 필요 시 유지). 현재는 사용하지 않아 의도적으로 무시.
    void eventManager.getGalleryStatus();

    // close
    app.closeGallery();
    await new Promise(r => globalThis.setTimeout(r, 15));
    const afterCloseStatus = eventManager.getGalleryStatus();
    expect(afterCloseStatus.initialized).toBe(false); // soft reset 확인

    // 2차 open (재열기)
    await app.openGallery(media, 1);
    await new Promise(r => globalThis.setTimeout(r, 15));

    const afterReopenStatus = EventManager.getInstance().getGalleryStatus();
    expect(afterReopenStatus.initialized).toBe(true); // 현재 RED: 실패 기대
  });
});
