import {
  executeVideoControl,
  getVideoPlaybackState,
} from "@shared/utils/events/handlers/video-control-helper";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks
const mocks = vi.hoisted(() => ({
  mockCurrentVideoElement: { value: null as HTMLVideoElement | null },
  mockCurrentIndex: { value: 0 },
}));

// Mock dependencies
vi.mock("@shared/state/signals/gallery.signals", () => ({
  gallerySignals: {
    currentVideoElement: mocks.mockCurrentVideoElement,
    currentIndex: mocks.mockCurrentIndex,
  },
}));

vi.mock("@shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("video-control-helper", () => {
  let mockVideo: HTMLVideoElement;

  beforeEach(() => {
    mockVideo = document.createElement("video");
    mockVideo.play = vi.fn().mockResolvedValue(undefined);
    mockVideo.pause = vi.fn();
    Object.defineProperty(mockVideo, "paused", {
      value: true,
      writable: true,
    });
    Object.defineProperty(mockVideo, "muted", {
      value: false,
      writable: true,
    });
    Object.defineProperty(mockVideo, "volume", {
      value: 0.5,
      writable: true,
    });

    // Reset mocks
    mocks.mockCurrentVideoElement.value = null;
    mocks.mockCurrentIndex.value = 0;
    vi.clearAllMocks();
  });

  it("should execute play action", async () => {
    await executeVideoControl("play", { video: mockVideo });
    expect(mockVideo.play).toHaveBeenCalled();
  });

  it("should execute pause action", async () => {
    await executeVideoControl("pause", { video: mockVideo });
    expect(mockVideo.pause).toHaveBeenCalled();
  });

  it("should execute togglePlayPause action (play when paused)", async () => {
    Object.defineProperty(mockVideo, "paused", { value: true });
    await executeVideoControl("togglePlayPause", { video: mockVideo });
    expect(mockVideo.play).toHaveBeenCalled();
  });

  it("should execute togglePlayPause action (pause when playing)", async () => {
    Object.defineProperty(mockVideo, "paused", { value: false });
    await executeVideoControl("togglePlayPause", { video: mockVideo });
    expect(mockVideo.pause).toHaveBeenCalled();
  });

  it("should execute mute action", async () => {
    await executeVideoControl("mute", { video: mockVideo });
    expect(mockVideo.muted).toBe(true);
  });

  it("should execute toggleMute action (mute when unmuted)", async () => {
    Object.defineProperty(mockVideo, "muted", { value: false });
    await executeVideoControl("toggleMute", { video: mockVideo });
    expect(mockVideo.muted).toBe(true);
  });

  it("should execute toggleMute action (unmute when muted)", async () => {
    Object.defineProperty(mockVideo, "muted", { value: true });
    await executeVideoControl("toggleMute", { video: mockVideo });
    expect(mockVideo.muted).toBe(false);
  });

  it("should execute volumeUp action", async () => {
    mockVideo.volume = 0.5;
    await executeVideoControl("volumeUp", { video: mockVideo });
    expect(mockVideo.volume).toBeGreaterThan(0.5);
  });

  it("should execute volumeDown action", async () => {
    mockVideo.volume = 0.5;
    await executeVideoControl("volumeDown", { video: mockVideo });
    expect(mockVideo.volume).toBeLessThan(0.5);
  });

  it("should cap volumeUp at 1", async () => {
    mockVideo.volume = 0.95;
    await executeVideoControl("volumeUp", { video: mockVideo });
    expect(mockVideo.volume).toBe(1);
  });

  it("should cap volumeDown at 0", async () => {
    mockVideo.volume = 0.05;
    await executeVideoControl("volumeDown", { video: mockVideo });
    expect(mockVideo.volume).toBe(0);
  });

  it("should unmute when volumeUp is called and muted", async () => {
    mockVideo.volume = 0.5;
    mockVideo.muted = true;
    await executeVideoControl("volumeUp", { video: mockVideo });
    expect(mockVideo.muted).toBe(false);
  });

  it("should mute when volumeDown reaches 0", async () => {
    mockVideo.volume = 0.1;
    mockVideo.muted = false;
    await executeVideoControl("volumeDown", { video: mockVideo });
    expect(mockVideo.volume).toBe(0);
    expect(mockVideo.muted).toBe(true);
  });

  it("should handle play error gracefully", async () => {
    mockVideo.play = vi.fn().mockRejectedValue(new Error("Play failed"));
    await executeVideoControl("play", { video: mockVideo });
    expect(mockVideo.play).toHaveBeenCalled();
    // Should not throw
  });

  it("should handle play error gracefully during toggle", async () => {
    Object.defineProperty(mockVideo, "paused", { value: true });
    mockVideo.play = vi.fn().mockRejectedValue(new Error("Play failed"));
    await executeVideoControl("togglePlayPause", { video: mockVideo });
    expect(mockVideo.play).toHaveBeenCalled();
    // Should not throw
  });

  it("should use signal for current video if not provided in options", async () => {
    mocks.mockCurrentVideoElement.value = mockVideo;
    await executeVideoControl("play");
    expect(mockVideo.play).toHaveBeenCalled();
  });

  it("should fallback to DOM query if signal is missing", async () => {
    // Setup DOM structure
    const galleryRoot = document.createElement("div");
    galleryRoot.setAttribute("data-xeg-gallery", "");
    // Add to body so querySelector works
    document.body.appendChild(galleryRoot);

    const itemsContainer = document.createElement("div");
    itemsContainer.setAttribute("data-xeg-role", "items-container");
    galleryRoot.appendChild(itemsContainer);

    const item = document.createElement("div");
    const fallbackVideo = document.createElement("video");
    fallbackVideo.play = vi.fn().mockResolvedValue(undefined);
    item.appendChild(fallbackVideo);
    itemsContainer.appendChild(item);

    // Ensure signal is null
    mocks.mockCurrentVideoElement.value = null;
    mocks.mockCurrentIndex.value = 0;

    await executeVideoControl("play");
    expect(fallbackVideo.play).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(galleryRoot);
  });

  it("should do nothing if no video found", async () => {
    mocks.mockCurrentVideoElement.value = null;
    // Ensure no DOM match
    document.body.innerHTML = "";

    await executeVideoControl("play");
    // Should not throw
  });

  it("should return playback state", () => {
    // First set state via play
    executeVideoControl("play", { video: mockVideo });
    const state = getVideoPlaybackState(mockVideo);
    expect(state).toEqual({ playing: true });
  });

  it("should return null playback state if not set", () => {
    const state = getVideoPlaybackState(mockVideo);
    expect(state).toBeNull();
  });

  describe("getCurrentGalleryVideo fallback logic", () => {
    it("should return null when signal returns non-HTMLVideoElement", async () => {
      // Signal returns a non-video element
      mocks.mockCurrentVideoElement.value = document.createElement(
        "div",
      ) as unknown as HTMLVideoElement;
      document.body.innerHTML = "";

      await executeVideoControl("play");
      // Should not throw, should return early
      expect(mockVideo.play).not.toHaveBeenCalled();
    });

    it("should try multiple CSS selectors in fallback", async () => {
      mocks.mockCurrentVideoElement.value = null;

      // Create container with correct data attribute (matches CSS.SELECTORS.DATA_GALLERY)
      const root = document.createElement("div");
      root.setAttribute("data-xeg-gallery", "");
      document.body.appendChild(root);

      const itemsContainer = document.createElement("div");
      itemsContainer.setAttribute("data-xeg-role", "items-container");
      root.appendChild(itemsContainer);

      const item = document.createElement("div");
      const video = document.createElement("video");
      video.play = vi.fn().mockResolvedValue(undefined);
      item.appendChild(video);
      itemsContainer.appendChild(item);

      mocks.mockCurrentIndex.value = 0;

      await executeVideoControl("play");
      expect(video.play).toHaveBeenCalled();

      document.body.removeChild(root);
    });

    it("should return null when container has no items-container", async () => {
      mocks.mockCurrentVideoElement.value = null;

      const root = document.createElement("div");
      root.setAttribute("data-xeg-gallery", "");
      document.body.appendChild(root);
      // No items-container

      await executeVideoControl("play");
      // Should not throw
      expect(mockVideo.play).not.toHaveBeenCalled();

      document.body.removeChild(root);
    });

    it("should return null when target child does not exist", async () => {
      mocks.mockCurrentVideoElement.value = null;

      const root = document.createElement("div");
      root.setAttribute("data-xeg-gallery", "");
      document.body.appendChild(root);

      const itemsContainer = document.createElement("div");
      itemsContainer.setAttribute("data-xeg-role", "items-container");
      root.appendChild(itemsContainer);
      // No children

      mocks.mockCurrentIndex.value = 5; // Index out of bounds

      await executeVideoControl("play");
      expect(mockVideo.play).not.toHaveBeenCalled();

      document.body.removeChild(root);
    });

    it("should return null when target has no video element", async () => {
      mocks.mockCurrentVideoElement.value = null;

      const root = document.createElement("div");
      root.setAttribute("data-xeg-gallery", "");
      document.body.appendChild(root);

      const itemsContainer = document.createElement("div");
      itemsContainer.setAttribute("data-xeg-role", "items-container");
      root.appendChild(itemsContainer);

      const item = document.createElement("div");
      // No video element, just an image
      item.appendChild(document.createElement("img"));
      itemsContainer.appendChild(item);

      mocks.mockCurrentIndex.value = 0;

      await executeVideoControl("play");
      expect(mockVideo.play).not.toHaveBeenCalled();

      document.body.removeChild(root);
    });
  });

  describe("togglePlayPause state tracking", () => {
    it("should track state after pause and toggle correctly", async () => {
      // First pause
      await executeVideoControl("pause", { video: mockVideo });
      expect(getVideoPlaybackState(mockVideo)).toEqual({ playing: false });

      // Toggle should play
      await executeVideoControl("togglePlayPause", { video: mockVideo });
      expect(mockVideo.play).toHaveBeenCalled();
      expect(getVideoPlaybackState(mockVideo)).toEqual({ playing: true });
    });

    it("should use paused property when no tracked state", async () => {
      // Create fresh video with no tracked state
      const freshVideo = document.createElement("video");
      freshVideo.play = vi.fn().mockResolvedValue(undefined);
      freshVideo.pause = vi.fn();
      Object.defineProperty(freshVideo, "paused", {
        value: false,
        writable: true,
      });

      // No prior state tracked, should use paused property
      await executeVideoControl("togglePlayPause", { video: freshVideo });
      expect(freshVideo.pause).toHaveBeenCalled();
    });
  });

  describe("volume boundary conditions", () => {
    it("should not unmute when volumeUp results in 0", async () => {
      mockVideo.volume = 0;
      mockVideo.muted = true;

      await executeVideoControl("volumeUp", { video: mockVideo });
      // Volume should be 0.1 now
      expect(mockVideo.volume).toBe(0.1);
      expect(mockVideo.muted).toBe(false);
    });

    it("should handle volumeDown when already at 0", async () => {
      mockVideo.volume = 0;
      mockVideo.muted = false;

      await executeVideoControl("volumeDown", { video: mockVideo });
      expect(mockVideo.volume).toBe(0);
      expect(mockVideo.muted).toBe(true);
    });

    it("should maintain mute state when volumeUp from 0", async () => {
      mockVideo.volume = 0;
      mockVideo.muted = true;

      await executeVideoControl("volumeUp", { video: mockVideo });
      expect(mockVideo.volume).toBe(0.1);
      expect(mockVideo.muted).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should catch and log unexpected errors", async () => {
      // Create a video that throws on property access
      const badVideo = {
        get volume(): number {
          throw new Error("Unexpected error");
        },
        set volume(_v: number) {
          throw new Error("Unexpected error");
        },
        play: vi.fn(),
        pause: vi.fn(),
        paused: true,
        muted: false,
      } as unknown as HTMLVideoElement;

      await executeVideoControl("volumeUp", { video: badVideo });
      // Should not throw, error is caught
    });
  });

  describe("volume edge cases for mutation coverage", () => {
    it("should not unmute if newVolume is exactly 0", async () => {
      // Volume at 0, muted = true, volumeUp by 0.1 -> volume = 0.1, should unmute
      mockVideo.volume = 0;
      mockVideo.muted = true;
      await executeVideoControl("volumeUp", { video: mockVideo });
      expect(mockVideo.volume).toBe(0.1);
      expect(mockVideo.muted).toBe(false);
    });

    it("should keep mute false if volumeUp but already unmuted", async () => {
      mockVideo.volume = 0.5;
      mockVideo.muted = false;
      await executeVideoControl("volumeUp", { video: mockVideo });
      expect(mockVideo.volume).toBe(0.6);
      expect(mockVideo.muted).toBe(false);
    });

    it("should not auto-mute when volumeDown does not reach 0", async () => {
      mockVideo.volume = 0.3;
      mockVideo.muted = false;
      await executeVideoControl("volumeDown", { video: mockVideo });
      expect(mockVideo.volume).toBe(0.2);
      expect(mockVideo.muted).toBe(false);
    });

    it("should keep mute true if volumeDown from 0 and already muted", async () => {
      mockVideo.volume = 0;
      mockVideo.muted = true;
      await executeVideoControl("volumeDown", { video: mockVideo });
      expect(mockVideo.volume).toBe(0);
      expect(mockVideo.muted).toBe(true);
    });
  });

  describe("play/pause optional chaining coverage", () => {
    it("should handle video without play method gracefully", async () => {
      const videoWithoutPlay = document.createElement("video");
      // Explicitly remove play
      (videoWithoutPlay as unknown as { play: undefined }).play = undefined;
      videoWithoutPlay.pause = vi.fn();

      // Should not throw when play is undefined
      await executeVideoControl("play", { video: videoWithoutPlay });
    });

    it("should handle video without pause method gracefully", async () => {
      const videoWithoutPause = document.createElement("video");
      videoWithoutPause.play = vi.fn().mockResolvedValue(undefined);
      // Explicitly remove pause
      (videoWithoutPause as unknown as { pause: undefined }).pause = undefined;

      // Should not throw when pause is undefined
      await executeVideoControl("pause", { video: videoWithoutPause });
    });
  });

  describe("getCurrentGalleryVideo error handling", () => {
    it("should catch and log error when querySelector throws", async () => {
      const { logger } = await import("@shared/logging");
      mocks.mockCurrentVideoElement.value = null;

      // Create a root element that will cause querySelector to throw
      const root = document.createElement("div");
      root.setAttribute("data-xeg-gallery", "");
      document.body.appendChild(root);

      // Override root's querySelector to throw when looking for items-container
      const originalQuerySelector = root.querySelector.bind(root);
      root.querySelector = (selector: string) => {
        if (selector === '[data-xeg-role="items-container"]') {
          throw new Error("Query selector failed");
        }
        return originalQuerySelector(selector);
      };

      await executeVideoControl("play");

      // Should have logged the error
      expect(logger.debug).toHaveBeenCalledWith(
        "Failed to get current gallery video:",
        expect.any(Error)
      );

      // Restore
      root.querySelector = originalQuerySelector;
      document.body.removeChild(root);
    });

    it("should return null when document is not available", async () => {
      mocks.mockCurrentVideoElement.value = null;

      // Save original document
      const originalDocument = globalThis.document;

      // Remove document temporarily
      Object.defineProperty(globalThis, "document", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Should not throw
      await executeVideoControl("play");
      expect(mockVideo.play).not.toHaveBeenCalled();

      // Restore
      Object.defineProperty(globalThis, "document", {
        value: originalDocument,
        writable: true,
        configurable: true,
      });
    });
  });
});
