/**
 * URL optimization helpers.
 */

export function optimizePbsImageUrlToWebP(input: string): string {
  try {
    const url = new URL(input);

    if (url.hostname !== 'pbs.twimg.com') {
      return input;
    }

    const currentFormat = url.searchParams.get('format');
    if (currentFormat === null) {
      return input;
    }

    if (currentFormat.toLowerCase() === 'webp') {
      return input;
    }

    url.searchParams.set('format', 'webp');
    return url.toString();
  } catch {
    return input;
  }
}
