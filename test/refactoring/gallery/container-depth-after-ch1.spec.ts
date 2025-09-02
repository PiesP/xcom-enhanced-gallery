import { describe, it, expect, beforeAll } from 'vitest';
// EventManager 파괴 후 addEventListener 경고 소음 억제 (테스트 수명주기 특성상 다수 호출)
// 개별 테스트 파일 단위로 설정하여 다른 영역 디버깅 시 경고 유지
beforeAll(() => {
  (globalThis as any).__XEG_SILENCE_EVENT_MANAGER_WARN = true;
});
import { measureDepth } from '../../utils/dom/measureDepth';

async function openGalleryMock() {
  const { galleryRenderer } = await import('@features/gallery/GalleryRenderer');
  // 테스트 환경용 root 수동 생성 (GalleryApp.ensureGalleryContainer 로직 요약)
  let root = (globalThis as any).document.querySelector('#xeg-gallery-root') as HTMLElement | null;
  if (!root) {
    root = (globalThis as any).document.createElement('div');
    root.id = 'xeg-gallery-root';
    Object.assign(root.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      boxSizing: 'border-box',
      padding: '2rem',
      background: 'rgba(0,0,0,0.9)',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'scroll',
      pointerEvents: 'auto',
    });
    (globalThis as any).document.body.appendChild(root);
  }
  const media: any[] = [
    { id: 'm1', url: 'https://example.com/1.jpg', type: 'image', width: 100, height: 100 },
    { id: 'm2', url: 'https://example.com/2.jpg', type: 'image', width: 100, height: 100 },
  ];
  await galleryRenderer.render(media, { startIndex: 0 });
  // 렌더링 완료 대기
  const start = Date.now();
  while (Date.now() - start < 1500) {
    const gallery = (globalThis as any).document.querySelector('[data-xeg-role="gallery"]');
    const itemsList = (globalThis as any).document.querySelector('[data-xeg-role="items-list"]');
    if (gallery && itemsList) break;
    await new Promise(r => (globalThis as any).setTimeout(r, 16));
  }
}

// waitForSelector 제거 (CH2 구조 단순화로 직접 children 접근)

describe('CH1 GREEN: Renderer wrapper 제거 후 구조 검증', () => {
  beforeAll(async () => {
    await openGalleryMock();
  });

  it('중간 .xeg-gallery-renderer 가 제거되었다', () => {
    const renderer = (globalThis as any).document.querySelector('.xeg-gallery-renderer');
    expect(renderer).toBeNull();
  });

  it('#xeg-gallery-root 가 존재하고 overlay 스타일 핵심 속성 유지', () => {
    const root = (globalThis as any).document.querySelector(
      '#xeg-gallery-root'
    ) as HTMLElement | null;
    expect(root).toBeTruthy();
    if (!root) return;
    const style = root.style;
    expect(style.position).toBe('fixed');
    expect(style.top).toBe('0px');
    expect(style.background.includes('rgba')).toBe(true);
  });

  it('depth 는 CH1:5 또는 CH2 이후:4 (viewRoot+itemsList 통합) 허용', async () => {
    const root = (globalThis as any).document.querySelector('#xeg-gallery-root');
    expect(root).toBeTruthy();
    if (!root) return;
    const viewRoot = root.querySelector('[data-xeg-role="gallery"]');
    expect(viewRoot).toBeTruthy();
    if (!viewRoot) return;
    // CH2 이후 items-list 제거 → gallery 컨테이너 직접 children 탐색
    const gallery = viewRoot as HTMLElement; // viewRoot 자체가 gallery 역할
    // 아이템 대기
    let firstItem = gallery.firstElementChild as HTMLElement | null;
    const start = Date.now();
    while (!firstItem && Date.now() - start < 500) {
      await new Promise(r => (globalThis as any).setTimeout(r, 16));
      firstItem = gallery.firstElementChild as HTMLElement | null;
    }
    expect(firstItem).toBeTruthy();
    if (!firstItem) return;
    const depth = measureDepth((globalThis as any).document.body, firstItem);
    expect([4, 5]).toContain(depth);
  });
});
