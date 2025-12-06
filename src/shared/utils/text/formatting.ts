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

    const segments = path.split('/').filter(Boolean);
    const base = `${urlObj.protocol}//${domain}`;

    // If the domain itself exceeds the max length, shortening the path
    // won't help make the whole URL fit, so just return the full path.
    const allowedPathLen = maxLength - base.length;
    if (base.length >= maxLength) {
      return `${base}${path}`;
    }

    // If we only have 1-2 segments or the path is short relative to the
    // configured thresholds, return as-is.
    if (segments.length <= 2 || path.length <= Math.min(20, Math.max(0, allowedPathLen))) {
      return `${base}${path}`;
    }

    // If URL length is greater than maxLength and we have multiple path segments,
    // shorten to protocol//domain/first/.../last for readability (only when this
    // actually helps keep the URL length under the limit).
    if (url.length > maxLength && segments.length > 2) {
      const first = segments[0];
      const last = segments[segments.length - 1];
      return `${base}/${first}/.../${last}`;
    }

    // Fallback: return full path
    return `${urlObj.protocol}//${domain}${path}`;
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

/**
 * ClassValue type for cx function - supports strings, objects with boolean values,
 * arrays, and nested combinations
 */
export type ClassValue = string | number | boolean | undefined | null | ClassRecord | ClassArray;

/**
 * Object mapping class names to boolean conditions
 */
export type ClassRecord = Record<string, boolean | undefined | null>;

/**
 * Array of class values (can be nested)
 */
export interface ClassArray extends Array<ClassValue> {}

/**
 * Combines class names with conditional logic (clsx-style API)
 *
 * Supports multiple input formats:
 * - Strings: `cx('foo', 'bar')` → `'foo bar'`
 * - Objects: `cx({ foo: true, bar: false })` → `'foo'`
 * - Arrays: `cx(['foo', 'bar'])` → `'foo bar'`
 * - Mixed: `cx('base', { active: isActive }, ['extra'])` → varies
 * - Falsy values are filtered: `cx('foo', null, undefined, false, '', 'bar')` → `'foo bar'`
 *
 * @param inputs - Class values to combine
 * @returns Combined class string
 *
 * @example
 * ```typescript
 * // Simple strings
 * cx('foo', 'bar') // 'foo bar'
 *
 * // Conditional object
 * cx({ active: isActive, disabled: isDisabled })
 *
 * // Mixed usage
 * cx(styles.container, { [styles.active]: isActive }, className)
 *
 * // Replaces template literal patterns
 * // Before: `${styles.container} ${isActive ? styles.active : ''}`
 * // After:  cx(styles.container, { [styles.active]: isActive })
 * ```
 */
export function cx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cx(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
