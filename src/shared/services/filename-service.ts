/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview File Naming Service - Media filename generation and validation
 * @version 3.0.0 - Simplified
 */

import type { MediaInfo } from "@shared/types/media.types";
import { safeParseInt } from "@shared/utils/types/safety";
import { isHostMatching } from "@shared/utils/url/host";

export interface FilenameOptions {
  index?: string | number;
  extension?: string;
  fallbackPrefix?: string;
  fallbackUsername?: string;
}

export interface ZipFilenameOptions {
  fallbackPrefix?: string;
}

export class FilenameService {
  private static instance: FilenameService;

  public static getInstance(): FilenameService {
    if (!FilenameService.instance) {
      FilenameService.instance = new FilenameService();
    }
    return FilenameService.instance;
  }

  generateMediaFilename(
    media: MediaInfo,
    options: FilenameOptions = {},
  ): string {
    try {
      if (media.filename && media.filename.length > 0) {
        return this.sanitize(media.filename);
      }

      const extension = options.extension ?? this.getExtension(media.url);
      const index =
        this.getIndex(media.id) ?? this.normalizeIndex(options.index);
      const { username, tweetId } = this.resolveMetadata(
        media,
        options.fallbackUsername,
      );

      if (username && tweetId) {
        return this.sanitize(`${username}_${tweetId}_${index}.${extension}`);
      }

      if (tweetId && /^\d+$/.test(tweetId)) {
        return this.sanitize(`tweet_${tweetId}_${index}.${extension}`);
      }

      const prefix = options.fallbackPrefix ?? "media";
      return this.sanitize(`${prefix}_${Date.now()}_${index}.${extension}`);
    } catch {
      return `media_${Date.now()}.${options.extension || "jpg"}`;
    }
  }

  generateZipFilename(
    mediaItems: readonly MediaInfo[],
    options: ZipFilenameOptions = {},
  ): string {
    try {
      const firstItem = mediaItems[0];
      if (firstItem) {
        const { username, tweetId } = this.resolveMetadata(firstItem);
        if (username && tweetId) {
          return this.sanitize(`${username}_${tweetId}.zip`);
        }
      }

      const prefix = options.fallbackPrefix ?? "xcom_gallery";
      return this.sanitize(`${prefix}_${Date.now()}.zip`);
    } catch {
      return `download_${Date.now()}.zip`;
    }
  }

  isValidMediaFilename(filename: string): boolean {
    return filename.length > 0 && !/[<>:"/\\|?*]/.test(filename);
  }

  isValidZipFilename(filename: string): boolean {
    return filename.endsWith(".zip") && !/[<>:"/\\|?*]/.test(filename);
  }

  private resolveMetadata(
    media: MediaInfo,
    fallbackUsername?: string | null,
  ): { username: string | null; tweetId: string | null } {
    let username: string | null = null;
    let tweetId: string | null = null;

    if (
      media.sourceLocation === "quoted" &&
      media.quotedUsername &&
      media.quotedTweetId
    ) {
      username = media.quotedUsername;
      tweetId = media.quotedTweetId;
    } else {
      tweetId = media.tweetId ?? null;
      if (media.tweetUsername && media.tweetUsername !== "unknown") {
        username = media.tweetUsername;
      } else {
        const url =
          ("originalUrl" in media ? media.originalUrl : null) || media.url;
        if (typeof url === "string") {
          username = this.extractUsernameFromUrl(url);
        }
      }
    }

    if (!username && fallbackUsername) {
      username = fallbackUsername;
    }

    return { username, tweetId };
  }

  private getIndex(mediaId?: string): string | null {
    if (!mediaId) return null;
    const match = mediaId.match(/_media_(\d+)$/) || mediaId.match(/_(\d+)$/);
    if (match) {
      const idx = safeParseInt(match[1], 10);
      if (!Number.isNaN(idx)) {
        return mediaId.includes("_media_")
          ? (idx + 1).toString()
          : (match[1] ?? null);
      }
    }
    return null;
  }

  private getExtension(url: string): string {
    try {
      const path = url.split("?")[0];
      if (!path) return "jpg";
      const ext = path.split(".").pop();
      if (ext && /^(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(ext)) {
        return ext.toLowerCase();
      }
    } catch {
      // ignore
    }
    return "jpg";
  }

  private normalizeIndex(index?: string | number): string {
    if (index === undefined || index === null) return "1";
    const num = typeof index === "string" ? safeParseInt(index, 10) : index;
    return isNaN(num) || num < 1 ? "1" : num.toString();
  }

  private sanitize(name: string): string {
    if (!name) return "media";
    return name
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/^[\s.]+|[\s.]+$/g, "")
      .slice(0, 255);
  }

  private extractUsernameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);

      // Security Fix: Use strict host matching to prevent subdomain spoofing
      // Replaces insecure .includes() checks that allowed arbitrary hosts (e.g. evil-x.com)
      if (
        !isHostMatching(urlObj, ["twitter.com", "x.com"], {
          allowSubdomains: true,
        })
      ) {
        return null;
      }

      const path = urlObj.pathname.split("/")[1];
      if (
        !path ||
        [
          "home",
          "explore",
          "notifications",
          "messages",
          "search",
          "settings",
        ].includes(path.toLowerCase())
      ) {
        return null;
      }
      return /^[a-zA-Z0-9_]{1,15}$/.test(path) ? path : null;
    } catch {
      return null;
    }
  }
}

const shared = FilenameService.getInstance();

export function generateMediaFilename(
  media: MediaInfo,
  options?: FilenameOptions,
): string {
  return shared.generateMediaFilename(media, options);
}

export function generateZipFilename(
  mediaItems: readonly MediaInfo[],
  options?: ZipFilenameOptions,
): string {
  return shared.generateZipFilename(mediaItems, options);
}

export function isValidMediaFilename(filename: string): boolean {
  return shared.isValidMediaFilename(filename);
}

export function isValidZipFilename(filename: string): boolean {
  return shared.isValidZipFilename(filename);
}
