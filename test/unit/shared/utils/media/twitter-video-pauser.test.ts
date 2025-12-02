import { CSS } from "@/constants";
import { pauseActiveTwitterVideos } from "@shared/utils/media/twitter-video-pauser";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createTimelineVideo({
  playing = false,
}: { playing?: boolean } = {}): HTMLVideoElement {
  const tweet = document.createElement("article");
  tweet.setAttribute("data-testid", "tweet");
  const container = document.createElement("div");
  container.setAttribute("data-testid", "videoPlayer");
  const video = document.createElement("video");

  container.appendChild(video);
  tweet.appendChild(container);
  document.body.appendChild(tweet);

  if (playing) {
    markVideoAsPlaying(video);
  }

  return video;
}

function createGalleryVideo(): HTMLVideoElement {
  const gallery = document.createElement("div");
  gallery.classList.add(CSS.CLASSES.CONTAINER);
  const video = document.createElement("video");
  gallery.appendChild(video);
  document.body.appendChild(gallery);

  markVideoAsPlaying(video);
  return video;
}

function markVideoAsPlaying(video: HTMLVideoElement): void {
  Object.defineProperty(video, "paused", {
    configurable: true,
    get: () => false,
  });
  Object.defineProperty(video, "ended", {
    configurable: true,
    get: () => false,
  });
  video.pause = vi.fn(() => {
    Object.defineProperty(video, "paused", {
      configurable: true,
      get: () => true,
    });
  });
}

describe("pauseActiveTwitterVideos", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("pauses only the playing videos in Twitter timelines", () => {
    const videoA = createTimelineVideo({ playing: true });
    const videoB = createTimelineVideo({ playing: true });
    createTimelineVideo({ playing: false });

    const result = pauseActiveTwitterVideos();

    expect(result.pausedCount).toBe(2);
    expect(result.totalCandidates).toBe(2);
    expect(result.skippedCount).toBeGreaterThanOrEqual(1);
    expect(videoA.pause).toHaveBeenCalledTimes(1);
    expect(videoB.pause).toHaveBeenCalledTimes(1);
  });

  it("ignores gallery-owned videos even when playing", () => {
    const timelineVideo = createTimelineVideo({ playing: true });
    const galleryVideo = createGalleryVideo();

    const result = pauseActiveTwitterVideos();

    expect(result.pausedCount).toBe(1);
    expect(result.totalCandidates).toBe(1);
    expect(result.skippedCount).toBeGreaterThanOrEqual(1);
    expect(timelineVideo.pause).toHaveBeenCalledTimes(1);
    expect(galleryVideo.pause).toBeDefined();
    expect(galleryVideo.pause).not.toHaveBeenCalled();
  });

  it("returns zero result when DOM root is unavailable", () => {
    const result = pauseActiveTwitterVideos({ root: null });
    expect(result).toEqual({
      pausedCount: 0,
      totalCandidates: 0,
      skippedCount: 0,
    });
  });

  it("returns zero result when no videos are found", () => {
    const result = pauseActiveTwitterVideos();
    expect(result).toEqual({
      pausedCount: 0,
      totalCandidates: 0,
      skippedCount: 0,
    });
  });

  it("skips disconnected videos", () => {
    const video = createTimelineVideo({ playing: true });
    video.remove(); // Disconnect from DOM

    // We need to pass document as root explicitly or ensure querySelectorAll finds it?
    // querySelectorAll won't find disconnected nodes.
    // So we might need to pass a root that contains it, or mock querySelectorAll.
    // Actually, if it's not in the DOM, document.querySelectorAll won't find it.
    // But if we pass a fragment or a detached element as root, we can test this.

    const container = document.createElement("div");
    container.appendChild(video);
    // container is not attached to document

    const result = pauseActiveTwitterVideos({ root: container });
    // video.isConnected should be false

    expect(result.skippedCount).toBe(1);
    expect(result.pausedCount).toBe(0);
  });

  it("handles errors during pause", () => {
    const video = createTimelineVideo({ playing: true });
    video.pause = vi.fn(() => {
      throw new Error("Pause failed");
    });

    const result = pauseActiveTwitterVideos();

    expect(result.pausedCount).toBe(0);
    expect(result.skippedCount).toBeGreaterThanOrEqual(1);
  });

  it("handles errors when checking if video is playing", () => {
    const video = createTimelineVideo({ playing: true });
    Object.defineProperty(video, "paused", {
      get: () => {
        throw new Error("Access denied");
      },
    });

    const result = pauseActiveTwitterVideos();
    // Should be skipped
    expect(result.pausedCount).toBe(0);
  });
});
