/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview VerticalImageItem Helper Utilities
 * @description Helper functions for media detection and filename processing
 * @module features/gallery/components/vertical-gallery-view/VerticalImageItem.helpers
 *
 * **Functions**:
 * - {@link cleanFilename} - Sanitize and normalize filenames
 * - {@link isVideoMedia} - Detect video media by extension and hostname
 *
 * @version 1.1.0 - Enhanced documentation and security (Phase 354+)
 */

import type { MediaInfo } from "@shared/types/media.types";

/**
 * Video file extensions recognized by this application
 * @internal
 */
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi"] as const;

/**
 * Clean and normalize a filename for display and saving
 *
 * **Processing**:
 * 1. Removes Twitter media prefixes (twitter_media_YYYYMMDDThhmmss_*)
 * 2. Removes /media/ prefix if present
 * 3. Removes relative path prefix (./)
 * 4. Replaces path separators with underscores
 * 5. Truncates long filenames (>40 chars) to last valid component
 * 6. Falls back to "Image" if filename becomes empty
 *
 * **Examples**:
 * - `twitter_media_20240101T120000_12345.jpg` → filename without prefix
 * - `/media/photo.png` → `photo.png`
 * - `very-long-folder-structure-with-many-segments/final.jpg` → `final.jpg`
 * - `""` or undefined → `"Untitled"`
 *
 * @param filename - Original filename to clean (optional, defaults to "Untitled")
 * @returns Cleaned filename suitable for display and file saving
 *
 * @example
 * cleanFilename('twitter_media_20240115T143022_987654321.jpg')
 * // Returns something like 'image-123.jpg'
 *
 * cleanFilename('/media/path/to/photo.png')
 * // Returns 'photo.png'
 *
 * cleanFilename(undefined)
 * // Returns 'Untitled'
 */
export function cleanFilename(filename?: string): string {
  if (!filename) {
    return "Untitled";
  }

  let cleaned = filename
    .replace(/^twitter_media_\d{8}T\d{6}_\d+\./, "")
    .replace(/^\/media\//, "")
    .replace(/^\.\//g, "")
    .replace(/[\\/]/g, "_");

  if (cleaned.length > 40 || !cleaned) {
    const match = filename.match(/([a-zA-Z0-9_-]+)$/);
    cleaned = match?.[1] ?? "Image";
  }

  return cleaned;
}

/**
 * Detect if media is a video based on file extension and hostname
 *
 * **Detection Strategy**:
 * 1. Check if URL contains known video extensions (.mp4, .webm, .mov, .avi)
 * 2. Check if filename ends with video extension
 * 3. Validate URL hostname if video.twimg.com (Twitter video host)
 * 4. Fall back to false if URL parsing fails (relative paths, data: URLs)
 *
 * **Security**:
 * - Validates URL structure with URL constructor before accessing hostname
 * - Gracefully handles parsing errors (relative paths, invalid URLs)
 * - Checks extension before hostname to avoid unnecessary URL parsing
 *
 * @param media - MediaInfo object containing url and filename
 * @returns true if media is detected as video, false otherwise
 *
 * @example
 * isVideoMedia({ url: 'https://video.twimg.com/video.mp4', filename: 'clip.mp4' })
 * // Returns true
 *
 * isVideoMedia({ url: 'https://pbs.twimg.com/image.jpg', filename: 'photo.jpg' })
 * // Returns false
 *
 * isVideoMedia({ url: 'relative/path/video.webm', filename: undefined })
 * // Returns true (from extension check)
 */
export function isVideoMedia(media: MediaInfo): boolean {
  const urlLowerCase = media.url.toLowerCase();

  // Check URL for video extensions
  if (VIDEO_EXTENSIONS.some((ext) => urlLowerCase.includes(ext))) {
    return true;
  }

  // Check filename for video extensions
  if (media.filename) {
    const filenameLowerCase = media.filename.toLowerCase();
    if (VIDEO_EXTENSIONS.some((ext) => filenameLowerCase.endsWith(ext))) {
      return true;
    }
  }

  // Validate URL hostname (security check)
  // URL parsing can fail for relative paths, data: URLs, etc.
  try {
    const url = new URL(media.url);
    return url.hostname === "video.twimg.com";
  } catch {
    // URL parsing failed (relative path, data: URL, malformed URL, etc.)
    // Already checked extensions above, so false is correct here
    return false;
  }
}
