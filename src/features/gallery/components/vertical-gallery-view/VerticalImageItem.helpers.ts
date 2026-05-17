const CLEAN_FILENAME_MAX_LENGTH = 40;
const CLEAN_FILENAME_TRUNCATION_MARKER = '...';
const CLEAN_FILENAME_EXTENSION_REGEX = /(?:\.[^./\\]{1,10})$/;
const CLEAN_FILENAME_TWITTER_PREFIX_REGEX = /^twitter_media_\d{8}T\d{6}_/;
const CLEAN_FILENAME_MEDIA_PREFIX_REGEX = /^\/media\//;
const CLEAN_FILENAME_RELATIVE_PREFIX_REGEX = /^\.\//;

export function cleanFilename(filename?: string): string {
  if (!filename) {
    return 'Untitled';
  }

  const truncateMiddlePreservingExtension = (value: string): string => {
    if (value.length <= CLEAN_FILENAME_MAX_LENGTH) {
      return value;
    }

    // Keep a short extension if present (e.g., ".jpg").
    // Limit the extension length to avoid pathological cases.
    const extensionMatch = value.match(CLEAN_FILENAME_EXTENSION_REGEX);
    const extension = extensionMatch?.[0] ?? '';
    const base = extension ? value.slice(0, -extension.length) : value;

    const available =
      CLEAN_FILENAME_MAX_LENGTH - extension.length - CLEAN_FILENAME_TRUNCATION_MARKER.length;
    if (available <= 1) {
      return value.slice(0, CLEAN_FILENAME_MAX_LENGTH);
    }

    const headLen = Math.max(1, Math.floor(available / 2));
    const tailLen = Math.max(1, available - headLen);

    const head = base.slice(0, headLen);
    const tail = base.slice(Math.max(0, base.length - tailLen));

    return `${head}${CLEAN_FILENAME_TRUNCATION_MARKER}${tail}${extension}`;
  };

  let cleaned = filename
    .replace(CLEAN_FILENAME_TWITTER_PREFIX_REGEX, '')
    .replace(CLEAN_FILENAME_MEDIA_PREFIX_REGEX, '')
    .replace(CLEAN_FILENAME_RELATIVE_PREFIX_REGEX, '');

  // If there are path separators, prefer the last path segment (e.g., path/to/file.png -> file.png)
  const lastSegment = cleaned.split(/[\\/]/).pop();
  if (lastSegment) {
    cleaned = lastSegment;
  }

  // Treat a cleaned string consisting only of path separators as empty
  // (e.g., "////"). This ensures we fall back to 'Image' when the
  // resulting filename is effectively empty after stripping.
  if (/^[\\/]+$/.test(cleaned)) {
    cleaned = '';
  }

  cleaned = cleaned.trim();
  if (!cleaned) {
    return 'Image';
  }

  return truncateMiddlePreservingExtension(cleaned);
}

/**
 * Normalize persisted video volume setting.
 *
 * The stored value may be corrupted (e.g. string, NaN, out-of-range).
 * This function ensures the returned value is always a finite number in [0, 1].
 */
export function normalizeVideoVolumeSetting(value: unknown, fallback = 1.0): number {
  const candidate =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;

  if (!Number.isFinite(candidate)) {
    return fallback;
  }

  return Math.min(1.0, Math.max(0.0, candidate));
}

/**
 * Normalize persisted video muted setting.
 *
 * The stored value may be corrupted (e.g. number or string values).
 * This function ensures the returned value is always a boolean.
 */
export function normalizeVideoMutedSetting(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return fallback;
}
