/**
 * Phase 11 GREEN 검증 테스트: close 후 MutationObserver 기반 reinforce 동작
 * 절차:
 * 1) 갤러리 open -> initialized true (간접 확인)
 * 2) close -> soft reset -> initialized false
 * 3) 트위터 갤러리 요소 유사 노드([data-testid="photoViewer"]) body에 추가
 * 4) MutationObserver 콜백이 reinforceEventPriority 호출 → initialized true 재상승 기대
 */
import { describe, it, expect } from 'vitest';
import { createGalleryTestHarness } from '../../utils/galleryTestHarness';
import { EventManager } from '@/shared/services/EventManager';
import { openGallery as openGallerySignal } from '@/shared/state/signals/gallery.signals';

function media(id) {
  // @ts-ignore
  return globalThis.__xegCreateImageMedia(id);
}

describe('Phase 11 GREEN: close 후 MutationObserver reinforce', () => {
  it('close 이후 갤러리 관련 노드 추가 시 initialized 가 true 로 재설정되어야 한다', async () => {
    const { app, eventManager } = await createGalleryTestHarness();

    openGallerySignal([media('m1')], 0);
    await new Promise(r => globalThis.setTimeout(r, 5));

    // close -> soft reset
    app.closeGallery();
    await new Promise(r => globalThis.setTimeout(r, 15));
    expect(eventManager.getGalleryStatus().initialized).toBe(false);

    // Mutation: Twitter 갤러리 요소 유사 div 추가
    const el = globalThis.document.createElement('div');
    el.setAttribute('data-testid', 'photoViewer');
    globalThis.document.body.appendChild(el);

    // MutationObserver 콜백 처리 대기
    await new Promise(r => globalThis.setTimeout(r, 25));

    expect(EventManager.getInstance().getGalleryStatus().initialized).toBe(true);
  });
});
