import type {
  DescendantSearchConfig,
  MediaElement,
  MediaTraversalOptions,
  QueueNode,
} from './media-element-utils.types';

/** Default maximum descendant search depth */
const DEFAULT_MAX_DESCENDANT_DEPTH = 6;

/** Default maximum ancestor hop count */
const DEFAULT_MAX_ANCESTOR_HOPS = 3;

/** Default traversal options with all required fields */
const DEFAULT_TRAVERSAL_OPTIONS: Required<MediaTraversalOptions> = {
  maxDescendantDepth: DEFAULT_MAX_DESCENDANT_DEPTH,
  maxAncestorHops: DEFAULT_MAX_ANCESTOR_HOPS,
};

/**
 * Check if element is a supported media element (IMG or VIDEO)
 * @param element - Element to check
 * @returns true if element is IMG or VIDEO tag
 */
export function isMediaElement(element: HTMLElement | null): element is MediaElement {
  if (!element) {
    return false;
  }

  return element.tagName === 'IMG' || element.tagName === 'VIDEO';
}

/**
 * Find media element starting from click target
 *
 * Traversal order:
 * 1. Direct hit (target itself)
 * 2. Descendant search (breadth-first, depth-limited)
 * 3. Ancestor walk with descendant search at each level
 *
 * @param target - Click target element
 * @param options - Traversal options (depth limits)
 * @returns Found media element or null
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
 * Extract best-available URL from media element
 *
 * Images: currentSrc → src attribute → src property
 * Videos: currentSrc → src → poster attribute → poster property
 *
 * @param element - Media element (IMG or VIDEO)
 * @returns URL string or null
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

/** Find media element among node descendants (breadth-first, depth-limited) */
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
 * Return first truthy value from array
 * @param values - Values to evaluate
 * @returns First truthy value or null
 */
function pickFirstTruthy(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (value) {
      return value;
    }
  }
  return null;
}
