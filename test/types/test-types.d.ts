/**
 * Test-only ambient types for the test suite.
 * Keep these minimal and compatible with DOM libs (HTMLElement/Document).
 */

export type MockHTMLCollection = Array<any> & {
  namedItem?: (name: string) => any | null;
  item?: (index: number) => any | null;
};

export type MockElement = HTMLElement & {
  tagName?: string;
  dataset?: Record<string, string>;
  children?: MockHTMLCollection;
  parentNode?: MockElement | null;
  firstElementChild?: Element | null;
  lastElementChild?: Element | null;
  src?: string;
  currentSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
  naturalWidth?: number;
  naturalHeight?: number;
  complete?: boolean;
  // video related
  videoWidth?: number;
  videoHeight?: number;
  duration?: number;
  currentTime?: number;
  paused?: boolean;
  muted?: boolean;
  play?: () => Promise<void> | void;
  pause?: () => void;
  load?: () => void;
};

export type MockDocument = Document & {
  createElement?: (tag: string) => MockElement;
};

declare global {
  var __TEST_MOCKS__: unknown;
}
