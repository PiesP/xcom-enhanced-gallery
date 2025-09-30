/**
 * RED Test: 갤러리 내부 네이티브 스크롤 테스트
 *
 * 목적: 갤러리 컨테이너 내부에서 휠 이벤트 발생 시
 * 1. 네이티브 스크롤이 작동해야 함
 * 2. 이미지 네비게이션(onNext/onPrevious)이 호출되지 않아야 함
 * 3. 배경(Twitter) 스크롤은 여전히 차단되어야 함
 */

import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import { initializeVendors } from '@shared/external/vendors';
import { getPreact } from '@test-utils/legacy-preact';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { useGalleryScroll } from '@/features/gallery/hooks';
import { getSolidCore } from '@shared/external/vendors';

initializeVendors?.();

const { h, render } = getPreact();

type RenderParams = Parameters<typeof render>;

async function flushEffects() {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
  if (typeof requestAnimationFrame === 'function') {
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => resolve());
    });
  }
  await new Promise(resolve => setTimeout(resolve, 0));
}

function GalleryScrollTestComponent({
  container,
  onNext,
  onPrevious,
}: {
  container: HTMLElement | null;
  onNext: () => void;
  onPrevious: () => void;
}) {
  // 현재 구현과 동일한 패턴으로 useGalleryScroll 사용
  useGalleryScroll({
    container: () => container,
    onScroll: delta => {
      if (delta > 0) {
        onNext();
      } else if (delta < 0) {
        onPrevious();
      }
    },
    enabled: () => galleryState.value.isOpen,
    blockTwitterScroll: true,
  });

  const { onCleanup } = getSolidCore();

  onCleanup(() => {
    // cleanup
  });

  return h('div', {}, 'Gallery Scroll Test');
}

describe('Gallery Native Scroll (RED)', () => {
  let host: Element | null = null;
  let container: HTMLElement | null = null;
  let onNextSpy: ReturnType<typeof vi.fn>;
  let onPreviousSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNextSpy = vi.fn();
    onPreviousSpy = vi.fn();
    host = document.createElement('div');
    container = document.createElement('div');
    container.setAttribute('data-xeg-role', 'items-container');
    container.style.overflow = 'auto';
    container.style.height = '500px';
    document.body.appendChild(host);
    document.body.appendChild(container);
    galleryState.value = { ...galleryState.value, isOpen: true };
  });

  afterEach(() => {
    if (host) {
      render(null as unknown as RenderParams[0], host as RenderParams[1]);
      host.remove();
      host = null;
    }
    if (container) {
      container.remove();
      container = null;
    }
    galleryState.value = { ...galleryState.value, isOpen: false };
    onNextSpy.mockRestore();
    onPreviousSpy.mockRestore();
  });

  it('should allow native scroll inside gallery container without triggering navigation', async () => {
    if (!host || !container) {
      throw new Error('test setup failed');
    }

    render(
      h(GalleryScrollTestComponent, {
        container,
        onNext: onNextSpy,
        onPrevious: onPreviousSpy,
      }),
      host as RenderParams[1]
    );

    await flushEffects();

    // 컨테이너 내부에 스크롤 가능한 콘텐츠 추가
    const child = document.createElement('div');
    child.style.height = '2000px';
    container.appendChild(child);

    const initialScrollTop = container.scrollTop;

    // 갤러리 컨테이너 내부에서 휠 다운 이벤트
    const wheelDownEvent = new globalThis.WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });

    child.dispatchEvent(wheelDownEvent);
    await flushEffects();

    // RED: 현재는 onNext가 호출되어 버림
    // 기대: 네이티브 스크롤만 발생하고 네비게이션은 호출되지 않아야 함
    expect(onNextSpy).not.toHaveBeenCalled();
    expect(onPreviousSpy).not.toHaveBeenCalled();

    // 네이티브 스크롤은 허용되어야 함 (preventDefault되지 않음)
    expect(wheelDownEvent.defaultPrevented).toBe(false);

    // 실제 스크롤이 발생할 수 있어야 함 (브라우저의 기본 동작)
    // JSDOM에서는 실제 스크롤이 시뮬레이션되지 않으므로 preventDefault 여부만 확인
  });

  it('should block background scroll for events outside gallery container', async () => {
    if (!host || !container) {
      throw new Error('test setup failed');
    }

    render(
      h(GalleryScrollTestComponent, {
        container,
        onNext: onNextSpy,
        onPrevious: onPreviousSpy,
      }),
      host as RenderParams[1]
    );

    await flushEffects();

    // 배경(document.body)에서 휠 이벤트
    const wheelEvent = new globalThis.WheelEvent('wheel', {
      deltaY: 50,
      bubbles: true,
      cancelable: true,
    });

    document.body.dispatchEvent(wheelEvent);
    await flushEffects();

    // 배경 이벤트는 차단되어야 함
    expect(wheelEvent.defaultPrevented).toBe(true);

    // useGalleryScroll은 이제 배경 차단 전용이므로 onScroll 콜백을 호출하지 않음
    // 따라서 네비게이션도 호출되지 않아야 함
    expect(onNextSpy).not.toHaveBeenCalled();
    expect(onPreviousSpy).not.toHaveBeenCalled();
  });

  it('should handle wheel up events without triggering onPrevious', async () => {
    if (!host || !container) {
      throw new Error('test setup failed');
    }

    render(
      h(GalleryScrollTestComponent, {
        container,
        onNext: onNextSpy,
        onPrevious: onPreviousSpy,
      }),
      host as RenderParams[1]
    );

    await flushEffects();

    const child = document.createElement('div');
    child.style.height = '2000px';
    container.appendChild(child);

    // 갤러리 컨테이너 내부에서 휠 업 이벤트
    const wheelUpEvent = new globalThis.WheelEvent('wheel', {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });

    child.dispatchEvent(wheelUpEvent);
    await flushEffects();

    // RED: 현재는 onPrevious가 호출되어 버림
    // 기대: 네이티브 스크롤만 발생하고 네비게이션은 호출되지 않아야 함
    expect(onPreviousSpy).not.toHaveBeenCalled();
    expect(onNextSpy).not.toHaveBeenCalled();

    expect(wheelUpEvent.defaultPrevented).toBe(false);
  });
});
