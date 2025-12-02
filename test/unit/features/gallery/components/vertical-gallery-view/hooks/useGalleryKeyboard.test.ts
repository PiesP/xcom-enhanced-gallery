import { createRoot } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGalleryKeyboard } from "../../../../../../../src/features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard";

// Mock dependencies
vi.mock("@shared/external/vendors", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const solid = await vi.importActual<typeof import("solid-js")>("solid-js");
  return {
    getSolid: () => solid,
  };
});

vi.mock("@shared/services/event-manager", () => {
  const listeners: Record<string, () => void> = {};
  let idCounter = 0;

  const mockInstance = {
    addListener: (target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions, _context?: string) => {
      const id = `mock-listener-${idCounter++}`;
      target.addEventListener(type, handler, options);
      listeners[id] = () => target.removeEventListener(type, handler, options);
      return id;
    },
    removeListener: (id: string) => {
      if (listeners[id]) {
        listeners[id]();
        delete listeners[id];
      }
    },
  };


  return {
    EventManager: {
      getInstance: () => mockInstance,
    },
  };
});

describe("useGalleryKeyboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call onClose when Escape is pressed", async () => {
    const onClose = vi.fn();

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        useGalleryKeyboard({ onClose });

        // Wait for effect to run
        setTimeout(() => {
          const event = new KeyboardEvent("keydown", { key: "Escape" });
          document.dispatchEvent(event);

          expect(onClose).toHaveBeenCalled();

          dispose();
          resolve();
        }, 0);
      });
    });
  });

  it("should not call onClose when other keys are pressed", () => {
    const onClose = vi.fn();

    createRoot((dispose) => {
      useGalleryKeyboard({ onClose });

      const event = new KeyboardEvent("keydown", { key: "Enter" });
      document.dispatchEvent(event);

      expect(onClose).not.toHaveBeenCalled();

      dispose();
    });
  });

  it("should not call onClose when target is editable", () => {
    const onClose = vi.fn();

    createRoot((dispose) => {
      useGalleryKeyboard({ onClose });

      const input = document.createElement("input");
      document.body.appendChild(input);

      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
      input.dispatchEvent(event);

      expect(onClose).not.toHaveBeenCalled();

      document.body.removeChild(input);
      dispose();
    });
  });

  it("should ignore Escape when target is contentEditable", () => {
    const onClose = vi.fn();

    createRoot((dispose) => {
      useGalleryKeyboard({ onClose });

      const editable = document.createElement("div");
      editable.setAttribute("contenteditable", "true");
      document.body.appendChild(editable);

      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
      editable.dispatchEvent(event);

      expect(onClose).not.toHaveBeenCalled();

      document.body.removeChild(editable);
      dispose();
    });
  });

  it("should cleanup listeners on dispose", () => {
    const onClose = vi.fn();
    let dispose: () => void;

    createRoot((d) => {
      dispose = d;
      useGalleryKeyboard({ onClose });
    });

    dispose!();

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("prevents default and stops propagation when Escape handled", async () => {
    const onClose = vi.fn();

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        useGalleryKeyboard({ onClose });

        setTimeout(() => {
          const event = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true,
          });
          const preventSpy = vi.spyOn(event, "preventDefault");
          const stopSpy = vi.spyOn(event, "stopPropagation");

          document.dispatchEvent(event);

          expect(onClose).toHaveBeenCalledTimes(1);
          expect(preventSpy).toHaveBeenCalledTimes(1);
          expect(stopSpy).toHaveBeenCalledTimes(1);

          dispose();
          resolve();
        }, 0);
      });
    });
  });

  it("should ignore Escape when target is TEXTAREA", async () => {
    const onClose = vi.fn();

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        useGalleryKeyboard({ onClose });

        setTimeout(() => {
          const textarea = document.createElement("textarea");
          document.body.appendChild(textarea);

          const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
          textarea.dispatchEvent(event);

          expect(onClose).not.toHaveBeenCalled();

          document.body.removeChild(textarea);
          dispose();
          resolve();
        }, 0);
      });
    });
  });

  it("should handle target without tagName (e.g. document)", async () => {
    const onClose = vi.fn();

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        useGalleryKeyboard({ onClose });

        setTimeout(() => {
          // Dispatch on document directly
          const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
          Object.defineProperty(event, 'target', { value: document, writable: true });

          document.dispatchEvent(event);

          expect(onClose).toHaveBeenCalled();

          dispose();
          resolve();
        }, 0);
      });
    });
  });

  it("should prevent default and stop propagation when handled", async () => {
    const onClose = vi.fn();

    await new Promise<void>((resolve) => {
      createRoot((dispose) => {
        useGalleryKeyboard({ onClose });

        setTimeout(() => {
          const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
          const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
          const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

          document.dispatchEvent(event);

          expect(onClose).toHaveBeenCalled();
          expect(preventDefaultSpy).toHaveBeenCalled();
          expect(stopPropagationSpy).toHaveBeenCalled();

          dispose();
          resolve();
        }, 0);
      });
    });
  });
});
