/**
 * @fileoverview Lightweight HTML sanitizer for tweet content
 * @description Provides safe HTML sanitization without external dependencies
 * @version 1.0.0 - Phase 2: DOM HTML preservation
 */

/**
 * Configuration for HTML sanitization
 */
interface SanitizerConfig {
  /** Allowed HTML tags (lowercase) */
  allowedTags: string[];
  /** Allowed attributes per tag */
  allowedAttributes: Record<string, string[]>;
  /** Protocols allowed in URLs */
  allowedProtocols: string[];
}

/**
 * Default sanitizer configuration for tweet content
 * Allows safe HTML elements commonly used in tweets
 */
const DEFAULT_CONFIG: SanitizerConfig = {
  allowedTags: ['a', 'span', 'br', 'strong', 'em', 'img'],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target', 'dir'],
    span: ['class', 'dir'],
    img: ['alt', 'src', 'draggable'],
  },
  allowedProtocols: ['http:', 'https:'],
};

/**
 * Sanitizes HTML content by removing dangerous elements and attributes
 * Uses a whitelist approach for maximum security
 *
 * @param html - Raw HTML string to sanitize
 * @param config - Custom sanitization configuration
 * @returns Sanitized HTML string safe for innerHTML
 *
 * @example
 * ```typescript
 * const dirty = '<a href="javascript:alert(1)">Click</a><script>evil()</script>';
 * const clean = sanitizeHTML(dirty);
 * // '<a>Click</a>' (script removed, javascript: href removed)
 * ```
 */
export function sanitizeHTML(html: string, config: SanitizerConfig = DEFAULT_CONFIG): string {
  if (!html || typeof html !== 'string') return '';

  // Create a temporary DOM element to parse HTML
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Recursive function to sanitize a node and its children
  function sanitizeNode(node: Node): Node | null {
    // Text nodes are safe
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(false);
    }

    // Only process element nodes
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    // Check if tag is allowed
    if (!config.allowedTags.includes(tagName)) {
      // For disallowed tags, keep their text content
      const textContent = element.textContent || '';
      return document.createTextNode(textContent);
    }

    // Create a new sanitized element
    const sanitized = document.createElement(tagName);

    // Copy allowed attributes
    const allowedAttrs = config.allowedAttributes[tagName] || [];
    for (const attr of Array.from(element.attributes)) {
      const attrName = attr.name.toLowerCase();

      // Skip event handlers (onclick, onerror, etc.)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Check if attribute is allowed
      if (!allowedAttrs.includes(attrName)) {
        continue;
      }

      // Special handling for href attributes
      if (attrName === 'href') {
        const href = attr.value;
        if (!isValidUrl(href, config.allowedProtocols)) {
          continue;
        }
      }

      // Special handling for src attributes (images)
      if (attrName === 'src') {
        const src = attr.value;
        if (!isValidUrl(src, config.allowedProtocols)) {
          continue;
        }
      }

      sanitized.setAttribute(attrName, attr.value);
    }

    // Recursively sanitize children
    for (const child of Array.from(element.childNodes)) {
      const sanitizedChild = sanitizeNode(child);
      if (sanitizedChild) {
        sanitized.appendChild(sanitizedChild);
      }
    }

    return sanitized;
  }

  // Sanitize body content
  const bodyContent = doc.body;
  const sanitizedBody = document.createElement('div');

  for (const child of Array.from(bodyContent.childNodes)) {
    const sanitized = sanitizeNode(child);
    if (sanitized) {
      sanitizedBody.appendChild(sanitized);
    }
  }

  return sanitizedBody.innerHTML;
}

/**
 * Validates URL safety
 * Checks protocol and prevents javascript: URLs
 *
 * @param url - URL string to validate
 * @param allowedProtocols - List of allowed protocols
 * @returns True if URL is safe
 */
function isValidUrl(url: string, allowedProtocols: string[]): boolean {
  if (!url || typeof url !== 'string') return false;

  // Remove whitespace
  const trimmed = url.trim();

  // Reject javascript: and data: protocols
  if (
    trimmed.toLowerCase().startsWith('javascript:') ||
    trimmed.toLowerCase().startsWith('data:') ||
    trimmed.toLowerCase().startsWith('vbscript:')
  ) {
    return false;
  }

  // Check if URL has an allowed protocol
  try {
    const urlObj = new URL(trimmed, 'https://example.com'); // Use base for relative URLs
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    // If URL parsing fails, check for relative URLs
    // Relative URLs are considered safe (e.g., /path or #fragment)
    return trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('.');
  }
}

/**
 * Extracts plain text from HTML
 * Useful as a fallback when HTML is not trusted
 *
 * @param html - HTML string
 * @returns Plain text content
 */
export function extractPlainText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
