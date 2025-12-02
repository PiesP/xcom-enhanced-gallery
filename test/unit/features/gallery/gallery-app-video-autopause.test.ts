import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MediaInfo } from "@shared/types/media.types";
import { GalleryApp } from "@features/gallery/GalleryApp";
import { pauseActiveTwitterVideos } from "@shared/utils/media/twitter-video-pauser";
import { openGallery } from "@shared/state/signals/gallery.signals";

const mediaServiceFactory = vi.hoisted(() => ({
  create: () => undefined as unknown,
}));

vi.mock("@shared/logging", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@shared/utils/media/twitter-video-pauser", () => ({
  pauseActiveTwitterVideos: vi.fn(() => ({
    pausedCount: 0,
    totalCandidates: 0,
    skippedCount: 0,
  })),
}));

vi.mock("@shared/services/notification-service", () => ({
  NotificationService: {
    getInstance: vi.fn(() => ({
      error: vi.fn(() => Promise.resolve()),
    })),
  },
}));

vi.mock("@shared/external/userscript", () => ({
  isGMAPIAvailable: vi.fn(() => true),
}));

vi.mock("@shared/services/media-service", () => {
  class MediaService {}
  mediaServiceFactory.create = () => new MediaService();
  return { MediaService };
});

vi.mock("@shared/container/service-accessors", () => ({
  getGalleryRenderer: vi.fn(() => ({
    setOnCloseCallback: vi.fn(),
  })),
  getMediaServiceFromContainer: vi.fn(() => mediaServiceFactory.create()),
}));

vi.mock("@shared/state/signals/gallery.signals", () => ({
  gallerySignals: {
    isOpen: { value: false },
    mediaItems: { value: [] },
    currentIndex: { value: 0 },
    isLoading: { value: false },
    error: { value: null },
    viewMode: { value: "vertical" },
  },
  openGallery: vi.fn(),
  closeGallery: vi.fn(),
}));

describe("GalleryApp ambient video auto-pause integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pauses ambient Twitter videos before opening the gallery", async () => {
    const app = new GalleryApp();
    Reflect.set(app, "isInitialized", true);

    const mediaItems: MediaInfo[] = [
      {
        id: "media_1",
        url: "https://pbs.twimg.com/media/sample.jpg",
        type: "image",
      },
    ];

    await app.openGallery(mediaItems, 0);

    expect(pauseActiveTwitterVideos).toHaveBeenCalledTimes(1);
    expect(openGallery).toHaveBeenCalledWith(mediaItems, 0);
  });
});
