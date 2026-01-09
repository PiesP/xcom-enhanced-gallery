/**
 * Type definitions for media element utilities
 */

/** Union type for supported media elements */
export type MediaElement = HTMLImageElement | HTMLVideoElement;

/** DOM traversal options for media element search */
export type MediaTraversalOptions = {
  /** Max depth for descendant searches (default 6) */
  readonly maxDescendantDepth?: number;
  /** Max ancestor hops (default 3) */
  readonly maxAncestorHops?: number;
};

/** Descendant search configuration */
export type DescendantSearchConfig = {
  readonly includeRoot: boolean;
  readonly maxDepth: number;
};

/** Breadth-first search queue node */
export type QueueNode = {
  readonly node: HTMLElement;
  readonly depth: number;
};
