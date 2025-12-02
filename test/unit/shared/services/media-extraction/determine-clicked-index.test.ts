// Vitest globals provided by tsconfig "vitest/globals"; avoid importing runtime helpers from 'vitest'
import { determineClickedIndex } from '@shared/services/media-extraction/determine-clicked-index';
import * as mediaUtils from '@shared/media/media-utils';
import type { MediaInfo } from '@shared/types/media.types';

describe('determineClickedIndex', () => {
  beforeEach(() => {
    // Reset DOM for tests
    document.body.innerHTML = '';
  });

  it('matches direct IMG element by src', () => {
    const img = document.createElement('img');
    img.setAttribute('src', 'https://example.com/a.jpg');
    img.dataset.testid = 'target';
    document.body.appendChild(img);

    const index = determineClickedIndex(img, [
      { url: 'https://example.com/a.jpg' } as any,
      { url: 'https://example.com/b.jpg' } as any,
    ] as any);
    expect(index).toBe(0);
  });

  it('matches VIDEO poster attribute', () => {
    const v = document.createElement('video');
    v.setAttribute('poster', 'https://example.com/poster.png');
    document.body.appendChild(v);
    const index = determineClickedIndex(v, [
      { url: 'https://example.com/image.jpg', thumbnailUrl: 'https://example.com/poster.png' } as any,
    ] as any);
    expect(index).toBe(0);
  });

  it('finds descendant IMG when clicked element is inner element', () => {
    const container = document.createElement('div');
    const inner = document.createElement('span');
    const img = document.createElement('img');
    img.setAttribute('src', 'https://example.com/deep.jpg');
    container.appendChild(img);
    img.appendChild(inner);
    document.body.appendChild(container);

    const index = determineClickedIndex(inner, [
      { url: 'https://example.com/deep.jpg' } as any,
    ] as any);
    expect(index).toBe(0);
  });

  it('does not find deeply nested descendant beyond max depth', () => {
    // Build nested elements deeper than MAX_DESCENDANT_DEPTH
    let node: HTMLElement = document.createElement('div');
    const root = node;
    for (let i = 0; i < 10; i++) {
      const nxt = document.createElement('div');
      node.appendChild(nxt);
      node = nxt;
    }
    const img = document.createElement('img');
    img.setAttribute('src', 'https://example.com/deeper.jpg');
    node.appendChild(img);
    document.body.appendChild(root);

    // clickedElement is img's parent beyond max depth
    const index = determineClickedIndex(img.parentElement as HTMLElement, [
      { url: 'https://example.com/deeper.jpg' } as any,
    ] as any);
    // Should default to 0 because it's deeper than search depth
    expect(index).toBe(0);
  });

  it('returns 0 when no media element found', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const index = determineClickedIndex(div, [{ url: 'https://example.com/foo' } as any] as any);
    expect(index).toBe(0);
  });
});
// Duplicate imports removed: keep only the top-level imports and types
describe('determineClickedIndex', () => {
  it("should match when clicked element has extension and media item does not", () => {
    const clickedElement = document.createElement("img");
    clickedElement.src = "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg";

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        originalUrl:
          "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm?format=jpg&name=large",
        url: "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm?format=jpg&name=large",
        type: "image",
        mediaId: "gN2ZkhBKUOt9H1gm",
        index: 0,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(clickedElement, mediaItems);
    expect(index).toBe(0); // Should be 0 if it's the first item
  });

  it("should match when clicked element has extension and media item has different format query", () => {
    const clickedElement = document.createElement("img");
    clickedElement.src = "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg";

    // If the first item is NOT the match, and the second one IS.
    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        originalUrl: "https://pbs.twimg.com/media/other.jpg",
        url: "https://pbs.twimg.com/media/other.jpg",
        type: "image",
        mediaId: "other",
        index: 0,
      } as unknown as MediaInfo,
      {
        id: "2",
        originalUrl:
          "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm?format=jpg&name=large",
        url: "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm?format=jpg&name=large",
        type: "image",
        mediaId: "gN2ZkhBKUOt9H1gm",
        index: 1,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(clickedElement, mediaItems);
    expect(index).toBe(1);
  });

  it("should match video when clicked element is poster and media item has matching thumbnail", () => {
    const clickedElement = document.createElement("video");
    clickedElement.poster = "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg";

    const mediaItems: MediaInfo[] = [
      {
        id: "0",
        url: "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/other.jpg",
        type: "video",
        mediaId: "other",
        index: 0,
      } as unknown as MediaInfo,
      {
        id: "1",
        url: "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg",
        type: "video",
        mediaId: "12345",
        index: 1,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(clickedElement, mediaItems);
    expect(index).toBe(1);
  });

  it("should match nested video element when click originates from overlay", () => {
    const overlay = document.createElement("div");
    const overlayParent = document.createElement("div");
    overlayParent.appendChild(overlay);

    const videoWrapper = document.createElement("div");
    const innerWrapper = document.createElement("div");
    const video = document.createElement("video");
    video.poster = "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg?name=360x";
    innerWrapper.appendChild(video);
    videoWrapper.appendChild(innerWrapper);

    const root = document.createElement("div");
    root.appendChild(overlayParent);
    root.appendChild(videoWrapper);

    const mediaItems: MediaInfo[] = [
      {
        id: "0",
        url: "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/other.jpg",
        type: "video",
        mediaId: "other",
        index: 0,
      } as unknown as MediaInfo,
      {
        id: "1",
        url: "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg",
        type: "video",
        mediaId: "12345",
        index: 1,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(overlay, mediaItems);
    expect(index).toBe(1);
  });

  it("should match nested video element when overlay siblings are clicked", () => {
    const root = document.createElement("div");

    const overlayParent = document.createElement("div");
    const overlay = document.createElement("div");
    overlayParent.appendChild(overlay);

    const playerWrapper = document.createElement("div");
    const innerWrapper = document.createElement("div");
    const video = document.createElement("video");
    video.poster = "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg?name=small";
    innerWrapper.appendChild(video);
    playerWrapper.appendChild(innerWrapper);

    root.appendChild(overlayParent);
    root.appendChild(playerWrapper);

    const mediaItems: MediaInfo[] = [
      {
        id: "0",
        url: "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/other.jpg",
        type: "video",
        mediaId: "other",
        index: 0,
      } as unknown as MediaInfo,
      {
        id: "1",
        url: "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg",
        type: "video",
        mediaId: "12345",
        index: 1,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(overlay, mediaItems);
    expect(index).toBe(1);
  });

  it("should match video when shared ancestor is three levels above overlay", () => {
    const overlayLeaf = document.createElement("div");
    const overlayLevelOne = document.createElement("div");
    const overlayLevelTwo = document.createElement("div");

    overlayLevelOne.appendChild(overlayLeaf);
    overlayLevelTwo.appendChild(overlayLevelOne);

    const sharedAncestor = document.createElement("div");
    sharedAncestor.appendChild(overlayLevelTwo);

    const videoBranch = document.createElement("div");
    const videoWrapper = document.createElement("div");
    const video = document.createElement("video");
    video.poster = "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg?name=orig";
    videoWrapper.appendChild(video);
    videoBranch.appendChild(videoWrapper);

    sharedAncestor.appendChild(videoBranch);

    const root = document.createElement("div");
    root.appendChild(sharedAncestor);

    const mediaItems: MediaInfo[] = [
      {
        id: "0",
        url: "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/other.jpg",
        type: "video",
        mediaId: "other",
        index: 0,
      } as unknown as MediaInfo,
      {
        id: "1",
        url: "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg",
        type: "video",
        mediaId: "12345",
        index: 1,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(overlayLeaf, mediaItems);
    expect(index).toBe(1);
  });

  it("should match descendant video poster discovered via ancestor traversal", () => {
    const overlayButton = document.createElement("button");
    const overlayChrome = document.createElement("div");
    const overlayContainer = document.createElement("div");

    overlayChrome.appendChild(overlayButton);
    overlayContainer.appendChild(overlayChrome);

    const sharedAncestor = document.createElement("div");
    sharedAncestor.appendChild(overlayContainer);

    const videoZone = document.createElement("div");
    const chromeWrapper = document.createElement("div");
    const innerWrapper = document.createElement("div");
    const video = document.createElement("video");
    video.poster = "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg?name=360x";
    innerWrapper.appendChild(video);
    chromeWrapper.appendChild(innerWrapper);
    videoZone.appendChild(chromeWrapper);

    sharedAncestor.appendChild(videoZone);

    const root = document.createElement("div");
    root.appendChild(sharedAncestor);

    const mediaItems: MediaInfo[] = [
      {
        id: "0",
        url: "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/other/pu/vid/720x1280/other.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/other.jpg",
        type: "video",
        mediaId: "other",
        index: 0,
      } as unknown as MediaInfo,
      {
        id: "1",
        url: "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        originalUrl:
          "https://video.twimg.com/ext_tw_video/12345/pu/vid/720x1280/xyz.mp4",
        thumbnailUrl: "https://pbs.twimg.com/media/XPmxpCzp5kYAoPPj.jpg",
        type: "video",
        mediaId: "12345",
        index: 1,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(overlayButton, mediaItems);
    expect(index).toBe(1);
  });

  it("should find media when clicking on a wrapper element", () => {
    const wrapper = document.createElement("div");
    const img = document.createElement("img");
    img.src = "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg";
    wrapper.appendChild(img);

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        originalUrl: "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg",
        url: "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg",
        type: "image",
        mediaId: "gN2ZkhBKUOt9H1gm",
        index: 0,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(wrapper, mediaItems);
    expect(index).toBe(0);
  });

  it("should find media when clicking on a sibling of the media (within parent)", () => {
    const parent = document.createElement("div");
    const img = document.createElement("img");
    img.src = "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg";
    const overlay = document.createElement("div");
    parent.appendChild(img);
    parent.appendChild(overlay);

    const mediaItems: MediaInfo[] = [
      {
        id: "1",
        originalUrl: "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg",
        url: "https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg",
        type: "image",
        mediaId: "gN2ZkhBKUOt9H1gm",
        index: 0,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(overlay, mediaItems);
    expect(index).toBe(0);
  });

  it("should return 0 if no media found", () => {
    const div = document.createElement("div");
    const mediaItems: MediaInfo[] = [];
    const index = determineClickedIndex(div, mediaItems);
    expect(index).toBe(0);
  });

  it("should return 0 if clicked element has no src/poster", () => {
    const video = document.createElement('video');
    // No poster or src set intentionally
    const mediaItems: MediaInfo[] = [
      {
        id: '1',
        url: 'https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg',
        originalUrl: 'https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg',
        type: 'image',
        mediaId: 'gN2ZkhBKUOt9H1gm',
        index: 0,
      } as unknown as MediaInfo,
    ];

    const index = determineClickedIndex(video, mediaItems);
    expect(index).toBe(0);
  });

  it("should not find descendant deeper than MAX_DESCENDANT_DEPTH", () => {
    // Build a nested DOM deeper than MAX_DESCENDANT_DEPTH (6)
    let root = document.createElement('div');
    let current = root;
    for (let i = 0; i < 7; i++) { // depth 7 > maxDepth
      const child = document.createElement('div');
      current.appendChild(child);
      current = child;
    }

    const img = document.createElement('img');
    img.src = 'https://pbs.twimg.com/media/deep.jpg';
    current.appendChild(img);

    const mediaItems: MediaInfo[] = [
      {
        id: '1',
        url: 'https://pbs.twimg.com/media/deep.jpg',
        originalUrl: 'https://pbs.twimg.com/media/deep.jpg',
        type: 'image',
        mediaId: 'deep',
        index: 0,
      } as unknown as MediaInfo,
    ];

    // Click on root (ancestor) to attempt to find the deeply nested image
    const index = determineClickedIndex(root, mediaItems);
    expect(index).toBe(0);
  });

  it('should return 0 when normalizeMediaUrl returns null', () => {
    const clickedElement = document.createElement('img');
    clickedElement.src = 'https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm.jpg';

    const mediaItems: MediaInfo[] = [
      {
        id: '1',
        originalUrl:
          'https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm?format=jpg&name=large',
        url: 'https://pbs.twimg.com/media/gN2ZkhBKUOt9H1gm?format=jpg&name=large',
        type: 'image',
        mediaId: 'gN2ZkhBKUOt9H1gm',
        index: 0,
      } as unknown as MediaInfo,
    ];

    const spy = vi.spyOn(mediaUtils as any, 'normalizeMediaUrl');
    spy.mockReturnValueOnce(null);

    const index = determineClickedIndex(clickedElement, mediaItems);
    expect(index).toBe(0);

    spy.mockRestore();
  });
});
