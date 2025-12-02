import { createRoot, createSignal } from 'solid-js';
import { useGalleryItemScroll } from '@features/gallery/hooks/useGalleryItemScroll';

vi.mock('@shared/external/vendors', async () => {
  const solid = await vi.importActual<typeof import('solid-js')>('solid-js');
  return {
    getSolid: () => solid,
  };
});

describe('useGalleryItemScroll (auto-scroll integration)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupContainer = () => {
    const container = document.createElement('div');
    const list = document.createElement('div');
    list.setAttribute('data-xeg-role', 'items-container');
    container.appendChild(list);

    const createItem = () => {
      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      list.appendChild(item);
      return item;
    };

    return { container, list, createItem };
  };

  it('scrolls to the current index when the container becomes available', async () => {
    await createRoot(async dispose => {
      const { container, createItem } = setupContainer();
      const target = createItem();
      const scrollSpy = vi.fn();
      target.scrollIntoView = scrollSpy;

      const [containerEl, setContainerEl] = createSignal<HTMLElement | null>(null);
      const [currentIndex] = createSignal(0);
      const [totalItems] = createSignal(1);

      useGalleryItemScroll(
        () => containerEl(),
        currentIndex,
        () => totalItems(),
        {
          enabled: true,
        },
      );

      // Effect should not run until container exists
      expect(scrollSpy).not.toHaveBeenCalled();

      setContainerEl(container);
      await Promise.resolve();

      expect(scrollSpy).toHaveBeenCalledTimes(1);

      dispose();
    });
  });

  it('respects container re-mounts by scrolling again', async () => {
    await createRoot(async dispose => {
      const { container, createItem } = setupContainer();
      const target = createItem();
      const scrollSpy = vi.fn();
      target.scrollIntoView = scrollSpy;

      const [containerEl, setContainerEl] = createSignal<HTMLElement | null>(container);
      const [currentIndex] = createSignal(0);
      const [totalItems] = createSignal(1);

      useGalleryItemScroll(
        () => containerEl(),
        currentIndex,
        () => totalItems(),
        {
          enabled: true,
        },
      );

      await Promise.resolve();
      expect(scrollSpy).toHaveBeenCalledTimes(1);

      setContainerEl(null);
      await Promise.resolve();
      setContainerEl(container);
      await Promise.resolve();

      expect(scrollSpy).toHaveBeenCalledTimes(2);

      dispose();
    });
  });
});
