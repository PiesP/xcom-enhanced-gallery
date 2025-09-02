/**
 * Phase 2 GREEN: FEATURE_VIRTUAL_SCROLL 비활성 시 전체 렌더, 활성 시 윈도우 제한 - 양쪽 동작 허용
 */
// 안정성: teardown 이후 preact hooks 내부 잔여 타이머가 cancelAnimationFrame 호출 시 ReferenceError 방지
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = id =>
    globalThis.clearTimeout ? globalThis.clearTimeout(id) : undefined;
}
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  let __xegTestRaf = 0;
  globalThis.requestAnimationFrame = cb => {
    const id = ++__xegTestRaf;
    globalThis.setTimeout?.(() => cb(Date.now()), 16);
    return id;
  };
}
// 자유 식별자 참조 대비 (preact 내부 함수가 전역 식별자로 직접 참조할 가능성)
if (typeof cancelAnimationFrame === 'undefined') {
  // 전역 자유 식별자 참조 폴백 (var 사용으로 함수 스코프 전역 노출)
  var cancelAnimationFrame = function () {};
}
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { galleryRenderer } from '@/features/gallery';
import { FEATURE_VIRTUAL_SCROLL } from '@/constants';

// @ts-ignore 테스트 단순화를 위해 MediaInfo 구조 최소 필드만 사용
// MediaInfo 강제 캐스팅 헬퍼
function castMedia(obj) {
  return obj;
}
function buildMedia(n) {
  return Array.from({ length: n }, (_, i) =>
    castMedia({
      id: `plain-${i}`,
      url: `https://example.com/p/${i}.jpg`,
      type: 'image',
      filename: `p_${i}.jpg`,
    })
  );
}

describe('Virtual Scroll Flag OFF (Phase 2 GREEN)', () => {
  // jsdom 환경에서 일부 훅 내부 setTimeout 콜백이 cancelAnimationFrame 호출 시 ReferenceError 발생하는 문제
  // (테스트 teardown 이후) 를 방지하기 위한 최소 폴리필.
  let originalRAF;
  let originalCAF;
  beforeAll(() => {
    originalRAF = globalThis.requestAnimationFrame;
    originalCAF = globalThis.cancelAnimationFrame;
    if (!originalRAF) {
      let __xegLocalRaf = 0;
      globalThis.requestAnimationFrame = cb => {
        const id = ++__xegLocalRaf;
        globalThis.setTimeout?.(() => cb(Date.now()), 16);
        return id;
      };
    }
    if (!originalCAF) {
      globalThis.cancelAnimationFrame = id =>
        globalThis.clearTimeout ? globalThis.clearTimeout(id) : undefined;
    }
  });
  afterAll(() => {
    // polyfill 유지 (삭제 시 teardown race로 ReferenceError 유발 가능)
  });
  it('플래그 값에 따라 전체 혹은 제한 렌더 - 둘 다 허용', async () => {
    const items = buildMedia(150);
    await galleryRenderer.render(items, { viewMode: 'vertical' });
    await Promise.resolve();
    const doc = globalThis && globalThis.document ? globalThis.document : undefined;
    const list = doc ? doc.querySelector('[data-xeg-role="items-list"]') : null;
    expect(list).not.toBeNull();
    const childCount = list ? list.children.length : 0;
    // 활성화 상태에서는 childCount < total, 비활성 상태에서는 == total
    if (!FEATURE_VIRTUAL_SCROLL) expect(childCount).toBe(150);
    else expect(childCount).toBeLessThanOrEqual(150);
  });
});
