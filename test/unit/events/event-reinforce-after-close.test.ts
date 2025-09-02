/**
 * Phase 11 GREEN 테스트 (초기 RED → soft reset 구현 후 GREEN 전환)
 * 목적: 갤러리 닫기 후 이벤트 시스템이 재우선순위/재바인딩 준비 상태(initialized=false)가 되었는지 검증.
 * soft reset 구현으로 close 후 initialized=false 가 되어야 함.
 */

import { describe, it, expect } from 'vitest';
import { createGalleryTestHarness } from '../../utils/galleryTestHarness';
import { openGallery as openGallerySignal } from '@/shared/state/signals/gallery.signals';

/**
 * 현재 기대(GREEN): closeGallery 수행 후 initialized=false.
 */
describe('Phase 11 GREEN: 갤러리 닫은 후 이벤트 재우선순위 재설정 준비 상태', () => {
  it('closeGallery 호출 후 EventManager.getGalleryStatus().initialized 가 false 여야 한다', async () => {
    const { app, eventManager } = await createGalleryTestHarness();

    // 실제 갤러리를 연 뒤 닫는 시나리오로 soft reset 동작 기대
    // @ts-ignore 전역 헬퍼
    const dummyMedia = globalThis.__xegCreateImageMedia('m1');
    openGallerySignal([dummyMedia], 0);

    // close 실행
    app.closeGallery();

    // 약간의 비동기 tick (close 내 비동기 IIFE soft reset 반영 대기)
    await new Promise(r => globalThis.setTimeout(r, 10));

    const afterCloseStatus = eventManager.getGalleryStatus();

    // GREEN 기대: initialized 가 false 여야 함 (현재 실패 시 RED 유지)
    expect(afterCloseStatus.initialized).toBe(false);
  });
});
