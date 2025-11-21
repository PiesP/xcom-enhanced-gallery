/**
 * Copyright (c) 2024 X.com Gallery
 * Licensed under the MIT License
 *
 * Filename utilities for media downloads.
 */

const DEFAULT_FILENAME = 'media';
const MAX_FILENAME_LENGTH = 200;
const INVALID_CHARACTER_PATTERN = /[<>:"/\\|?*]/g;
const SEGMENT_SPLITTER = /[\\/]+/;

const KNOWN_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
] as const;

const KNOWN_EXTENSIONS_LOWER = KNOWN_EXTENSIONS.map(ext => ext.toLowerCase());

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stripQueryAndFragment(segment: string): string {
  const queryIndex = segment.indexOf('?');
  const hashIndex = segment.indexOf('#');

  const cutIndex = Math.min(
    queryIndex === -1 ? segment.length : queryIndex,
    hashIndex === -1 ? segment.length : hashIndex
  );

  return segment.slice(0, cutIndex);
}

function stripKnownExtension(segment: string): string {
  const lower = segment.toLowerCase();
  for (const extension of KNOWN_EXTENSIONS_LOWER) {
    if (lower.endsWith(extension)) {
      return segment.slice(0, -extension.length);
    }
  }
  return segment;
}

function normaliseSegment(raw: string): string {
  const withoutQuery = stripQueryAndFragment(raw);
  const withoutExtension = stripKnownExtension(withoutQuery);
  const sanitised = withoutExtension.replace(INVALID_CHARACTER_PATTERN, '_');
  if (!sanitised) {
    return DEFAULT_FILENAME;
  }

  return sanitised.slice(0, MAX_FILENAME_LENGTH);
}

/**
 * Normalise a media filename so it can be safely used on disk.
 *
 * The function trims whitespace, removes path segments, strips query/hash
 * fragments, drops known media extensions, replaces filesystem unsafe
 * characters with underscores, and truncates overly long values.
 */
export function cleanFilename(filename: string): string {
  if (!isNonEmptyString(filename)) {
    return DEFAULT_FILENAME;
  }

  const trimmed = filename.trim();
  const segments = trimmed.split(SEGMENT_SPLITTER);
  const lastSegment = segments.pop() ?? trimmed;

  return normaliseSegment(lastSegment);
}
