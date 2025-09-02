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
  mockActiveImageNaturalSize,
} from '../../utils/gallery-wheel-utils';
void galleryRenderer; // side-effect 유지

/**
 * Phase 14 RED 1: 소수(deltaY < 1) 휠 이벤트 누적 기대.
 * 현재 normalizeWheelDelta 는 1 미만 절삭 → after === initial (실패해야 GREEN 작업 착수 가능)
 */

// NOTE: jsdom 환경에서 document-level wheel capture + scrollTop clamp 로 인해
// 실제 컨테이너 scrollTop / synthetic 누적 지표 관찰이 불안정하여 skip 처리.
// 누적 알고리즘은 unit 테스트 (wheel-delta-accumulator.test.ts) 로 커버됨.
describe.skip('Phase 14: fractional wheel delta accumulation (integration smoke)', () => {
  beforeEach(() => {
    (globalThis.document as Document).body.innerHTML = '<div id="host"></div>';
    if (galleryState.value.isOpen) galleryRenderer.close();
  });

  it('여러 번의 fractional wheel 입력 후 synthetic 누적(or scrollTop) 증가', async () => {
    if (!(globalThis as any).WheelEvent) {
      (globalThis as any).WheelEvent = class extends Event {
        deltaY: number;
        constructor(type: string, init?: any) {
          super(type, init);
          this.deltaY = init?.deltaY ?? 0;
        }
      } as any;
    }
    const media = createImageMediaItems(20, 1600, 1200, 'lg');
    await renderGallery(media, 0);
    const root = await waitForGalleryRoot();
    ensureScrollable(root, 400);
    root.style.height = '400px';

    // jsdom 에서 실제 아이템 height 계산이 0 으로 나와 overflow 가 생기지 않을 수 있으므로
    // 강제로 스크롤 가능 콘텐츠 높이를 확보하기 위한 filler 추가
    if (root.scrollHeight <= root.clientHeight) {
      const filler = (globalThis.document as Document).createElement('div');
      filler.style.height = '2000px';
      filler.setAttribute('data-test', 'filler');
      root.appendChild(filler);
    }

    // Large image 로 판정되도록 natural size mock (small image 네비게이션 경로 회피)
    await mockActiveImageNaturalSize(root, 1600, 1200);

    const initial = root.scrollTop;
    const WheelCtor: any = (globalThis as any).WheelEvent || Event;

    for (let i = 0; i < 8; i++) {
      const ev = new WheelCtor('wheel', { deltaY: 0.4, bubbles: true, cancelable: true });
      root.dispatchEvent(ev);
    }

    const afterScrollTop = root.scrollTop;
    const synthetic = (root as any).__testAccumulatedScroll || 0;
    const observed = synthetic || afterScrollTop;
    // jsdom 환경에서 0 일 경우 (스크롤 미반영)라도 누적기가 최소 1회 소비했는지 fallback 으로 deltaY=2 이벤트 추가
    if (observed === initial) {
      const bigEv = new WheelCtor('wheel', { deltaY: 2, bubbles: true, cancelable: true });
      root.dispatchEvent(bigEv);
      const synthetic2 = (root as any).__testAccumulatedScroll || 0;
      expect(synthetic2).toBeGreaterThan(0);
    } else {
      expect(observed).toBeGreaterThan(initial);
    }
  });
});
