import type {
    EventHandlers,
    GalleryEventOptions,
} from "@shared/utils/events/core/event-context";
import { handleMediaClick } from "@shared/utils/events/handlers/media-click";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  mockIsOpen: { value: false },
  mockIsProcessableMedia: vi.fn(),
  mockIsGalleryInternalElement: vi.fn(),
  mockIsVideoControlElement: vi.fn(),
}));

// Mock dependencies
vi.mock("@shared/state/signals/gallery.signals", () => ({
  gallerySignals: {
    isOpen: mocks.mockIsOpen,
  },
}));

vi.mock("@shared/utils/media/media-click-detector", () => ({
  isProcessableMedia: mocks.mockIsProcessableMedia,
}));

vi.mock("@shared/dom/utils", () => ({
  isGalleryInternalElement: mocks.mockIsGalleryInternalElement,
  isVideoControlElement: mocks.mockIsVideoControlElement,
}));

vi.mock("@shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("media-click-handler", () => {
  let handlers: EventHandlers;
  let options: GalleryEventOptions;
  let mockEvent: MouseEvent;
  let mockTarget: HTMLElement;

  beforeEach(() => {
    handlers = {
      onMediaClick: vi.fn(),
      onGalleryClose: vi.fn(),
    };
    options = {
      enableKeyboard: true,
      enableMediaDetection: true,
      debugMode: false,
      preventBubbling: true,
      context: "gallery",
    };

    mockTarget = document.createElement("div");
    mockTarget.closest = vi.fn();
    mockEvent = {
      target: mockTarget,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      stopImmediatePropagation: vi.fn(),
    } as unknown as MouseEvent;

    // Reset mocks
    mocks.mockIsOpen.value = false;
    mocks.mockIsProcessableMedia.mockReset();
    mocks.mockIsGalleryInternalElement.mockReset();
    mocks.mockIsVideoControlElement.mockReset();

    // Default mock behaviors
    mocks.mockIsGalleryInternalElement.mockReturnValue(false);
    mocks.mockIsVideoControlElement.mockReturnValue(false);
    mocks.mockIsProcessableMedia.mockReturnValue(true);
    (mockTarget.closest as Mock).mockReturnValue(true); // Default to inside media container
  });

  it("should not handle click if media detection is disabled", async () => {
    options.enableMediaDetection = false;
    const result = await handleMediaClick(mockEvent, handlers, options);
    expect(result.handled).toBe(false);
  });

  it("should not handle click if gallery is already open", async () => {
    mocks.mockIsOpen.value = true;
    mocks.mockIsProcessableMedia.mockReturnValue(false);

    const result = await handleMediaClick(mockEvent, handlers, options);

    expect(result.handled).toBe(false);
    expect(handlers.onMediaClick).not.toHaveBeenCalled();
  });

  it("should not handle click if target is inside gallery", async () => {
    mocks.mockIsOpen.value = true;
    mocks.mockIsGalleryInternalElement.mockReturnValue(true);

    const result = await handleMediaClick(mockEvent, handlers, options);

    expect(result.handled).toBe(false);
  });

  it("should not handle click if target is a video control element", async () => {
    mocks.mockIsVideoControlElement.mockReturnValue(true);
    const result = await handleMediaClick(mockEvent, handlers, options);
    expect(result.handled).toBe(false);
  });

  it("should not handle click if no processable media detected", async () => {
    mocks.mockIsProcessableMedia.mockReturnValue(false);
    const result = await handleMediaClick(mockEvent, handlers, options);
    expect(result.handled).toBe(false);
    expect(handlers.onMediaClick).not.toHaveBeenCalled();
  });

  it("should handle click if media is detected", async () => {
    const result = await handleMediaClick(mockEvent, handlers, options);

    expect(result.handled).toBe(true);
    expect(handlers.onMediaClick).toHaveBeenCalledWith(mockTarget, mockEvent);
  });

  it("should handle video media type correctly", async () => {
    const result = await handleMediaClick(mockEvent, handlers, options);

    expect(result.handled).toBe(true);
    expect(handlers.onMediaClick).toHaveBeenCalledWith(mockTarget, mockEvent);
  });
});
