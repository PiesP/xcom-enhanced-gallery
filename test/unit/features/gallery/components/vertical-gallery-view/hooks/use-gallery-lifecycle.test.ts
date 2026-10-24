import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('solid-js', async () => vi.importActual('solid-js/dist/solid.js'));

vi.mock('@shared/dom/viewport', () => ({
  observeViewportCssVars: vi.fn(() => vi.fn()),
}));

vi.mock('@shared/utils/css/css-animations', () => ({
  animateGalleryEnter: vi.fn(async () => undefined),
  animateGalleryExit: vi.fn(async () => undefined),
}));

import { useGalleryLifecycle } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-lifecycle';
import { observeViewportCssVars } from '@shared/dom/viewport';
import { createRoot, createSignal } from 'solid-js';

describe('useGalleryLifecycle', () => {
  it('reserves the actual wrapped toolbar or hover sensor edge for item alignment', () => {
    const container = document.createElement('div');
    const wrapper = document.createElement('div');
    const toolbar = document.createElement('div');
    toolbar.dataset.galleryElement = 'toolbar';
    wrapper.append(toolbar);
    const hover = document.createElement('div');
    hover.dataset.galleryElement = 'toolbar-hover-zone';
    const items = document.createElement('div');
    items.dataset.galleryElement = 'items';
    container.append(hover, wrapper, items);

    vi.spyOn(items, 'getBoundingClientRect').mockReturnValue({ top: 0 } as DOMRect);
    const toolbarRect = vi.spyOn(toolbar, 'getBoundingClientRect');
    toolbarRect.mockReturnValue({ bottom: 181.75 } as DOMRect);
    vi.spyOn(hover, 'getBoundingClientRect').mockReturnValue({ bottom: 120 } as DOMRect);
    let measure: (() => { readonly toolbarHeight?: number }) | undefined;
    const cleanup = vi.fn();
    vi.mocked(observeViewportCssVars).mockImplementation(
      (_root, getChrome, _onApplied, observed) => {
        expect(observed).toBe(toolbar);
        measure = getChrome;
        return cleanup;
      }
    );

    const dispose = createRoot((rootDispose) => {
      useGalleryLifecycle({
        containerEl: () => container,
        toolbarWrapperEl: () => wrapper,
        isVisible: () => true,
      });
      return rootDispose;
    });

    expect(measure?.().toolbarHeight).toBe(190);
    expect(container.style.getPropertyValue('--xeg-toolbar-clearance')).toBe('190px');
    toolbarRect.mockReturnValue({ bottom: 85 } as DOMRect);
    expect(measure?.().toolbarHeight).toBe(128);
    expect(container.style.getPropertyValue('--xeg-toolbar-clearance')).toBe('128px');
    dispose();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('pauses and rewinds videos when hiding with reduced motion enabled', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const container = document.createElement('div');
    const video = document.createElement('video');
    const pause = vi.spyOn(video, 'pause').mockImplementation(() => undefined);
    video.currentTime = 12;
    container.append(video);

    let setVisible: (visible: boolean) => void = () => {};
    const dispose = createRoot((rootDispose) => {
      const [visible, updateVisible] = createSignal(true);
      setVisible = updateVisible;
      useGalleryLifecycle({
        containerEl: () => container,
        toolbarWrapperEl: () => null,
        isVisible: visible,
      });
      return rootDispose;
    });

    setVisible(false);
    await Promise.resolve();

    expect(pause).toHaveBeenCalledOnce();
    expect(video.currentTime).toBe(0);
    dispose();
  });
});
