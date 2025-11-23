/**
 * @fileoverview Type definitions
 */

import type { MEDIA } from "./media";
import type { SERVICE_KEYS } from "./service-keys";
import type { VIEW_MODES } from "./video-controls";

export type MediaType = (typeof MEDIA.TYPES)[keyof typeof MEDIA.TYPES];
export type MediaQuality = (typeof MEDIA.QUALITY)[keyof typeof MEDIA.QUALITY];
export type FileExtension =
  (typeof MEDIA.EXTENSIONS)[keyof typeof MEDIA.EXTENSIONS];
export type AppServiceKey = (typeof SERVICE_KEYS)[keyof typeof SERVICE_KEYS];
export type ViewMode = (typeof VIEW_MODES)[number];
