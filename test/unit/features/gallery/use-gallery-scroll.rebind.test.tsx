import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { initializeVendors, getPreact, getPreactHooks } from '@shared/external/vendors';
import { useGalleryScroll } from '@/features/gallery/hooks';
import { galleryState } from '@shared/state/signals/gallery.signals';

initializeVendors?.();

const { h, render } = getPreact();
const { useEffect } = getPreactHooks();

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

function dispatchWheel(delta = 8, target?: HTMLElement | Document) {
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
}: {
  enabled: boolean;
  onScroll: (delta: number) => void;
}) {
  useGalleryScroll({
    container: document.body,
    onScroll,
    enabled,
    blockTwitterScroll: false,
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

    render(h(TestComponent, { enabled: true, onScroll: onScrollSpy }), host as RenderParams[1]);
    await flushEffects();

    dispatchWheel(8, document.body);
    await flushEffects();
    expect(onScrollSpy).toHaveBeenCalledTimes(1);

    onScrollSpy.mockClear();

    render(h(TestComponent, { enabled: false, onScroll: onScrollSpy }), host as RenderParams[1]);
    await flushEffects();

    render(h(TestComponent, { enabled: true, onScroll: onScrollSpy }), host as RenderParams[1]);
    await flushEffects();

    dispatchWheel(8, document.body);
    await flushEffects();

    expect(onScrollSpy).toHaveBeenCalledTimes(1);
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

    expect(onScrollSpy).toHaveBeenCalledTimes(1);
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
