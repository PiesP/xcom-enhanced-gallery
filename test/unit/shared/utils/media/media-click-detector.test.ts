import { isVideoControlElement } from "@shared/dom/utils";
import { gallerySignals } from "@shared/state/signals/gallery.signals";
import {
  extractImageUrl,
  extractVideoUrl,
  isProcessableMedia,
  isValidMediaSource,
  shouldBlockMediaTrigger,
} from "@shared/utils/media/media-click-detector";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@shared/state/signals/gallery.signals", () => ({
  gallerySignals: {
    isOpen: { value: false },
  },
}));

vi.mock("@shared/dom/utils", () => ({
  isVideoControlElement: vi.fn(),
}));

const mockedGallerySignals = gallerySignals as unknown as {
  isOpen: { value: boolean };
};

describe("media-click-detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isVideoControlElement as Mock).mockReturnValue(false);
    mockedGallerySignals.isOpen.value = false;
  });

  describe("isValidMediaSource", () => {
    it("returns true for Twitter CDN media URLs", () => {
      expect(isValidMediaSource("https://pbs.twimg.com/media/test.jpg")).toBe(true);
    });

    it("returns true for blob URLs", () => {
      expect(isValidMediaSource("blob:https://x.com/uuid")).toBe(true);
    });

    it("returns false for empty or invalid URLs", () => {
      expect(isValidMediaSource(" ")).toBe(false);
      expect(isValidMediaSource("https://example.com/media.jpg")).toBe(false);
    });
  });

  describe("extractImageUrl", () => {
    it("returns src when available", () => {
      const img = document.createElement("img");
      img.src = "https://pbs.twimg.com/media/test.jpg";

      expect(extractImageUrl(img)).toBe("https://pbs.twimg.com/media/test.jpg");
    });

    it("falls back to currentSrc", () => {
      const img = document.createElement("img");
      Object.defineProperty(img, "currentSrc", {
        value: "https://pbs.twimg.com/media/fallback.jpg",
        configurable: true,
      });

      expect(extractImageUrl(img)).toBe("https://pbs.twimg.com/media/fallback.jpg");
    });
  });

  describe("extractVideoUrl", () => {
    it("returns src when available", () => {
      const video = document.createElement("video");
      video.src = "https://video.twimg.com/media/test.mp4";

      expect(extractVideoUrl(video)).toBe("https://video.twimg.com/media/test.mp4");
    });

    it("falls back to currentSrc", () => {
      const video = document.createElement("video");
      Object.defineProperty(video, "currentSrc", {
        value: "https://video.twimg.com/media/fallback.mp4",
        configurable: true,
      });

      expect(extractVideoUrl(video)).toBe("https://video.twimg.com/media/fallback.mp4");
    });
  });

  describe("isProcessableMedia", () => {
    it("returns false when target is null", () => {
      expect(isProcessableMedia(null)).toBe(false);
    });

    it("returns false when gallery is already open", () => {
      mockedGallerySignals.isOpen.value = true;
      const img = document.createElement("img");
      img.src = "https://pbs.twimg.com/media/test.jpg";

      expect(isProcessableMedia(img)).toBe(false);
    });

    it("returns false when blocked by interactive container", () => {
      const button = document.createElement("button");
      expect(isProcessableMedia(button)).toBe(false);
    });

    it("returns true for direct Twitter image elements", () => {
      const img = document.createElement("img");
      img.src = "https://pbs.twimg.com/media/test.jpg";

      expect(isProcessableMedia(img)).toBe(true);
    });

    it("returns true when inside tweet photo container", () => {
      const container = document.createElement("div");
      container.setAttribute("data-testid", "tweetPhoto");
      const inner = document.createElement("div");
      container.appendChild(inner);

      expect(isProcessableMedia(inner)).toBe(true);
    });

    it("returns true when inside video player container", () => {
      const container = document.createElement("div");
      container.setAttribute("data-testid", "videoPlayer");
      const inner = document.createElement("div");
      container.appendChild(inner);

      expect(isProcessableMedia(inner)).toBe(true);
    });

    it("returns false inside tweet article but outside media containers", () => {
      const tweet = document.createElement("article");
      tweet.setAttribute("data-testid", "tweet");
      const nonMediaDiv = document.createElement("div");
      tweet.appendChild(nonMediaDiv);
      document.body.appendChild(tweet);

      expect(isProcessableMedia(nonMediaDiv)).toBe(false);

      document.body.removeChild(tweet);
    });

    it("returns false when element has no recognizable context", () => {
      const randomDiv = document.createElement("div");
      expect(isProcessableMedia(randomDiv)).toBe(false);
    });
  });

  describe("shouldBlockMediaTrigger", () => {
    it("blocks video control elements", () => {
      (isVideoControlElement as Mock).mockReturnValue(true);
      const element = document.createElement("div");

      expect(shouldBlockMediaTrigger(element)).toBe(true);
    });

    it("blocks basic interactive buttons", () => {
      const button = document.createElement("button");
      expect(shouldBlockMediaTrigger(button)).toBe(true);
    });

    it("does not block media status links", () => {
      const link = document.createElement("a");
      link.href = "https://x.com/user/status/123/photo/1";

      expect(shouldBlockMediaTrigger(link)).toBe(false);
    });

    it("does not block interactive elements wrapping tweet photos", () => {
      const button = document.createElement("button");
      const photo = document.createElement("div");
      photo.setAttribute("data-testid", "tweetPhoto");
      button.appendChild(photo);

      expect(shouldBlockMediaTrigger(button)).toBe(false);
    });

    it("does not block interactive elements wrapping video players", () => {
      const button = document.createElement("button");
      const videoContainer = document.createElement("div");
      videoContainer.setAttribute("data-testid", "videoPlayer");
      button.appendChild(videoContainer);

      expect(shouldBlockMediaTrigger(button)).toBe(false);
    });

    it("returns false when target is null", () => {
      expect(shouldBlockMediaTrigger(null)).toBe(false);
    });

    it("blocks gallery overlay elements", () => {
      const overlay = document.createElement("div");
      overlay.className = "xeg-gallery-overlay";

      expect(shouldBlockMediaTrigger(overlay)).toBe(true);
    });

    it("blocks nodes within gallery root", () => {
      const root = document.createElement("div");
      root.className = "xeg-gallery-root";
      const inner = document.createElement("div");
      root.appendChild(inner);
      document.body.appendChild(root);

      expect(shouldBlockMediaTrigger(inner)).toBe(true);

      document.body.removeChild(root);
    });

    it.each(["like", "retweet", "reply", "share", "bookmark"])(
      "blocks %s action buttons",
      (testId) => {
        const button = document.createElement("button");
        button.setAttribute("data-testid", testId);

        expect(shouldBlockMediaTrigger(button)).toBe(true);
      },
    );

    it("blocks generic role=button elements", () => {
      const roleButton = document.createElement("div");
      roleButton.setAttribute("role", "button");

      expect(shouldBlockMediaTrigger(roleButton)).toBe(true);
    });
  });
});
