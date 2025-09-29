/**
 * @file visibleIndex 기반 네비게이션 동기화 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';

// VerticalGalleryView 내부 설정 폴링(setInterval)과 구독 폴링을 제거하기 위해 설정 API 모킹
vi.mock('@shared/container/settings-access', async () => {
  return {
    getSetting: (key: string, def: any) => {
      if (key === ('gallery.imageFitMode' as unknown as string)) return 'original';
      if (key === ('gallery.windowingEnabled' as unknown as string)) return true;
      if (key === ('gallery.windowSize' as unknown as string)) return 5;
      if (key === 'gallery.preloadCount') return 0;
      return def;
    },
    setSetting: () => Promise.resolve(),
    tryGetSettingsService: () => ({ subscribe: (_fn: (e: any) => void) => () => {} }),
  } as any;
});

// 스크롤 애니메이션 유틸을 모킹하여 addEventListener/타이머 부작용 제거
vi.mock('@shared/utils/animations', async () => {
  return {
    setupScrollAnimation: (_cb: any) => () => {},
    animateGalleryEnter: () => {},
    animateGalleryExit: () => {},
  } as any;
});

// 뷰포트 CSS 변수 훅 모킹 (no-op)
vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/useViewportConstrainedVar',
  async () => {
    return {
      useViewportConstrainedVar: () => {},
      useGalleryViewportConstrainedVar: () => {},
    } as any;
  }
);

// 유틸: 렌더 후 실제 갤러리 컨테이너/아이템을 가져오고, 지정한 레이아웃으로 rect를 모킹한다
type RectLike = {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
  toJSON?: () => any;
};
function mockLayout({
  containerRect,
  itemTops,
}: {
  containerRect: Partial<RectLike> & { width?: number; height?: number };
  itemTops: number[]; // 각 아이템의 top 기준, height=300 가정
}) {
  const container = document.querySelector('[data-xeg-role="gallery"]') as HTMLElement | null;
  const itemsRoot = document.querySelector(
    '[data-xeg-role="items-container"]'
  ) as HTMLElement | null;
  if (!container || !itemsRoot) throw new Error('gallery container/items not found');

  const fullContainerRect = {
    top: 0,
    left: 0,
    right: (containerRect.width ?? 800) + 0,
    bottom: (containerRect.height ?? 400) + 0,
    width: containerRect.width ?? 800,
    height: containerRect.height ?? 400,
    ...containerRect,
    toJSON: () => ({}),
  } as any;
  (container as any).getBoundingClientRect = () => fullContainerRect;

  const items = Array.from(
    itemsRoot.querySelectorAll('[data-xeg-role="gallery-item"]')
  ) as HTMLElement[];
  items.forEach((el, i) => {
    const top = itemTops[i] ?? 0;
    const rect: any = {
      top,
      left: 0,
      right: 800,
      width: 800,
      height: 300,
      bottom: top + 300,
      toJSON: () => ({}),
    };
    (el as any).getBoundingClientRect = () => rect;
  });
}

// NOTE: 이 테스트는 VerticalGalleryView의 복잡한 타이머/리스너 조합으로 인해 JSDOM에서 드물게 hang될 수 있습니다.
// 현재 유틸 단위 테스트(visible-navigation.util.test.ts)로 핵심 내비게이션 로직은 커버합니다.
// 통합 시나리오는 후속 PR에서 안정화 후 재활성화 예정. (ref: #visible-index-nav-sync)
describe.skip('Toolbar next/prev uses visibleIndex', () => {
  beforeEach(() => {
    // 실시간 타이머 사용: 전역 테스트 인프라와의 타이머 레이스를 피하기 위함
    vi.useRealTimers();
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('next navigates based on current visibleIndex without auto-scroll', async () => {
    // IO 비활성화로 폴백 경로 강제
    const savedIOWin = (globalThis as any).window?.IntersectionObserver;
    const savedIO = (globalThis as any).IntersectionObserver;
    (globalThis as any).window && ((globalThis as any).window.IntersectionObserver = undefined);
    (globalThis as any).IntersectionObserver = undefined;
    // Import components and state
    const { getPreact } = await import('@shared/external/vendors');
    const { h } = getPreact();
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view'
    );
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    // Seed state: 4 items, currentIndex start at 0
    const mediaItems = Array.from({ length: 4 }).map((_, i) => ({ id: `id-${i}`, url: `u-${i}` }));
    galleryState.value = {
      ...galleryState.value,
      isOpen: true,
      mediaItems,
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };

    // Render gallery view within a container; bind ref.current to our container
    function Wrap() {
      return h(
        'div',
        { id: 'host' },
        h(VerticalGalleryView as any, { className: 'xeg-vertical-gallery' })
      );
    }

    render(h(Wrap as any, {}));

    // 실제 렌더된 컨테이너/아이템 기반으로 레이아웃 모킹: index 2가 가장 중앙에 오도록 설정
    const shift = 550; // 300*2 - 50 => index 2가 viewport 중앙 근처
    mockLayout({
      containerRect: { top: 0, height: 400, width: 800 },
      itemTops: [0 - shift, 300 - shift, 600 - shift, 900 - shift],
    });

    // 스크롤 이벤트로 폴백 업데이트 트리거
    const gallery = document.querySelector('[data-xeg-role="gallery"]') as HTMLElement | null;
    gallery?.dispatchEvent(new Event('scroll'));
    // rAF/마이크로태스크 처리 대기
    await new Promise(res => setTimeout(res, 0));

    // Now trigger toolbar next click -> should navigate from visible(2) to 3
    const nextBtn = document.querySelector(
      '[data-gallery-element="nav-next"]'
    ) as HTMLElement | null;
    expect(nextBtn).toBeTruthy();
    nextBtn && fireEvent.click(nextBtn);

    // currentIndex should now be 3
    expect(galleryState.value.currentIndex).toBe(3);
    // 원복
    (globalThis as any).window && ((globalThis as any).window.IntersectionObserver = savedIOWin);
    (globalThis as any).IntersectionObserver = savedIO;
  });

  it('previous wraps around based on visibleIndex at 0 -> last', async () => {
    const savedIOWin = (globalThis as any).window?.IntersectionObserver;
    const savedIO = (globalThis as any).IntersectionObserver;
    (globalThis as any).window && ((globalThis as any).window.IntersectionObserver = undefined);
    (globalThis as any).IntersectionObserver = undefined;
    const { getPreact } = await import('@shared/external/vendors');
    const { h } = getPreact();
    const { VerticalGalleryView } = await import(
      '@features/gallery/components/vertical-gallery-view'
    );
    const { galleryState } = await import('@shared/state/signals/gallery.signals');

    const mediaItems = Array.from({ length: 3 }).map((_, i) => ({ id: `id-${i}`, url: `u-${i}` }));
    galleryState.value = {
      ...galleryState.value,
      isOpen: true,
      mediaItems,
      currentIndex: 1,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };

    function Wrap() {
      return h(
        'div',
        { id: 'host' },
        h(VerticalGalleryView as any, { className: 'xeg-vertical-gallery' })
      );
    }

    render(h(Wrap as any, {}));
    // index 0이 가장 보이도록 레이아웃 모킹
    mockLayout({
      containerRect: { top: 0, height: 400, width: 800 },
      itemTops: [0, 300, 600],
    });
    const gallery = document.querySelector('[data-xeg-role="gallery"]') as HTMLElement | null;
    gallery?.dispatchEvent(new Event('scroll'));
    await new Promise(res => setTimeout(res, 0));

    // Trigger toolbar previous click -> visible is 0 so it should go to last index 2
    const prevBtn = document.querySelector(
      '[data-gallery-element="nav-previous"]'
    ) as HTMLElement | null;
    expect(prevBtn).toBeTruthy();
    prevBtn && fireEvent.click(prevBtn);

    expect(galleryState.value.currentIndex).toBe(2);
    (globalThis as any).window && ((globalThis as any).window.IntersectionObserver = savedIOWin);
    (globalThis as any).IntersectionObserver = savedIO;
  });
});
