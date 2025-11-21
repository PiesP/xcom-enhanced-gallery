/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Media URL Utility Types
 */
/**
 * Result returned by media URL classification helpers.
 */
export interface MediaTypeResult {
  type: 'image' | 'video' | 'gif' | 'emoji' | 'video-thumbnail' | 'unknown';
  shouldInclude: boolean;
  reason?: string;
  hostname?: string;
}
