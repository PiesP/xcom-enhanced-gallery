import type { DomFacts, DomFactsKind } from '@core/dom-facts';
import { getSafeHref } from '@shared/dom/safe-location';
import {
  GALLERY_OVERLAY_SELECTOR,
  queryAllWithFallback,
  STABLE_MEDIA_CONTAINERS_SELECTORS,
  STABLE_MEDIA_VIEWERS_SELECTORS,
} from '@shared/dom/selectors';

export function takeDomFacts(kind: DomFactsKind): DomFacts {
  const url = getSafeHref() ?? '';

  if (typeof document === 'undefined') {
    return {
      kind,
      url,
      hasXegOverlay: false,
      hasXComMediaViewer: false,
      mediaElementsCount: 0,
    };
  }

  const hasXegOverlay = !!document.querySelector(GALLERY_OVERLAY_SELECTOR);
  const hasXComMediaViewer =
    queryAllWithFallback(document, STABLE_MEDIA_VIEWERS_SELECTORS).length > 0;
  const mediaElementsCount = queryAllWithFallback(
    document,
    STABLE_MEDIA_CONTAINERS_SELECTORS
  ).length;

  return { kind, url, hasXegOverlay, hasXComMediaViewer, mediaElementsCount };
}
