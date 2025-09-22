import { describe, it, expect, beforeEach } from 'vitest';
import { GalleryRenderer } from '@/features/gallery/GalleryRenderer';
import { closeGallery } from '@/shared/state/signals/gallery.signals';

/**
 * P1-1: SPA 라우팅/마운트 아이덤포턴시
 * - History API를 사용한 경로 변경(pushState/replaceState/popstate) 중에도 단일 마운트 유지
 * - 컨테이너 분실 후(예: 라우팅에 따른 SPA DOM 교체) ≤250ms 내 자동 재마운트 보장
 */
describe('SPA routing idempotency and rebind robustness', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('pushState/replaceState/popstate 중복 마운트 없이 유지', async () => {
    const renderer = new GalleryRenderer();
    const media = [
      { id: '1', url: 'https://pbs.twimg.com/media/abc.jpg', type: 'image', filename: 'a.jpg' },
    ] as const;

    await renderer.render(media, { startIndex: 0, viewMode: 'vertical' });

    const count = () => document.querySelectorAll('.xeg-gallery-renderer').length;
    expect(count()).toBe(1);

    // 1) pushState
    (window as any).history.pushState({ page: 1 }, '', '/home');
    await new Promise(res => setTimeout(res, 20));
    expect(count()).toBe(1);

    // 2) replaceState
    (window as any).history.replaceState({ page: 2 }, '', '/home/feed');
    await new Promise(res => setTimeout(res, 20));
    expect(count()).toBe(1);

    // 3) popstate (뒤로 가기 시뮬레이션)
    window.dispatchEvent(new Event('popstate'));
    await new Promise(res => setTimeout(res, 20));
    expect(count()).toBe(1);

    // 정리
    closeGallery();
    renderer.destroy();
  });

  it('라우팅 도중 컨테이너 분실 시 자동 재마운트(≤250ms)', async () => {
    const renderer = new GalleryRenderer();
    const media = [
      { id: '1', url: 'https://pbs.twimg.com/media/abc.jpg', type: 'image', filename: 'a.jpg' },
    ] as const;

    await renderer.render(media, { startIndex: 0, viewMode: 'vertical' });
    const select = () => document.querySelector('.xeg-gallery-renderer');
    expect(select()).not.toBeNull();

    // 라우팅으로 인한 DOM 교체를 시뮬레이션: 먼저 컨테이너 제거
    select()?.remove();
    // 그 직후 route 변경(pushState)
    (window as any).history.pushState({ page: 3 }, '', '/explore');

    // 리바인드 지연(기본 150ms, ≤250ms 가드) 내 재마운트 확인
    await new Promise(res => setTimeout(res, 220));
    expect(select()).not.toBeNull();

    // 중복 마운트가 없는지 확인
    const count = () => document.querySelectorAll('.xeg-gallery-renderer').length;
    expect(count()).toBe(1);

    closeGallery();
    renderer.destroy();
  });
});
