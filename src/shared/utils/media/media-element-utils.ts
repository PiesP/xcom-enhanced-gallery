const DEFAULT_MAX_DESCENDANT_DEPTH = 6;
const DEFAULT_MAX_ANCESTOR_HOPS = 3;

export type MediaElement = HTMLImageElement | HTMLVideoElement;

export type MediaTraversalOptions = {
  /** Maximum depth for breadth-first descendant searches (defaults to 6) */
  maxDescendantDepth?: number;
  /** Maximum ancestor hops to evaluate during upward traversal (defaults to 3) */
  maxAncestorHops?: number;
};

type DescendantSearchConfig = {
  includeRoot: boolean;
  maxDepth: number;
};

type QueueNode = { node: HTMLElement; depth: number };

const DEFAULT_TRAVERSAL_OPTIONS: Required<MediaTraversalOptions> = {
  maxDescendantDepth: DEFAULT_MAX_DESCENDANT_DEPTH,
  maxAncestorHops: DEFAULT_MAX_ANCESTOR_HOPS,
};

/**
 * Determine whether the provided element is a supported media element (IMG or VIDEO)
 */
export function isMediaElement(element: HTMLElement | null): element is MediaElement {
  if (!element) {
    return false;
  }

  return element.tagName === 'IMG' || element.tagName === 'VIDEO';
}

/**
 * Attempt to locate a media element starting from a click target
 *
 * Traversal order:
 * 1. Direct hit (target itself)
 * 2. Descendant search (breadth-first, depth-limited)
 * 3. Ancestor walk where each ancestor performs the same descendant search including itself
 */
export function findMediaElementInDOM(
  target: HTMLElement,
  options: MediaTraversalOptions = {},
): MediaElement | null {
  const { maxDescendantDepth, maxAncestorHops } = {
    ...DEFAULT_TRAVERSAL_OPTIONS,
    ...options,
  };

  if (isMediaElement(target)) {
    return target;
  }

  const descendant = findMediaDescendant(target, {
    includeRoot: false,
    maxDepth: maxDescendantDepth,
  });

  if (descendant) {
    return descendant;
  }

  let branch: HTMLElement | null = target;
  for (let hops = 0; hops < maxAncestorHops && branch; hops++) {
    branch = branch.parentElement;
    if (!branch) {
      break;
    }

    const ancestorMedia = findMediaDescendant(branch, {
      includeRoot: true,
      maxDepth: maxDescendantDepth,
    });

    if (ancestorMedia) {
      return ancestorMedia;
    }
  }

  return null;
}

/**
 * Extract the best-available URL from a media element
 * - Images prefer `currentSrc` and then `src`
 * - Videos prefer `currentSrc`, then `src`, then `poster`
 */
export function extractMediaUrlFromElement(element: MediaElement): string | null {
  if (element instanceof HTMLImageElement) {
    return pickFirstTruthy([element.currentSrc, element.src, element.getAttribute('src')]);
  }

  if (element instanceof HTMLVideoElement) {
    return pickFirstTruthy([
      element.currentSrc,
      element.src,
      element.getAttribute('src'),
      element.poster,
      element.getAttribute('poster'),
    ]);
  }

  return null;
}

function findMediaDescendant(
  root: HTMLElement,
  { includeRoot, maxDepth }: DescendantSearchConfig,
): MediaElement | null {
  const queue: QueueNode[] = [{ node: root, depth: 0 }];

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const { node, depth } = current;

    if ((includeRoot || node !== root) && isMediaElement(node)) {
      return node;
    }

    if (depth >= maxDepth) {
      continue;
    }

    for (const child of Array.from(node.children)) {
      if (child instanceof HTMLElement) {
        queue.push({ node: child, depth: depth + 1 });
      }
    }
  }

  return null;
}

function pickFirstTruthy(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (value) {
      return value;
    }
  }
  return null;
}

export const MEDIA_TRAVERSAL_DEFAULTS = DEFAULT_TRAVERSAL_OPTIONS;
export const DEFAULT_MEDIA_DESCENDANT_DEPTH = DEFAULT_MAX_DESCENDANT_DEPTH;
export const DEFAULT_MEDIA_ANCESTOR_HOPS = DEFAULT_MAX_ANCESTOR_HOPS;
