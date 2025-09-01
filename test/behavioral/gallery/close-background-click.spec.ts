/**
 * Phase 1 Behavioral Test: 배경 클릭으로 갤러리 닫힘 동작
 * - 목적: 컨테이너 계층 단순화 리팩터링(Phase3) 시 회귀 방지
 */
import { describe, it, expect } from 'vitest';
// 모듈로 강제 전환하여 전역 선언 파싱 문제 방지
export {};
import { galleryRenderer } from '@/features/gallery';
import { galleryState } from '@shared/state/signals/gallery.signals';

// (JSDOM DOM 라이브러리 타입이 tsconfig lib에 포함되어 있으므로 별도 declare 불필요)

import type { MediaInfo } from '@shared/types/media.types';

function createMedia(count = 3): MediaInfo[] {
  return Array.from(
    { length: count },
    (_, i) =>
      ({
        id: `b-${i}`,
        url: `https://example.com/img/${i}.jpg`,
        type: 'image',
        filename: `img_${i}.jpg`,
      }) satisfies MediaInfo
  );
}

describe('Gallery Background Close (Phase 1)', () => {
  it('배경(아이템 외 영역) 클릭 시 갤러리가 닫힌다', async () => {
    const media = createMedia(5);
    await galleryRenderer.render(media, { viewMode: 'vertical' });
    await Promise.resolve();

    const background = (globalThis as unknown as { document?: Document }).document?.querySelector(
      '[data-xeg-gallery="true"]'
    );
    expect(background).not.toBeNull();
    if (!background) return; // TS narrowing

    // 클릭 이벤트 (target === currentTarget) 보장 위해 직접 dispatch
    const Ev = (globalThis as unknown as { MouseEvent?: typeof MouseEvent }).MouseEvent;
    const event = Ev
      ? new Ev('click', {
          bubbles: true,
          cancelable: true,
        })
      : ({ type: 'click', bubbles: true } as unknown as MouseEvent);
    Object.defineProperty(event, 'target', { value: background });
    background.dispatchEvent(event);

    await Promise.resolve();
    expect(galleryState.value.isOpen).toBe(false);
  });
});
