/**
 * Type definitions for media element utilities
 */

/** Union type for supported media elements */
export type MediaElement = HTMLImageElement | HTMLVideoElement;

/** Configuration options for DOM traversal when searching for media elements */
export type MediaTraversalOptions = {
  /** Maximum depth for breadth-first descendant searches (defaults to 6) */
  readonly maxDescendantDepth?: number;
  /** Maximum ancestor hops to evaluate during upward traversal (defaults to 3) */
  readonly maxAncestorHops?: number;
};

/** Internal configuration for descendant search operations */
export type DescendantSearchConfig = {
  readonly includeRoot: boolean;
  readonly maxDepth: number;
};

/** Node in the breadth-first search queue with tracking information */
export type QueueNode = {
  readonly node: HTMLElement;
  readonly depth: number;
};
