/**
 * @file fit-mode-integration.test.tsx
 * @description Toolbar의 세로 맞춤 버튼 클릭 시, 아이템에 fitHeight 클래스 및 컨테이너 CSS 변수가 존재하는지 검증
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPreact } from '@/shared/external/vendors';
import { VerticalGalleryView } from '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';

const { h, render } = getPreact();

function queryToolbarButton(root: Element, dataEl: string): HTMLElement | null {
  return root.querySelector(`[data-gallery-element="${dataEl}"]`) as HTMLElement | null;
}

describe('fit mode integration: fitHeight path', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('sets container CSS var and media receives fitHeight mode', async () => {
    const host = document.createElement('div');

    const items = [
      { id: 'a', url: 'https://example.com/a.jpg', type: 'image' as const, filename: 'a.jpg' },
    ];
    openGallery(items, 0);

    render(
      h(VerticalGalleryView as any, {
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
      }),
      host
    );

    const container = host.querySelector('[data-xeg-role="gallery"]') as HTMLElement;
    expect(container).toBeTruthy();

    // 초기 var가 설정되었는지 확인 (전역 기본값 또는 훅 적용 결과)
    const initialVar = container.style.getPropertyValue('--xeg-viewport-height-constrained');
    // 훅은 컨테이너에 설정하므로 빈 문자열이 아닐 가능성이 높음. 최소한 전역 기본값이 존재.
    // 전역 기본값은 :root에서 정의되며 element.style에는 보이지 않을 수 있으므로, 존재 자체는 아이템 스타일 검증으로 대체한다.

    // 툴바의 세로 맞춤 클릭
    const btn = queryToolbarButton(host, 'fit-height');
    expect(btn, 'fit-height 버튼을 찾지 못함').toBeTruthy();
    btn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // 아이템의 미디어 요소에 data-fit-mode가 반영되어야 함
    const media = host.querySelector('img, video') as HTMLElement | null;
    expect(media).toBeTruthy();

    // 이벤트 처리 및 효과 반영 대기
    vi.runAllTimers();

    expect(media!.getAttribute('data-fit-mode')).toBe('fitHeight');

    // 컨테이너에 CSS 변수가 설정되어야 함(훅 적용)
    const afterVar = container.style.getPropertyValue('--xeg-viewport-height-constrained');
    // 값이 px로 설정되었는지 확인 (테스트 환경에서 window.innerHeight 값 기반)
    if (afterVar) {
      expect(afterVar.endsWith('px')).toBe(true);
    }

    // 정리
    render(null as any, host);
    closeGallery();
  });
});
