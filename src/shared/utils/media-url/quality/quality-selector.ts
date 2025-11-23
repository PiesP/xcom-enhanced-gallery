/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Quality selector utilities for media URLs.
 */

import { isNonEmptyString } from "@shared/utils/type-guards";

const DEFAULT_FORMAT = "jpg";
const SUPPORTED_QUALITIES = new Set(["large", "medium", "small"]);

function normaliseQuality(
  quality: "large" | "medium" | "small",
): "large" | "medium" | "small" {
  return SUPPORTED_QUALITIES.has(quality) ? quality : "large";
}

/**
 * Append Twitter quality parameters to a media URL.
 *
 * @param url - Raw media URL
 * @param desiredQuality - Preferred quality variant (defaults to `large`)
 */
export function getHighQualityMediaUrl(
  url: string,
  desiredQuality: "large" | "medium" | "small" = "large",
): string {
  if (!isNonEmptyString(url)) {
    return url || "";
  }

  const quality = normaliseQuality(desiredQuality);

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("name", quality);
    if (!parsed.searchParams.has("format")) {
      parsed.searchParams.set("format", DEFAULT_FORMAT);
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails (likely not a full URL), retain the original string.
    return url;
  }
}
