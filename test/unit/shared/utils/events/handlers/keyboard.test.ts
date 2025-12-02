import type {
    EventHandlers,
    GalleryEventOptions,
} from "@shared/utils/events/core/event-context";
import { handleKeyboardEvent } from "@shared/utils/events/handlers/keyboard";
import * as videoControlHelper from "@shared/utils/events/handlers/video-control-helper";
import * as keyboardDebounce from "@shared/utils/events/keyboard-debounce";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockIsOpen: { value: true },
  mockMediaItems: { value: [{}, {}, {}] },
  mockCurrentIndex: { value: 1 },
  mockCurrentVideoElement: { value: null },
  mockNavigateToItem: vi.fn(),
  mockNavigatePrevious: vi.fn(),
  mockNavigateNext: vi.fn(),
}));

vi.mock("@shared/state/signals/gallery.signals", () => ({
  gallerySignals: {
    isOpen: mocks.mockIsOpen,
    mediaItems: mocks.mockMediaItems,
    currentIndex: mocks.mockCurrentIndex,
    currentVideoElement: mocks.mockCurrentVideoElement,
  },
  navigateToItem: (...args: unknown[]) => mocks.mockNavigateToItem(...args),
  navigatePrevious: (...args: unknown[]) => mocks.mockNavigatePrevious(...args),
  navigateNext: (...args: unknown[]) => mocks.mockNavigateNext(...args),
}));

