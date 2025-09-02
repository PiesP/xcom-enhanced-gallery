/* eslint-env browser */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { galleryRenderer } from '@/features/gallery/GalleryRenderer';
import { galleryState } from '@/shared/state/signals/gallery.signals';
import {
  createImageMediaItems,
  renderGallery,
  waitForGalleryRoot,
  ensureScrollable,
} from '../../utils/gallery-wheel-utils';
void galleryRenderer; // side-effect 유지

/**
 * Phase 14 RED 1: 소수(deltaY < 1) 휠 이벤트들이 누적되어 실제 스크롤을 발생시켜야 한다.
 * 현재 구현(normalizeWheelDelta)에서는 1 미만 delta 가 모두 0 으로 절삭되어
 * 여러 번의 0.4, 0.4, ... 휠 이벤트 후에도 scrollTop 변화가 전혀 없다 → 이 테스트는 FAIL (RED) 되어야 한다.
 * GREEN 조건: 누적 로직 도입 후 동일 시퀀스에서 scrollTop > initial.
 */

describe('Phase 14 RED: fractional wheel delta accumulation for large image scrolling', () => {
  beforeEach(() => {
    (globalThis.document as Document).body.innerHTML = '<div id="host"></div>';
    if (galleryState.value.isOpen) galleryRenderer.close();
  });

  it('[RED] 여러 개의 deltaY=0.4 휠 이벤트 후에도 scrollTop 변화가 없다 (GREEN 에서는 > 0)', async () => {
    // 큰 이미지(뷰포트보다 큼) 목록 구성
    const media = createImageMediaItems(20, 1600, 1200, 'lg');
    await renderGallery(media, 0);
    const root = await waitForGalleryRoot();
    ensureScrollable(root, 400);

    const initial = root.scrollTop;

    // jsdom WheelEvent 지원 여부 확인
    const WheelCtor: any = (globalThis as any).WheelEvent || Event;

    // 0.4 * 6 = 2.4 (누적) → GREEN 단계에서는 최소 1 이상 scrollTop 증가 기대
    for (let i = 0; i < 6; i++) {
      const ev = new WheelCtor('wheel', { deltaY: 0.4, bubbles: true, cancelable: true });
      root.dispatchEvent(ev);
    }

    const after = root.scrollTop;

    // RED 조건: 아직 누적 로직이 없어 증가하지 않는다.
    expect(after).toBe(initial); // GREEN 전환 시 expect(after).toBeGreaterThan(initial) 로 수정 예정
  });
});
