import { useGalleryItemScroll } from "@features/gallery/hooks/useGalleryItemScroll";
import { createRoot, createSignal } from "solid-js";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("useGalleryItemScroll mutation coverage", () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createContainer = () => {
    const container = document.createElement("div");
    const list = document.createElement("div");
    list.setAttribute("data-xeg-role", "items-list");
    container.appendChild(list);

    const item = document.createElement("div");
    item.setAttribute("data-xeg-role", "gallery-item");
    list.appendChild(item);

    const scrollSpy = vi.fn();
    item.scrollIntoView = scrollSpy;

    return { container, list, scrollSpy };
  };

  it("guards missing container references", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        try {
          const hook = useGalleryItemScroll(
            () => null,
            () => 0,
            () => 0,
          );

          expect(() => hook.scrollToItem(0)).not.toThrow();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });

  it("does not scroll when index is outside total bounds", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        try {
          const { container, scrollSpy } = createContainer();
          const hook = useGalleryItemScroll(
            { current: container },
            () => 0,
            () => 1,
            { enabled: true },
          );

          hook.scrollToItem(-1);
          hook.scrollToItem(5);
          expect(scrollSpy).not.toHaveBeenCalled();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });

  it("falls back to items-container selector when needed", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        try {
          const container = document.createElement("div");
          const list = document.createElement("div");
          list.setAttribute("data-xeg-role", "items-container");
          container.appendChild(list);

          const item = document.createElement("div");
          item.setAttribute("data-xeg-role", "gallery-item");
          const scrollSpy = vi.fn();
          item.scrollIntoView = scrollSpy;
          list.appendChild(item);

          const hook = useGalleryItemScroll(
            { current: container },
            () => 0,
            () => 1,
          );

          hook.scrollToItem(0);
          expect(scrollSpy).toHaveBeenCalledTimes(1);
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });

  it("respects enabled accessor for manual scroll requests", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        try {
          const { container, scrollSpy } = createContainer();
          const [enabled, setEnabled] = createSignal(false);

          const hook = useGalleryItemScroll(
            { current: container },
            () => 0,
            () => 1,
            { enabled },
          );

          hook.scrollToItem(0);
          expect(scrollSpy).not.toHaveBeenCalled();

          setEnabled(true);
          hook.scrollToItem(0);
          expect(scrollSpy).toHaveBeenCalledTimes(1);
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });

  it("defaults to 'start' block and 'auto' behavior when not specified", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        try {
          const container = document.createElement("div");
          const list = document.createElement("div");
          list.setAttribute("data-xeg-role", "items-list");
          container.appendChild(list);

          const item0 = document.createElement("div");
          item0.setAttribute("data-xeg-role", "gallery-item");
          const item1 = document.createElement("div");
          item1.setAttribute("data-xeg-role", "gallery-item");
          list.appendChild(item0);
          list.appendChild(item1);

          const scrollSpy = vi.fn();
          item1.scrollIntoView = scrollSpy;

          const hook = useGalleryItemScroll(
            { current: container },
            () => 1,
            () => 2,
          );

          hook.scrollToItem(1);
          expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'start', inline: 'nearest' });

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });

  it('auto-scrolls when currentIndex changes (effect)', async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot(async (dispose) => {
        try {
          const container = document.createElement('div');
          const list = document.createElement('div');
          list.setAttribute('data-xeg-role', 'items-list');
          container.appendChild(list);

          const item0 = document.createElement('div');
          item0.setAttribute('data-xeg-role', 'gallery-item');
          const item1 = document.createElement('div');
          item1.setAttribute('data-xeg-role', 'gallery-item');
          list.appendChild(item0);
          list.appendChild(item1);

          const scrollSpy = vi.fn();
          item1.scrollIntoView = scrollSpy;

          const [currentIndex, setCurrentIndex] = createSignal(0);
          useGalleryItemScroll({ current: container }, currentIndex, () => 2);

          await Promise.resolve();
          setCurrentIndex(1);
          await Promise.resolve();

          expect(scrollSpy).toHaveBeenCalled();
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          dispose();
        }
      });
    });
  });
});
