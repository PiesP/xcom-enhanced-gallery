import {
  isGalleryInternalElement,
  isVideoControlElement,
} from "@shared/dom/utils";
import { handleMediaClick } from "@shared/utils/events/handlers/media-click";
import { isProcessableMedia } from "@shared/utils/media/media-click-detector";
import { isHTMLElement } from "@shared/utils/types/guards";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  mockIsOpen: { value: false },
}));

// Mock dependencies
vi.mock("@shared/state/signals/gallery.signals", () => ({
  gallerySignals: {
    isOpen: mocks.mockIsOpen,
  },
}));

vi.mock("@shared/utils/media/media-click-detector", () => ({
  isProcessableMedia: vi.fn(),
}));

vi.mock("@shared/dom/utils", () => ({
  isGalleryInternalElement: vi.fn(),
  isVideoControlElement: vi.fn(),
}));

vi.mock("@shared/utils/types/guards", () => ({
  isHTMLElement: vi.fn(),
}));

describe("media-click-handler coverage", () => {
  let handlers: any;
  let options: any;
  let mockEvent: MouseEvent;
  let mockTarget: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    handlers = {
      onMediaClick: vi.fn(),
      onGalleryClose: vi.fn(),
    };
    options = {
      enableMediaDetection: true,
    };

    mockTarget = document.createElement("div");
    mockEvent = {
      target: mockTarget,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    } as unknown as MouseEvent;

    mocks.mockIsOpen.value = false;
    (isHTMLElement as unknown as Mock).mockReturnValue(true);
    (isProcessableMedia as unknown as Mock).mockReturnValue(true);
    (isGalleryInternalElement as unknown as Mock).mockReturnValue(false);
    (isVideoControlElement as unknown as Mock).mockReturnValue(false);
  });

  it("should return false when isHTMLElement throws (uncaught exception)", async () => {
    // In the refactored code, exceptions in isHTMLElement propagate up
    // This test verifies the function doesn't silently swallow errors
    (isHTMLElement as any).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    await expect(handleMediaClick(mockEvent, handlers, options)).rejects.toThrow("Unexpected error");
  });

  it("should return false when target is not HTMLElement", async () => {
    (isHTMLElement as any).mockReturnValue(false);

    const result = await handleMediaClick(mockEvent, handlers, options);

    expect(result.handled).toBe(false);
    expect(result.reason).toBe("Invalid target (not HTMLElement)");
  });

  it("should return false when isProcessableMedia returns false", async () => {
    (isProcessableMedia as any).mockReturnValue(false);

    const result = await handleMediaClick(mockEvent, handlers, options);

    expect(result.handled).toBe(false);
    expect(result.reason).toBe("Non-processable media target");
  });

  it("should return false when gallery is open AND target is inside gallery", async () => {
    mocks.mockIsOpen.value = true;
    const { isGalleryInternalElement } = await import("@shared/dom/utils");
    (isGalleryInternalElement as any).mockReturnValue(true);

    const result = await handleMediaClick(mockEvent, handlers, options);

    expect(result.handled).toBe(false);
    expect(result.reason).toBe("Gallery internal event");
  });

  it("should return false when media detection is disabled", async () => {
    options.enableMediaDetection = false;
    const result = await handleMediaClick(mockEvent, handlers, options);
    expect(result.handled).toBe(false);
    expect(result.reason).toBe("Media detection disabled");
  });

  it("should return false when target is video control element", async () => {
    const { isVideoControlElement } = await import("@shared/dom/utils");
    (isVideoControlElement as Mock).mockReturnValue(true);

    const result = await handleMediaClick(mockEvent, handlers, options);
    expect(result.handled).toBe(false);
    expect(result.reason).toBe("Video control element");
  });

  it("should call handler and stop browser defaults when media is processable", async () => {
    await handleMediaClick(mockEvent, handlers, options);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
    expect(handlers.onMediaClick).toHaveBeenCalledWith(mockTarget, mockEvent);
  });
});
