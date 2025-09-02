/*
 * 공용 갤러리 wheel 테스트 유틸
 * 중복되던 root polling / wheel 디스패치 / small image natural size mock / scroll 스타일 설정을 단일화.
 */
import { galleryRenderer } from '@/features/gallery/GalleryRenderer';
import { getPreact } from '@/shared/external/vendors';
void galleryRenderer; // side-effect 구독 보존

export interface WaitForGalleryRootOptions {
  selector?: string;
  attempts?: number;
  intervalMs?: number;
}

/** 갤러리 루트 요소를 polling 으로 대기 (없으면 Error throw). */
export async function waitForGalleryRoot(
  options: WaitForGalleryRootOptions = {}
): Promise<HTMLElement> {
  const { selector = '[data-xeg-role="gallery"]', attempts = 30, intervalMs = 10 } = options;
  for (let i = 0; i < attempts; i++) {
    const el = (globalThis.document as Document).querySelector(selector) as HTMLElement | null;
    if (el) return el;

    await new Promise(r => (globalThis.setTimeout as any)(r, intervalMs));
  }
  throw new Error(`Gallery root not found after ${attempts} attempts (selector=${selector})`);
}

/** wheel 이벤트 디스패치 (WheelEvent 없으면 일반 Event fallback). */
export function dispatchWheel(target: EventTarget, deltaY: number): void {
  const WheelCtor: any = (globalThis as any).WheelEvent || Event;
  const e = new WheelCtor('wheel', { deltaY, bubbles: true, cancelable: true });
  target.dispatchEvent(e);
}

/** root 컨테이너를 스크롤 가능하도록 강제 스타일 부여 (jsdom 레이아웃 한계 보완). */
export function ensureScrollable(root: HTMLElement, maxHeightPx = 420): void {
  root.style.maxHeight = `${maxHeightPx}px`;
  root.style.overflowY = 'auto';
}

/** 현재 활성(첫) 이미지 naturalWidth/Height 를 주입하고 load 이벤트를 트리거 (small image 모드 강제). */
export async function mockActiveImageNaturalSize(
  root: HTMLElement,
  width: number,
  height: number
): Promise<void> {
  const img = root.querySelector('img') as any;
  if (!img) return;
  try {
    const props: Array<[string, number]> = [
      ['naturalWidth', width],
      ['naturalHeight', height],
    ];
    for (const [k, v] of props) {
      if (Object.getOwnPropertyDescriptor(img, k)) {
        Object.defineProperty(img, k, { value: v });
      } else {
        Object.defineProperty(img, k, { value: v, configurable: true });
      }
    }
    img.dispatchEvent(new Event('load'));
    // effect flush 여유
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
  } catch {
    /* no-op */
  }
}

export interface MediaItemLike {
  id: string;
  url: string;
  filename: string;
  type: 'image';
  width: number;
  height: number;
}

/** 단순 이미지 media 배열 생성 헬퍼. */
export function createImageMediaItems(
  count: number,
  width: number,
  height: number,
  prefix = 'm'
): MediaItemLike[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${prefix}${i}`,
    url: `https://example.com/${prefix}${i}.jpg`,
    filename: `${prefix}${i}.jpg`,
    type: 'image' as const,
    width,
    height,
  }));
}

/** 갤러리 렌더 (galleryRenderer 래핑) */
export async function renderGallery(items: MediaItemLike[], startIndex = 0): Promise<void> {
  await galleryRenderer.render(items, { startIndex });
}

export const preactExports = getPreact();
