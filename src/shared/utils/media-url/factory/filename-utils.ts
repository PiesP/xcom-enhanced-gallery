/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Filename Utilities
 *
 * Phase 351.7: Factory Layer - Filename processing utilities
 */

/**
 * Safely clean filename (remove extension duplicates, handle special characters)
 *
 * Normalizes filenames by:
 * - Trimming whitespace
 * - Removing extension if present
 * - Replacing filesystem-unsafe characters with underscores
 * - Limiting length to filesystem limits
 *
 * @param filename - Original filename to clean
 * @returns Cleaned and normalized filename
 *
 * @example
 * cleanFilename('  media.jpg  ') // 'media'
 * cleanFilename('user<name>.jpg') // 'user_name_'
 * cleanFilename('') // 'media'
 */
export function cleanFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'media';
  }

  // Basic cleanup: trim whitespace
  let cleaned = filename.trim();

  // Remove extension if present (image/video formats)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const allExtensions = [...imageExtensions, ...videoExtensions];

  for (const ext of allExtensions) {
    if (cleaned.toLowerCase().endsWith(ext)) {
      cleaned = cleaned.slice(0, -ext.length);
      break;
    }
  }

  // Return default if filename is empty
  if (!cleaned) {
    return 'media';
  }

  // Remove special characters (filesystem safety)
  cleaned = cleaned.replace(/[<>:"/\\|?*]/g, '_');

  // Length limit (255 chars is typical filesystem limit)
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200);
  }

  return cleaned;
}
