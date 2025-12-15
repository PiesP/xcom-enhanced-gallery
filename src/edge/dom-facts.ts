import { queryAllWithFallback, SELECTORS, STABLE_SELECTORS } from '@constants/selectors';
import type { DomFacts, DomFactsKind } from '@core/dom-facts';

function safeUrl(): string {
  try {
    return typeof window !== 'undefined' && window.location ? window.location.href : '';
  } catch {
    return '';
  }
}

export function takeDomFacts(kind: DomFactsKind): DomFacts {
  const url = safeUrl();

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
