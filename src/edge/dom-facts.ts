import type { DomFacts, DomFactsKind } from '@core/dom-facts';
import { getSafeHref } from '@shared/dom/safe-location';
import { queryAllWithFallback, SELECTORS, STABLE_SELECTORS } from '@shared/dom/selectors';

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

  const hasXegOverlay = Boolean(document.querySelector(SELECTORS.GALLERY_OVERLAY));
  const hasXComMediaViewer =
    queryAllWithFallback(document, STABLE_SELECTORS.MEDIA_VIEWERS).length > 0;
  const mediaElementsCount = queryAllWithFallback(
    document,
    STABLE_SELECTORS.MEDIA_CONTAINERS
  ).length;

  return { kind, url, hasXegOverlay, hasXComMediaViewer, mediaElementsCount };
}
