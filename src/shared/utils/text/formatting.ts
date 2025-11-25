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
  | { type: 'mention'; content: string; href: string }
  | { type: 'hashtag'; content: string; href: string }
  | { type: 'cashtag'; content: string; href: string }
  | { type: 'break' };

/**
 * Combined pattern matching URLs, mentions, hashtags, and cashtags
 * - URLs: http / https
 * - Mentions: @username (1-15 chars, alphanumeric + underscore)
 * - Hashtags: #tag (letters, numbers, underscore, unicode aware)
 * - Cashtags: $TICKER (1-6 uppercase characters, optional .XX suffix)
 */
const ENTITY_PATTERN =
  /(https?:\/\/[^\s]+|@[a-zA-Z0-9_]{1,15}|#[\p{L}\p{N}_]{1,50}|\$[A-Z]{1,6}(?:\.[A-Z]{1,2})?)/gu;

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

    // Split line by interactive entities (URLs, mentions, tags)
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    ENTITY_PATTERN.lastIndex = 0; // Reset regex state

    while ((match = ENTITY_PATTERN.exec(line)) !== null) {
      const entity = match[0];
      const matchIndex = match.index;

      // Add text before entity
      if (matchIndex > lastIndex) {
        const textContent = line.slice(lastIndex, matchIndex);
        if (textContent) {
          tokens.push({ type: 'text', content: textContent });
        }
      }

      // Add entity as appropriate interactive token
      tokens.push(createEntityToken(entity));

      lastIndex = matchIndex + entity.length;
    }

    // Add remaining text after last entity
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
 * Creates an interactive token (link/mention/hashtag/cashtag) with resolved href
 */
function createEntityToken(entity: string): TextToken {
  if (entity.startsWith('http')) {
    return {
      type: 'link',
      content: entity,
      href: entity,
    };
  }

  if (entity.startsWith('@')) {
    const username = entity.slice(1);
    return {
      type: 'mention',
      content: entity,
      href: `https://x.com/${username}`,
    };
  }

  if (entity.startsWith('#')) {
    const tag = entity.slice(1);
    return {
      type: 'hashtag',
      content: entity,
      href: `https://x.com/hashtag/${encodeURIComponent(tag)}`,
    };
  }

  if (entity.startsWith('$')) {
    const symbol = entity.slice(1);
    const encoded = encodeURIComponent(`$${symbol}`);
    return {
      type: 'cashtag',
      content: entity,
      href: `https://x.com/search?q=${encoded}`,
    };
  }

  // Fallback: treat as plain text token
  return {
    type: 'text',
    content: entity,
  };
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

/**
 * Create standard class names
 * Joins non-null/undefined values with a space
 *
 * @param classes - List of class names (strings, null, or undefined)
 * @returns Joined class name string
 */
export function createClassName(...classes: (string | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
