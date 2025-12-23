/**
 * @fileoverview Type definitions
 */

import type { MEDIA } from '@constants/media';
import type { SERVICE_KEYS } from '@constants/service-keys';
import type { VIEW_MODES } from '@constants/video-controls';

type MediaType = (typeof MEDIA.TYPES)[keyof typeof MEDIA.TYPES];
type MediaQuality = (typeof MEDIA.QUALITY)[keyof typeof MEDIA.QUALITY];
type FileExtension = (typeof MEDIA.EXTENSIONS)[keyof typeof MEDIA.EXTENSIONS];
type AppServiceKey = (typeof SERVICE_KEYS)[keyof typeof SERVICE_KEYS];
export type ViewMode = (typeof VIEW_MODES)[number];
