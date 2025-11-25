/**
 * @fileoverview Lightweight HTML sanitizer for tweet content
 * @description Provides safe HTML sanitization without external dependencies
 * @version 1.0.0 - Phase 2: DOM HTML preservation
 */

import { HTML_ATTRIBUTE_URL_POLICY, isUrlAllowed } from '@shared/utils/url/safety';

/**
 * Configuration for HTML sanitization
 */
interface SanitizerConfig {
  /** Allowed HTML tags (lowercase) */
  allowedTags: string[];
  /** Allowed attributes per tag */
  allowedAttributes: Record<string, string[]>;
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
      if ((attrName === 'href' || attrName === 'src') && !isSafeAttributeUrl(attr.value)) {
        continue;
      }

      sanitized.setAttribute(attrName, attr.value);
    }

    // Enforce rel="noopener noreferrer" for target="_blank" on links to prevent tabnabbing
    if (tagName === 'a' && sanitized.getAttribute('target') === '_blank') {
      sanitized.setAttribute('rel', 'noopener noreferrer');
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
 * Validates attribute URLs via the centralized url-safety helper.
 */
function isSafeAttributeUrl(url: string): boolean {
  return isUrlAllowed(url, HTML_ATTRIBUTE_URL_POLICY);
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
