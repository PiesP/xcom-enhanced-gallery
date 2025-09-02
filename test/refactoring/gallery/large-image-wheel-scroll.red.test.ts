/* eslint-env browser */
// @vitest-environment jsdom
// jsdom 환경 전역 setTimeout 사용 (타입은 lib dom 내장)
import { beforeEach, describe, expect, it } from 'vitest';
// NOTE: Neutralized legacy RED test (kept for historical trace). Marked skipped.
import { getPreact, getPreactHooks, getPreactSignals } from '@/shared/external/vendors';
import { openGallery } from '@/shared/state/signals/gallery.signals';
import { galleryState } from '@/shared/state/signals/gallery.signals';

/**
 * Phase 9.4 RED 테스트
 * 현재 구현에서는 문서 capture wheel 핸들러가 모든 wheel 이벤트를 preventDefault 하여
 * 갤러리 컨테이너 자체 scrollTop 이 증가하지 않는다.
 * 목표(GREEN): 큰 이미지/다중 아이템 목록에서는 container.scrollBy 로 실제 스크롤 발생.
 */

describe.skip('Phase 9.4 RED (neutralized): large image wheel scroll not applied', () => {
  const { render, h } = getPreact();
  const { useEffect } = getPreactHooks();
  getPreactSignals(); // signals 초기화 (직접 사용 없음)

  beforeEach(() => {
    // jsdom 환경 전제
    (globalThis.document as Document).body.innerHTML = '<div id="app-root"></div>';
  });

  function MountGallery() {
    // 갤러리 열기 (다수 아이템)
    useEffect(() => {
      if (galleryState.value.mediaItems.length === 0) {
        const media = Array.from({ length: 30 }).map((_, i) => ({
          id: `m${i}`,
          url: `https://example.com/img${i}.jpg`,
          filename: `img${i}.jpg`,
          type: 'image' as const,
          width: 1600,
          height: 1200,
        }));
        openGallery(media, 0);
      }
    }, []);
    return null;
  }

  it('[RED] wheel 이벤트 후 컨테이너 scrollTop 이 증가하지 않는다 (향후 GREEN 에서 증가해야 함)', async () => {
    render(h(MountGallery, {}), (globalThis.document as Document).getElementById('app-root')!);

    // 갤러리 루트 컨테이너 탐색 (VerticalGalleryView 의 fixed root)
    await new Promise(r => (globalThis.setTimeout as any)(r, 10));
    const root = (globalThis.document as Document).querySelector(
      '[data-xeg-role="gallery"]'
    ) as HTMLElement | null;
    expect(root).toBeTruthy();
    if (!root) return;

    // 스크롤 가능하도록 강제 높이 설정 (jsdom layout 제한 보완)
    root.style.maxHeight = '400px';
    root.style.overflowY = 'auto';

    const initial = root.scrollTop;

    const WheelCtor: any = (globalThis as any).WheelEvent || Event;
    const e = new WheelCtor('wheel', { deltaY: 200, bubbles: true, cancelable: true });
    root.dispatchEvent(e);

    // 현재 구현에서는 document capture handler 가 preventDefault 후 scrollBy 미호출 → 변화 0 기대 (RED 조건)
    const after = root.scrollTop;
    expect(after).toBe(initial); // GREEN 단계에서는 after > initial 로 기대가 변경될 것
  });
});
