export type DomFactsKind = 'XComGallery';

export interface DomFacts {
  readonly kind: DomFactsKind;
  readonly url: string;
  readonly hasXegOverlay: boolean;
  readonly hasXComMediaViewer: boolean;
  readonly mediaElementsCount: number;
}
