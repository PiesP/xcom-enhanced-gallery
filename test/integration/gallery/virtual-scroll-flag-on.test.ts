/**
 * Phase 2 RED: FEATURE_VIRTUAL_SCROLL 활성화 시 실제 DOM 축소 기대 → 현재 스켈레톤은 미구현이라 실패
 * NOTE: 이 테스트는 초기에는 실패하도록 설계 (가상 스크롤 구현 전)
 */
import { describe, it, expect } from 'vitest';
export {};
// 동적 import 이전에 플래그 강제 설정
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__XEG_FORCE_FLAGS__ = { FEATURE_VIRTUAL_SCROLL: true };
});

async function getRendererAndFlag() {
  const mod = await import('@/features/gallery');
  const constants = await import('@/constants');
  return {
    galleryRenderer: (mod as any).galleryRenderer,
    FEATURE_VIRTUAL_SCROLL: (constants as any).FEATURE_VIRTUAL_SCROLL as boolean,
  };
}

// Guard: 플래그 강제 ON (테스트 환경에서 가정)
// 현재 constants는 env 기반이므로, 실패를 명확히 하기 위해 플래그 상태를 로깅만

function buildMedia(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `virt-${i}`,
    url: `https://example.com/m/${i}.jpg`,
    type: 'image',
    filename: `m_${i}.jpg`,
  }));
}

describe('Virtual Scroll Flag ON (Phase 2 RED)', () => {
  it('가상 스크롤 활성 시 전체 DOM 아이템이 줄어들어야 한다 (현재 구현은 줄어들지 않아 실패 예상)', async () => {
    const { galleryRenderer, FEATURE_VIRTUAL_SCROLL } = await getRendererAndFlag();
    const items = buildMedia(1000);
    await galleryRenderer.render(items, { viewMode: 'vertical' });
    await Promise.resolve();
    const list = document.querySelector('[data-xeg-role="items-list"]');
    expect(list).not.toBeNull();
    const childCount = list ? list.children.length : 0;

    // 기대: viewport 내 +- buffer (예: 50 미만) → 현재: 1000 → FAIL
    // RED 단계에서 의도적으로 실패하도록 엄격 단언
    expect(FEATURE_VIRTUAL_SCROLL).toBe(true);
    expect(childCount).toBeLessThan(80);
  });
});
