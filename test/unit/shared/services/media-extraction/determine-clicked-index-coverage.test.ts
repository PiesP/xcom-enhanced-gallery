import { logger } from "@/shared/logging";
import { determineClickedIndex } from "@/shared/services/media-extraction/determine-clicked-index";
import type { MediaInfo } from "@shared/types/media.types";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/logging", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("determineClickedIndex Coverage", () => {
  it("should return 0 and warn when clicked element URL does not match any media item", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/nomatch.jpg";

    const mediaItems = [
      { id: "1", url: "https://example.com/other.jpg", type: "image" as const },
    ];

    const index = determineClickedIndex(img, mediaItems);

    expect(index).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No matching media found"),
    );
  });

  it("should handle errors gracefully and return 0", () => {
    // Pass null to trigger error in findMediaElement (accessing property of null)
    // @ts-expect-error - Testing error handling
    const index = determineClickedIndex(null, []);

    expect(index).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Error calculating clicked index"),
      expect.anything(),
    );
  });

  it("should find media in ancestor siblings (depth check)", () => {
    // Structure:
    // div (grandparent)
    //   div (parent)
    //     img (target media)
    //     div (sibling)
    //       span (clicked element)

    const grandparent = document.createElement("div");
    const parent = document.createElement("div");
    const img = document.createElement("img");
    img.src = "https://example.com/target.jpg";
    const sibling = document.createElement("div");
    const clicked = document.createElement("span");

    sibling.appendChild(clicked);
    parent.appendChild(img);
    parent.appendChild(sibling);
    grandparent.appendChild(parent);

    const mediaItems = [
      {
        id: "1",
        url: "https://example.com/target.jpg",
        type: "image" as const,
      },
    ];

    // Clicked is inside sibling, so parent is 'sibling', parent.parent is 'parent'.
    // 'parent' has 'img' as child.
    // findMediaElement logic:
    // 1. clicked (span) -> no
    // 2. clicked.querySelector -> no
    // 3. loop:
    //    i=0: current = sibling. sibling.querySelector(":scope > img") -> no
    //    i=1: current = parent. parent.querySelector(":scope > img") -> yes!

    const index = determineClickedIndex(clicked, mediaItems);

    expect(index).toBe(0);
  });

  it("should find media at index 1 via ancestor traversal", () => {
    const parent = document.createElement("div");
    const img = document.createElement("img");
    img.src = "https://example.com/target.jpg";
    const clicked = document.createElement("span");

    parent.appendChild(img);
    parent.appendChild(clicked);

    const mediaItems = [
      { id: "1", url: "https://example.com/other.jpg", type: "image" as const },
      {
        id: "2",
        url: "https://example.com/target.jpg",
        type: "image" as const,
      },
    ];

    const index = determineClickedIndex(clicked, mediaItems);

    expect(index).toBe(1);
  });

  it("should skip null media items in findIndex", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/target.jpg";

    const mediaItems = [
      null,
      { id: "2", url: "https://example.com/target.jpg", type: "image" as const },
    ] as unknown as MediaInfo[];

    const index = determineClickedIndex(img, mediaItems);
    expect(index).toBe(1);
  });

  it("should match using originalUrl when url is empty", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/target.jpg";

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        url: "",
        originalUrl: "https://example.com/target.jpg",
        type: "image" as const,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(img, mediaItems);
    expect(index).toBe(0);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining("Matched clicked media at index"),
    );
  });

  it("should return 0 when element is a non-media element with no media children or ancestors", () => {
    const div = document.createElement("div");
    const span = document.createElement("span");
    div.appendChild(span);

    const mediaItems: MediaInfo[] = [
      { id: "1", url: "https://example.com/test.jpg", type: "image" as const } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(span, mediaItems);
    expect(index).toBe(0);
  });

  it("should handle video element with src attribute", () => {
    const video = document.createElement("video");
    video.src = "https://example.com/video.mp4";

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        url: "https://example.com/video.mp4",
        type: "video" as const,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(video, mediaItems);
    expect(index).toBe(0);
  });

  it("should handle deeply nested video beyond MAX_DESCENDANT_DEPTH", () => {
    // MAX_DESCENDANT_DEPTH = 6, so create depth of 7+
    const root = document.createElement("div");
    let current = root;
    for (let i = 0; i < 8; i++) {
      const child = document.createElement("div");
      current.appendChild(child);
      current = child;
    }
    const video = document.createElement("video");
    video.poster = "https://example.com/thumb.jpg";
    current.appendChild(video);

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        url: "https://example.com/video.mp4",
        thumbnailUrl: "https://example.com/thumb.jpg",
        type: "video" as const,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(root, mediaItems);
    // Should return 0 as video is too deeply nested
    expect(index).toBe(0);
  });

  it("should handle ancestor traversal hitting MAX_ANCESTOR_HOPS limit", () => {
    // MAX_ANCESTOR_HOPS = 3
    const root = document.createElement("div");
    const level1 = document.createElement("div");
    const level2 = document.createElement("div");
    const level3 = document.createElement("div");
    const level4 = document.createElement("div");
    const clickTarget = document.createElement("span");

    root.appendChild(level1);
    level1.appendChild(level2);
    level2.appendChild(level3);
    level3.appendChild(level4);
    level4.appendChild(clickTarget);

    // Put image in root (more than 3 levels up)
    const img = document.createElement("img");
    img.src = "https://example.com/target.jpg";
    root.appendChild(img);

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        url: "https://example.com/target.jpg",
        type: "image" as const,
      } as unknown as MediaInfo,
    ];

    // clickTarget is 4 levels deep from root, but MAX_ANCESTOR_HOPS is 3
    const index = determineClickedIndex(clickTarget, mediaItems);
    // Should return 0 because we can't find media within 3 ancestor hops
    expect(index).toBe(0);
  });

  it("should break ancestor loop when parentElement is null", () => {
    // Create a detached element
    const div = document.createElement("div");
    const span = document.createElement("span");
    div.appendChild(span);
    // div has no parent

    const mediaItems: MediaInfo[] = [
      { id: "1", url: "https://example.com/test.jpg", type: "image" as const } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(span, mediaItems);
    expect(index).toBe(0);
  });

  it("should handle queue exhaustion in findMediaDescendant", () => {
    // Create a tree where queue will be exhausted without finding media
    const root = document.createElement("div");
    for (let i = 0; i < 5; i++) {
      const child = document.createElement("span");
      root.appendChild(child);
    }

    const mediaItems: MediaInfo[] = [
      { id: "1", url: "https://example.com/test.jpg", type: "image" as const } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(root, mediaItems);
    expect(index).toBe(0);
  });

  it("should handle non-HTMLElement children gracefully", () => {
    const root = document.createElement("div");
    // Add a text node (not HTMLElement)
    root.appendChild(document.createTextNode("Hello"));
    const img = document.createElement("img");
    img.src = "https://example.com/target.jpg";
    root.appendChild(img);

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        url: "https://example.com/target.jpg",
        type: "image" as const,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(root, mediaItems);
    expect(index).toBe(0);
  });

  it("should handle empty mediaItems array", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/target.jpg";

    const mediaItems: MediaInfo[] = [];

    const index = determineClickedIndex(img, mediaItems);
    expect(index).toBe(0);
  });
});
