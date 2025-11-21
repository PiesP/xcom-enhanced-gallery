// Ambient test-only DOM type helpers to ease JSDOM typing differences.
// Runtime implementation is attached in test/setup.ts.

declare global {
  interface HTMLElement {
    /**
     * Narrow helper used by image-focused tests. Returns the element when it
     * is an <img>, otherwise null.
     */
    asImage(): HTMLImageElement | null;
  }
}

export {};
