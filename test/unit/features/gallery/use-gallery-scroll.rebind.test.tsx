import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { initializeVendors } from '@shared/external/vendors';
import { getPreact, getPreactHooks } from '@test-utils/legacy-preact';
import { useGalleryScroll } from '@/features/gallery/hooks';
import { galleryState } from '@shared/state/signals/gallery.signals';

initializeVendors?.();

const { h, render } = getPreact();
const { useEffect, useState } = getPreactHooks();

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

function dispatchWheel(delta = 8, target?: HTMLElement | typeof document) {
  const wheelEvent = new globalThis.WheelEvent('wheel', {
    deltaY: delta,
    bubbles: true,
    cancelable: true,
  });
  const dispatchTarget = target ?? document.body;
  dispatchTarget.dispatchEvent(wheelEvent);
}

function TestComponent({
  enabled,
  onScroll,
  containerRef,
}: {
  enabled: boolean;
  onScroll: (delta: number) => void;
  containerRef?: { current: HTMLElement | null };
}) {
  const [localContainer, setLocalContainer] = useState<HTMLElement | null>(null);

  useGalleryScroll({
    container: containerRef?.current ?? localContainer,
    onScroll,
    enabled,
    blockTwitterScroll: true, // 배경 차단 활성화
    enableScrollDirection: false,
  });

  useEffect(() => {
    galleryState.value = { ...galleryState.value, isOpen: true };
    return () => {
      galleryState.value = { ...galleryState.value, isOpen: false };
    };
  }, []);

  return h('div', { ref: setLocalContainer });
}

describe('useGalleryScroll — EventManager rebind', () => {
  let host: Element | null = null;
  let onScrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onScrollSpy = vi.fn();
    host = document.createElement('div');
    document.body.appendChild(host);
    galleryState.value = { ...galleryState.value, isOpen: true };
  });

  afterEach(() => {
    if (host) {
      render(null as unknown as RenderParams[0], host as RenderParams[1]);
      host.remove();
      host = null;
    }
    galleryState.value = { ...galleryState.value, isOpen: false };
  });

  it('re-registers wheel listeners after cleanup when re-enabled', async () => {
    if (!host) {
      throw new Error('host container missing');
    }

    // 갤러리 컨테이너를 별도로 생성 (document.body는 배경)
    const galleryContainer = document.createElement('div');
    document.body.appendChild(galleryContainer);
    const containerRef = { current: galleryContainer };

    render(
      h(TestComponent, { enabled: true, onScroll: onScrollSpy, containerRef }),
      host as RenderParams[1]
    );
    await flushEffects();

    // useGalleryScroll은 이제 배경 차단 전용이므로 onScroll이 호출되지 않음
    // document.body(배경)로 이벤트 디스패치 시 preventDefault 검증
    const wheelEvent1 = new globalThis.WheelEvent('wheel', {
      deltaY: 8,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(wheelEvent1);
    await flushEffects();
    expect(wheelEvent1.defaultPrevented).toBe(true);

    onScrollSpy.mockClear();

    render(
      h(TestComponent, { enabled: false, onScroll: onScrollSpy, containerRef }),
      host as RenderParams[1]
    );
    await flushEffects();

    render(
      h(TestComponent, { enabled: true, onScroll: onScrollSpy, containerRef }),
      host as RenderParams[1]
    );
    await flushEffects();

    const wheelEvent2 = new globalThis.WheelEvent('wheel', {
      deltaY: 8,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(wheelEvent2);
    await flushEffects();

    expect(wheelEvent2.defaultPrevented).toBe(true);

    galleryContainer.remove();
  });
});

function WheelPolicyTestComponent({
  container,
  onScroll,
  blockTwitterScroll = true,
}: {
  container: HTMLElement | null;
  onScroll: (delta: number) => void;
  blockTwitterScroll?: boolean;
}) {
  useGalleryScroll({
    container,
    onScroll,
    enabled: true,
    blockTwitterScroll,
    enableScrollDirection: false,
  });

  useEffect(() => {
    galleryState.value = { ...galleryState.value, isOpen: true };
    return () => {
      galleryState.value = { ...galleryState.value, isOpen: false };
    };
  }, []);

  return h('div', {});
}

describe('useGalleryScroll — wheel preventDefault policy', () => {
  let host: Element | null = null;
  let container: HTMLElement | null = null;
  let onScrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onScrollSpy = vi.fn();
    host = document.createElement('div');
    container = document.createElement('div');
    container.setAttribute('data-xeg-role', 'items-container');
    container.style.overflow = 'auto';
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
  });

  it('allows wheel default behaviour for events originating inside gallery container', async () => {
    if (!host || !container) {
      throw new Error('test setup failed');
    }

    render(
      h(WheelPolicyTestComponent, {
        container,
        onScroll: onScrollSpy,
        blockTwitterScroll: true,
      }),
      host as RenderParams[1]
    );

    await flushEffects();

    const child = document.createElement('div');
    container.appendChild(child);

    const wheelEvent = new globalThis.WheelEvent('wheel', {
      deltaY: 12,
      bubbles: true,
      cancelable: true,
    });

    child.dispatchEvent(wheelEvent);
    await flushEffects();

    // useGalleryScroll은 이제 배경 차단 전용이므로 갤러리 내부 이벤트에서 onScroll 호출 안 함
    expect(onScrollSpy).not.toHaveBeenCalled();
    expect(wheelEvent.defaultPrevented).toBe(false);
  });

  it('still blocks wheel default behaviour for events outside the gallery container', async () => {
    if (!host || !container) {
      throw new Error('test setup failed');
    }

    render(
      h(WheelPolicyTestComponent, {
        container,
        onScroll: onScrollSpy,
        blockTwitterScroll: true,
      }),
      host as RenderParams[1]
    );

    await flushEffects();

    const wheelEvent = new globalThis.WheelEvent('wheel', {
      deltaY: 12,
      bubbles: true,
      cancelable: true,
    });

    document.body.dispatchEvent(wheelEvent);
    await flushEffects();

    expect(onScrollSpy).not.toHaveBeenCalled();
    expect(wheelEvent.defaultPrevented).toBe(true);
  });
});