describe("keyboard-handler", () => {
  let handlers: EventHandlers;
  let options: GalleryEventOptions;

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

    // Reset mocks
    mocks.mockIsOpen.value = true;
    mocks.mockMediaItems.value = [{}, {}, {}];
    mocks.mockCurrentIndex.value = 1;
    mocks.mockNavigateToItem.mockClear();
    mocks.mockNavigatePrevious.mockClear();
    mocks.mockNavigateNext.mockClear();

    // Mock keyboardDebounce
    vi.spyOn(keyboardDebounce, "shouldExecutePlayPauseKey").mockReturnValue(
      true,
    );
    vi.spyOn(keyboardDebounce, "shouldExecuteVideoControlKey").mockReturnValue(
      true,
    );

    // Mock videoControlHelper
    vi.spyOn(videoControlHelper, "executeVideoControl");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not handle events if enableKeyboard is false", () => {
    options.enableKeyboard = false;
    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mocks.mockNavigateNext).not.toHaveBeenCalled();
  });

  it("should not handle events if gallery is closed", () => {
    mocks.mockIsOpen.value = false;
    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(mocks.mockNavigateNext).not.toHaveBeenCalled();
  });

  it("should handle ArrowRight", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    vi.spyOn(event, "preventDefault");
    vi.spyOn(event, "stopPropagation");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mocks.mockNavigateNext).toHaveBeenCalledWith("keyboard");
  });

  it("should handle ArrowLeft", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mocks.mockNavigatePrevious).toHaveBeenCalledWith("keyboard");
  });

  it("should handle Home", () => {
    const event = new KeyboardEvent("keydown", { key: "Home" });
    handleKeyboardEvent(event, handlers, options);
    expect(mocks.mockNavigateToItem).toHaveBeenCalledWith(0, "keyboard");
  });

  it("should handle End", () => {
    const event = new KeyboardEvent("keydown", { key: "End" });
    handleKeyboardEvent(event, handlers, options);
    expect(mocks.mockNavigateToItem).toHaveBeenCalledWith(2, "keyboard");
  });

  it("should handle PageDown", () => {
    mocks.mockCurrentIndex.value = 0;
    const event = new KeyboardEvent("keydown", { key: "PageDown" });
    handleKeyboardEvent(event, handlers, options);
    expect(mocks.mockNavigateToItem).toHaveBeenCalledWith(2, "keyboard");
  });

  it("should handle PageUp", () => {
    mocks.mockCurrentIndex.value = 2;
    const event = new KeyboardEvent("keydown", { key: "PageUp" });
    handleKeyboardEvent(event, handlers, options);
    expect(mocks.mockNavigateToItem).toHaveBeenCalledWith(0, "keyboard");
  });

  it("should handle Space (play/pause)", () => {
    const event = new KeyboardEvent("keydown", { key: " " });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(videoControlHelper.executeVideoControl).toHaveBeenCalledWith(
      "togglePlayPause",
    );
  });

  it("should handle M (mute)", () => {
    const event = new KeyboardEvent("keydown", { key: "m" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(videoControlHelper.executeVideoControl).toHaveBeenCalledWith(
      "toggleMute",
    );
  });

  it("should handle ArrowUp (volume up)", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(videoControlHelper.executeVideoControl).toHaveBeenCalledWith(
      "volumeUp",
    );
  });

  it("should handle ArrowDown (volume down)", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(videoControlHelper.executeVideoControl).toHaveBeenCalledWith(
      "volumeDown",
    );
  });

  it("should respect debounce for Space", () => {
    vi.mocked(keyboardDebounce.shouldExecutePlayPauseKey).mockReturnValue(
      false,
    );
    const event = new KeyboardEvent("keydown", { key: " " });

    handleKeyboardEvent(event, handlers, options);

    expect(videoControlHelper.executeVideoControl).not.toHaveBeenCalled();
  });

  it("should respect debounce for video keys", () => {
    vi.mocked(keyboardDebounce.shouldExecuteVideoControlKey).mockReturnValue(
      false,
    );
    const event = new KeyboardEvent("keydown", { key: "ArrowUp" });

    handleKeyboardEvent(event, handlers, options);

    expect(videoControlHelper.executeVideoControl).not.toHaveBeenCalled();
  });

  it("should handle Escape key to close gallery", () => {
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    vi.spyOn(event, "preventDefault");
    vi.spyOn(event, "stopPropagation");

    handleKeyboardEvent(event, handlers, options);

    expect(handlers.onGalleryClose).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("should not close gallery on Escape if gallery is already closed", () => {
    mocks.mockIsOpen.value = false;
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(handlers.onGalleryClose).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("should call custom onKeyboardEvent handler after navigation", () => {
    const customHandler = vi.fn();
    handlers.onKeyboardEvent = customHandler;

    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
    handleKeyboardEvent(event, handlers, options);

    expect(customHandler).toHaveBeenCalledWith(event);
  });

  it("should call custom onKeyboardEvent handler for non-gallery keys", () => {
    mocks.mockIsOpen.value = false;
    const customHandler = vi.fn();
    handlers.onKeyboardEvent = customHandler;

    const event = new KeyboardEvent("keydown", { key: "a" });
    handleKeyboardEvent(event, handlers, options);

    expect(customHandler).toHaveBeenCalledWith(event);
  });

  it("should handle uppercase M key for mute", () => {
    const event = new KeyboardEvent("keydown", { key: "M" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(videoControlHelper.executeVideoControl).toHaveBeenCalledWith(
      "toggleMute",
    );
  });

  it("should handle 'Space' string key variant", () => {
    const event = new KeyboardEvent("keydown", { key: "Space" });
    vi.spyOn(event, "preventDefault");

    handleKeyboardEvent(event, handlers, options);

    expect(videoControlHelper.executeVideoControl).toHaveBeenCalledWith(
      "togglePlayPause",
    );
  });

  it("should handle errors gracefully", async () => {
    const { logger } = await import("@shared/logging");
    vi.spyOn(logger, "error");

    // Make navigateNext throw
    mocks.mockNavigateNext.mockImplementation(() => {
      throw new Error("Test error");
    });

    const event = new KeyboardEvent("keydown", { key: "ArrowRight" });

    // Should not throw
    expect(() => handleKeyboardEvent(event, handlers, options)).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      "Error handling keyboard event:",
      expect.any(Error),
    );
  });

  it("should respect debounce for mute key (M)", () => {
    vi.mocked(keyboardDebounce.shouldExecuteVideoControlKey).mockReturnValue(
      false,
    );
    const event = new KeyboardEvent("keydown", { key: "M" });

    handleKeyboardEvent(event, handlers, options);

    expect(videoControlHelper.executeVideoControl).not.toHaveBeenCalled();
  });

  it("should respect debounce for ArrowDown volume key", () => {
    vi.mocked(keyboardDebounce.shouldExecuteVideoControlKey).mockReturnValue(
      false,
    );
    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });

    handleKeyboardEvent(event, handlers, options);

    expect(videoControlHelper.executeVideoControl).not.toHaveBeenCalled();
  });
});
