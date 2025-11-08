/**
 * @fileoverview Text formatting utilities for safe rendering
 * @description Provides safe text formatting without innerHTML (XSS prevention)
 */

/**
 * Text token types for structured rendering
 */
export type TextToken =
  | { type: 'text'; content: string }
  | { type: 'link'; content: string; href: string }
  | { type: 'break' };

/**
 * Formats tweet text into safe renderable tokens
 * Handles line breaks and URLs without using innerHTML
 *
 * @param text - Raw tweet text
 * @returns Array of text tokens for safe rendering
 *
 * @example
 * ```typescript
 * const tokens = formatTweetText("Check this out:\nhttps://example.com");
 * // [
 * //   { type: 'text', content: 'Check this out:' },
 * //   { type: 'break' },
 * //   { type: 'link', content: 'https://example.com', href: 'https://example.com' }
 * // ]
 * ```
 */
export function formatTweetText(text: string | undefined): TextToken[] {
  if (!text) return [];

  // URL pattern: matches http(s) URLs
  // Simplified pattern for safety (doesn't capture complex edge cases)
  const urlPattern = /(https?:\/\/[^\s]+)/g;

  const tokens: TextToken[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) {
      // Empty line
      if (i < lines.length - 1) {
        tokens.push({ type: 'break' });
      }
      continue;
    }

    // Split line by URLs
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    urlPattern.lastIndex = 0; // Reset regex state

    while ((match = urlPattern.exec(line)) !== null) {
      const url = match[0];
      const matchIndex = match.index;

      // Add text before URL
      if (matchIndex > lastIndex) {
        const textContent = line.slice(lastIndex, matchIndex);
        if (textContent) {
          tokens.push({ type: 'text', content: textContent });
        }
      }

      // Add URL as link
      tokens.push({
        type: 'link',
        content: url,
        href: url,
      });

      lastIndex = matchIndex + url.length;
    }

    // Add remaining text after last URL
    if (lastIndex < line.length) {
      const textContent = line.slice(lastIndex);
      if (textContent) {
        tokens.push({ type: 'text', content: textContent });
      }
    }

    // Add line break (except for last line)
    if (i < lines.length - 1) {
      tokens.push({ type: 'break' });
    }
  }

  return tokens;
}

/**
 * Shortens a URL for display purposes
 * Shows protocol + domain + first/last segments of path
 *
 * @param url - Full URL string
 * @param maxLength - Maximum display length (default: 50)
 * @returns Shortened URL or original if already short
 *
 * @example
 * ```typescript
 * shortenUrl('https://example.com/very/long/path/to/resource')
 * // 'https://example.com/very/.../resource'
 * ```
 */
export function shortenUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) return url;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;

    if (path.length <= 20) {
      return `${urlObj.protocol}//${domain}${path}`;
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length <= 2) {
      return `${urlObj.protocol}//${domain}${path}`;
    }

    const first = segments[0];
    const last = segments[segments.length - 1];
    return `${urlObj.protocol}//${domain}/${first}/.../${last}`;
  } catch {
    // Invalid URL, return truncated
    return url.length > maxLength ? `${url.slice(0, maxLength)}...` : url;
  }
}
