/**
 * @fileoverview Media-related constants
 */

export const MEDIA = {
  DOMAINS: ["pbs.twimg.com", "video.twimg.com", "abs.twimg.com"],
  TYPES: {
    IMAGE: "image",
    VIDEO: "video",
    GIF: "gif",
  },
  EXTENSIONS: {
    JPEG: "jpg",
    PNG: "png",
    WEBP: "webp",
    GIF: "gif",
    MP4: "mp4",
    ZIP: "zip",
  },
  /** Media quality options */
  QUALITY: {
    ORIGINAL: "orig",
    LARGE: "large",
    MEDIUM: "medium",
    SMALL: "small",
  },
} as const;
