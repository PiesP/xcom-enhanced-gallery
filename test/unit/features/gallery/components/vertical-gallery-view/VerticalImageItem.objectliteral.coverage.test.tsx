import { describe, it, expect, vi } from 'vitest';

// Mocks for environment dependencies used by the component
vi.mock('@shared/container/settings-access', () => ({
  getSetting: vi.fn((_key, fallback) => fallback),
  setSetting: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@shared/container/service-accessors', () => ({
  getLanguageService: vi.fn(() => ({ translate: (k: string) => k })),
}));
vi.mock('@shared/utils/performance', () => ({
  SharedObserver: { observe: vi.fn(() => () => {}), unobserve: vi.fn() },
}));
vi.mock('@/features/gallery/components/vertical-gallery-view/hooks/useVideoVisibility', () => ({
  useVideoVisibility: vi.fn(() => {}),
}));

// Top-level import ensures this test is picked up as related to the mutated file by Stryker
import '@/features/gallery/components/vertical-gallery-view/VerticalImageItem';
import styles from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css';
import { render } from '@solidjs/testing-library';

describe('VerticalImageItem object-literal mapping coverage', () => {
  it('maps fitMode values to CSS classes for wrapper and media (string accessor)', async () => {
    const imageMedia = { url: 'https://example.com/image.png', filename: 'image.png', type: 'image' } as any;

    const modes: Array<string> = ['original', 'fitWidth', 'fitHeight', 'fitContainer'];
    for (const mode of modes) {
      const mod = await vi.importActual<typeof import('@/features/gallery/components/vertical-gallery-view/VerticalImageItem')>('@/features/gallery/components/vertical-gallery-view/VerticalImageItem');
      const VerticalImageItem = mod.VerticalImageItem;
      const { container } = render(() => (
        <VerticalImageItem media={imageMedia} index={0} isActive forceVisible fitMode={mode as any} onClick={() => {}} />
      ));

      const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement | null;
      expect(wrapper).toBeTruthy();
      expect(wrapper?.getAttribute('data-fit-mode')).toBe(mode);

      const key = mode === 'original' ? 'fitOriginal' : mode;
      expect(wrapper?.className.includes((styles as any)[key])).toBe(true);

      const img = container.querySelector('img') as HTMLImageElement | null;
      if (img) {
        expect(img.className.includes((styles as any)[key])).toBe(true);
      }
    }
  });

  it('maps fitMode when using accessor function form (video variant)', async () => {
    const videoMedia = { url: 'https://example.com/video.mp4', filename: 'video.mp4', type: 'video' } as any;
    const modes: Array<string> = ['original', 'fitWidth', 'fitHeight', 'fitContainer'];

    for (const mode of modes) {
      const mod = await vi.importActual<typeof import('@/features/gallery/components/vertical-gallery-view/VerticalImageItem')>('@/features/gallery/components/vertical-gallery-view/VerticalImageItem');
      const VerticalImageItem = mod.VerticalImageItem;
      const { container } = render(() => (
        <VerticalImageItem media={videoMedia} index={0} isActive forceVisible fitMode={() => mode as any} onClick={() => {}} />
      ));

      const wrapper = container.querySelector('[data-xeg-component="vertical-image-item"]') as HTMLDivElement | null;
      expect(wrapper).toBeTruthy();
      expect(wrapper?.getAttribute('data-fit-mode')).toBe(mode);

      const key = mode === 'original' ? 'fitOriginal' : mode;
      expect(wrapper?.className.includes((styles as any)[key])).toBe(true);

      const video = container.querySelector('video') as HTMLVideoElement | null;
      if (video) {
        expect(video.className.includes((styles as any)[key])).toBe(true);
      }
    }
  });
});
