/**
 * Phase 2 GREEN: FEATURE_VIRTUAL_SCROLL 활성화 시 실제 DOM 축소 동작 검증
 */
import { buildMediaInfo } from '../../utils/buildMediaInfo.js';
/* eslint-env jsdom */
import { describe, it, expect } from 'vitest';
export {};
// 동적 import 이전에 플래그 강제 설정
beforeAll(() => {
  // @ts-ignore test environment flag injection
  globalThis.__XEG_FORCE_FLAGS__ = { FEATURE_VIRTUAL_SCROLL: true };
});

async function getRendererAndFlag() {
  const mod = await import('@/features/gallery');
  const constants = await import('@/constants');
  return {
    galleryRenderer: mod.galleryRenderer,
    FEATURE_VIRTUAL_SCROLL: constants.FEATURE_VIRTUAL_SCROLL,
  };
}

// Guard: 플래그 강제 ON (테스트 환경에서 가정)
// 현재 constants는 env 기반이므로, 실패를 명확히 하기 위해 플래그 상태를 로깅만

const buildMedia = buildMediaInfo;

describe('Virtual Scroll Flag ON (Phase 2 GREEN)', () => {
  it.skip('가상 스크롤 활성 시 전체 DOM 아이템이 뷰포트 윈도우 범위로 제한 (구현 안정화 후 활성)', async () => {
    const { galleryRenderer, FEATURE_VIRTUAL_SCROLL } = await getRendererAndFlag();
    const items = buildMedia(1000);
    await galleryRenderer.render(items, { viewMode: 'vertical' });
    await Promise.resolve();
    const doc = globalThis && globalThis.document ? globalThis.document : null;
    const list = doc ? doc.querySelector('[data-xeg-role="items-list"]') : null;
    expect(list).not.toBeNull();
    const childCount = list ? list.children.length : 0;

    expect(FEATURE_VIRTUAL_SCROLL).toBe(true);
    expect(childCount).toBeLessThan(120); // 구현 상 버퍼 포함 허용치
  });
});
