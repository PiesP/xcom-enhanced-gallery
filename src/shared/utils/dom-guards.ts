// 경량 DOM 타입 가드 유틸리티
export function isElement(target: EventTarget | null | undefined): target is Element {
  return !!target && typeof (target as Element).tagName === 'string';
}

export function isHTMLElement(target: EventTarget | null | undefined): target is HTMLElement {
  return !!target && 'tagName' in (target as Element) && (target as Element).nodeType === 1;
}

export function isImageElement(target: EventTarget | null | undefined): target is HTMLImageElement {
  return isElement(target) && (target as Element).tagName.toUpperCase() === 'IMG';
}

export function isVideoElement(target: EventTarget | null | undefined): target is HTMLVideoElement {
  return isElement(target) && (target as Element).tagName.toUpperCase() === 'VIDEO';
}

export function getSrcIfPresent(target: EventTarget | null | undefined): string | null {
  if (!target) return null;
  const element = target as Element & { src?: string };
  if ('src' in element && typeof element.src === 'string') return element.src;
  return null;
}
