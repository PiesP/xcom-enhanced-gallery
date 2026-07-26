import { describe, expect, it, vi } from 'vitest';

vi.mock('solid-js', async () => vi.importActual('solid-js/dist/solid.js'));

vi.mock('@shared/dom/viewport', () => ({
  observeViewportCssVars: vi.fn(() => vi.fn()),
}));

vi.mock('@shared/utils/css/css-animations', () => ({
  animateGalleryEnter: vi.fn(async () => undefined),
  animateGalleryExit: vi.fn(async () => undefined),
}));

import { useGalleryLifecycle } from '@features/gallery/components/vertical-gallery-view/hooks/use-gallery-lifecycle';
import { createRoot, createSignal } from 'solid-js';

describe('useGalleryLifecycle', () => {
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
