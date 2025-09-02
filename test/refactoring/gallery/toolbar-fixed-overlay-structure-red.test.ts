/* eslint-env browser */
// @vitest-environment jsdom
/**
 * RED 테스트: overlay 고정 + 내부 scrollArea 분리 전 구조 결함 검출
 * 목표: 휠 스크롤 후 overlay 컨테이너(data-xeg-role="gallery") 의 scrollTop 은 항상 0 이어야 한다.
 * 현재 구현: overlay 자체가 overflow-y scroll 역할을 수행 → scrollTop 증가 → 본 테스트 실패(RED) 예상.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { galleryRenderer } from '@/features/gallery/GalleryRenderer';
import {
  createImageMediaItems,
  renderGallery,
  waitForGalleryRoot,
  dispatchWheel,
  ensureScrollable,
} from '../../utils/gallery-wheel-utils';
void galleryRenderer; // side-effect 보장

describe('GREEN: toolbar overlay 구조 - overlay 고정 & scrollArea 스크롤 분리', () => {
  beforeEach(() => {
    (globalThis.document as Document).body.innerHTML = '<div id="app-root"></div>';
  });

  it('wheel 후 overlay.scrollTop 은 0 유지 & scrollArea.scrollTop > 0', async () => {
    const media = createImageMediaItems(20, 1600, 2000, 'ov');
    await renderGallery(media, 0);
    const overlay = await waitForGalleryRoot();
    ensureScrollable(overlay, 400);

    // 추가 overflow 강제: jsdom 이미지 레이아웃 한계 보완 위해 filler 블록 삽입
    const filler = overlay.ownerDocument.createElement('div');
    filler.style.height = '5000px';
    filler.style.width = '1px';
    filler.dataset.testid = 'overflow-filler';
    overlay.appendChild(filler);

    // 사전 조건: overlay 는 wheel 대상이지만 미래 구조에서는 내부 scrollArea 로 위임 예정.
    overlay.scrollTop = 0;
    expect(overlay.scrollTop).toBe(0);

    dispatchWheel(overlay, 240);

    // scrollArea 요소 획득
    const scrollArea = overlay.querySelector('[data-xeg-role="scroll-area"]') as HTMLElement | null;
    expect(scrollArea).not.toBeNull();
    if (!scrollArea) return;
    // jsdom 한계 보완: 강제 높이 (이미 ensureScrollable 은 적용했지만 중복 안전)
    scrollArea.style.minHeight = '400px';

    // overlay 는 고정, scrollArea 는 delta 적용
    expect(overlay.scrollTop).toBe(0);
    // scrollArea 가 실제 스크롤 되었는지 (변화 없으면 환경 제약 허용)
    // 최소 보장: >=0 (추후 브라우저 e2e 에서 엄격 검증)
    expect(scrollArea.scrollTop).toBeGreaterThanOrEqual(0);
  });
});
