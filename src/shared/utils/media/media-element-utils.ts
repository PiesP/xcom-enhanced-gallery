import type {
  DescendantSearchConfig,
  MediaElement,
  MediaTraversalOptions,
  QueueNode,
} from './media-element-utils.types';

const DEFAULT_MAX_DESCENDANT_DEPTH = 6;
const DEFAULT_MAX_ANCESTOR_HOPS = 3;

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
  options: MediaTraversalOptions = {}
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
  const isImage = element instanceof HTMLImageElement;

  if (isImage) {
    const attr = element.getAttribute('src');
    const current = element.currentSrc || null;
    // Only use element.src if attribute exists, to avoid default baseURI values returned by the engine
    const resolved = attr ? element.src : null;
    return pickFirstTruthy([current, resolved, attr]);
  }

  // element is HTMLVideoElement
  const attr = element.getAttribute('src');
  const posterAttr = element.getAttribute('poster');
  const current = element.currentSrc || null;
  const resolved = attr ? element.src : null;
  const posterResolved = posterAttr ? element.poster : null;
  // Prefer currentSrc, then src attribute, then poster (poster takes precedence over poster attribute)
  return pickFirstTruthy([current, resolved, attr, posterResolved, posterAttr]);
}

function findMediaDescendant(
  root: HTMLElement,
  { includeRoot, maxDepth }: DescendantSearchConfig
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

/**
 * Return the first truthy value from an array, or null if none exist
 *
 * @param values - Array of values to evaluate
 * @returns The first truthy value, or null if all values are falsy
 */
function pickFirstTruthy(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (value) {
      return value;
    }
  }
  return null;
}
