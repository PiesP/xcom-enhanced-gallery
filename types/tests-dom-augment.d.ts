// Ambient test-only DOM type helpers to ease JSDOM typing differences

// Allow indexing known properties after a type guard in tests
interface HTMLElement {
  // Narrow helper for tests that work with <img>
  asImage(): HTMLImageElement | null;
}

declare global {
  interface HTMLElement {
    asImage(): HTMLImageElement | null;
  }
}

export {};
