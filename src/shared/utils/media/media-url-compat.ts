/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility (Legacy Barrel)
 *
 * Phase 351: Backward Compatibility Layer
 *
 * @deprecated This file is maintained for backward compatibility.
 * New code should import directly from '@shared/utils/media-url'.
 *
 * @example
 * // ❌ Old (deprecated)
 * import { getMediaUrlsFromTweet } from '@shared/utils/media/media-url.util';
 *
 * // ✅ New (recommended)
 * import { classifyMediaUrl } from '@shared/utils/media-url';
 */

// Re-export from new modular structure
export * from '../media-url';

// Legacy type re-export
export type { FilenameOptions } from '../media-url/types';

// Note: getMediaUrlsFromTweet and createMediaInfo* functions
// remain in media-url.util.ts for now (will be migrated in future phase)
export { getMediaUrlsFromTweet } from './media-url.util';
