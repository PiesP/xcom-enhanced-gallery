import { useGalleryItemScroll } from "@features/gallery/hooks/useGalleryItemScroll";
import { createRoot, createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";

describe("useGalleryItemScroll", () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should scroll to item when index changes and enabled is true", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const container = document.createElement("div");
        const list = document.createElement("div");
        list.setAttribute("data-xeg-role", "items-list");
        container.appendChild(list);

        const item0 = document.createElement("div");
        item0.setAttribute("data-xeg-role", "gallery-item");
        list.appendChild(item0);

        const item1 = document.createElement("div");
        item1.setAttribute("data-xeg-role", "gallery-item");
        list.appendChild(item1);

        // Mock specific item
        const scrollSpy = vi.fn();
        item1.scrollIntoView = scrollSpy;

        const [currentIndex, setCurrentIndex] = createSignal(0);
        const [enabled] = createSignal(true);

        useGalleryItemScroll(
          { current: container },
          currentIndex,
          () => 2,
          { enabled }
        );

        // Initial scroll might happen async too
        await Promise.resolve();

        // Change index
        setCurrentIndex(1);

        // Wait for effect
        await Promise.resolve();

        expect(scrollSpy).toHaveBeenCalled();

        dispose();
        resolve();
      });
    });
  });

  it("should NOT scroll when index changes and enabled is false", async () => {
    await new Promise<void>((resolve) => {
      createRoot(async (dispose) => {
        const container = document.createElement("div");
        const list = document.createElement("div");
        list.setAttribute("data-xeg-role", "items-list");
        container.appendChild(list);

        const item1 = document.createElement("div");
        item1.setAttribute("data-xeg-role", "gallery-item");
        list.appendChild(item1); // item 0
        list.appendChild(item1.cloneNode(true)); // item 1

        const items = list.querySelectorAll('[data-xeg-role="gallery-item"]');
        const targetItem = items[1] as HTMLElement;
        const scrollSpy = vi.fn();
        targetItem.scrollIntoView = scrollSpy;

        const [currentIndex, setCurrentIndex] = createSignal(0);
        const [enabled] = createSignal(false);

        useGalleryItemScroll(
          { current: container },
          currentIndex,
          () => 2,
          { enabled }
        );

        setCurrentIndex(1);
        await Promise.resolve();

        expect(scrollSpy).not.toHaveBeenCalled();

        dispose();
        resolve();
      });
    });
  });

  it("should NOT scroll when enabled changes from false to true if index hasn't changed", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot(async (dispose) => {
        try {
          const container = document.createElement("div");
          const list = document.createElement("div");
          list.setAttribute("data-xeg-role", "items-list");
          container.appendChild(list);

          const item0 = document.createElement("div");
          item0.setAttribute("data-xeg-role", "gallery-item");
          list.appendChild(item0);

          const scrollSpy = vi.fn();
          item0.scrollIntoView = scrollSpy;

          const [currentIndex] = createSignal(0);
          const [enabled, setEnabled] = createSignal(false);

          useGalleryItemScroll(
            { current: container },
            currentIndex,
            () => 1,
            { enabled }
          );

          // Wait for initial effect to run (where enabled is false)
          await Promise.resolve();

          // Enable
          setEnabled(true);
          await Promise.resolve();

          // Should NOT scroll just because enabled changed
          expect(scrollSpy).not.toHaveBeenCalled();
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          dispose();
        }
      });
    });
  });

  it("allows manual scrollToItem calls with center alignment", async () => {
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
            {
              alignToCenter: true,
              block: "end",
              behavior: "smooth",
            },
          );

          hook.scrollToItem(1);

          expect(scrollSpy).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });

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

  it("retries scrolling via requestAnimationFrame when initial lookup fails", async () => {
    const rafCallbacks: Array<FrameRequestCallback> = [];
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return 1;
    }) as typeof window.requestAnimationFrame;

    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        try {
          const container = document.createElement("div");
          const list = document.createElement("div");
          list.setAttribute("data-xeg-role", "items-list");
          container.appendChild(list);

          const hook = useGalleryItemScroll(
            { current: container },
            () => 0,
            () => 1,
          );

          hook.scrollToItem(0);
          expect(rafCallbacks).toHaveLength(1);

          const fallbackItem = document.createElement("div");
          fallbackItem.setAttribute("data-xeg-role", "gallery-item");
          const scrollSpy = vi.fn();
          fallbackItem.scrollIntoView = scrollSpy;
          list.appendChild(fallbackItem);

          rafCallbacks.pop()?.(0);

          expect(scrollSpy).toHaveBeenCalledTimes(1);

          resolve();
        } catch (error) {
          reject(error as Error);
        } finally {
          dispose();
        }
      });
    });

    window.requestAnimationFrame = originalRaf;
  });

  it("invokes onScrollStart callback whenever a target scrolls", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        try {
          const container = document.createElement("div");
          const list = document.createElement("div");
          list.setAttribute("data-xeg-role", "items-container");
          container.appendChild(list);

          const item0 = document.createElement("div");
          item0.setAttribute("data-xeg-role", "gallery-item");
          list.appendChild(item0);
          item0.scrollIntoView = vi.fn();

          const onScrollStart = vi.fn();

          const hook = useGalleryItemScroll(
            { current: container },
            () => 0,
            () => 1,
            { onScrollStart },
          );

          hook.scrollToItem(0);

          expect(onScrollStart).toHaveBeenCalledTimes(1);

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });

  it("skips automatic scrolling while the hook sees an active scroll", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot(async (dispose) => {
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

          const firstSpy = vi.fn();
          const secondSpy = vi.fn();
          item0.scrollIntoView = firstSpy;
          item1.scrollIntoView = secondSpy;

          const [currentIndex, setCurrentIndex] = createSignal(0);
          const [isScrolling, setIsScrolling] = createSignal(false);

          useGalleryItemScroll(
            { current: container },
            currentIndex,
            () => 2,
            {
              isScrolling,
              enabled: true,
            },
          );

          await Promise.resolve();
          vi.clearAllMocks();

          setIsScrolling(true);
          setCurrentIndex(1);
          await Promise.resolve();

          expect(secondSpy).not.toHaveBeenCalled();

          setIsScrolling(false);
          setCurrentIndex(0);
          await Promise.resolve();

          expect(firstSpy).toHaveBeenCalled();

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });

  it("scrollToCurrentItem proxies to the latest index", async () => {
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

          const spy0 = vi.fn();
          const spy1 = vi.fn();
          item0.scrollIntoView = spy0;
          item1.scrollIntoView = spy1;

          const [currentIndex, setCurrentIndex] = createSignal(0);
          const hook = useGalleryItemScroll(
            { current: container },
            currentIndex,
            () => 2,
          );

          setCurrentIndex(1);
          hook.scrollToCurrentItem();

          expect(spy0).not.toHaveBeenCalled();
          expect(spy1).toHaveBeenCalledTimes(1);

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          dispose();
        }
      });
    });
  });
});
