const NAMED_ENTITY_FALLBACK: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

const ENTITY_PATTERN = /&(#x?[0-9a-f]+|[a-z]+);/gi;
let cachedTextarea: HTMLTextAreaElement | null = null;

function decodeWithDOM(value: string): string | null {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return null;
  }

  try {
    cachedTextarea ??= document.createElement('textarea');
    cachedTextarea.innerHTML = value;
    const decoded = cachedTextarea.value;
    cachedTextarea.innerHTML = '';
    return decoded;
  } catch {
    cachedTextarea = null;
    return null;
  }
}

function decodeWithDOMParser(value: string): string | null {
  if (typeof DOMParser === 'undefined') {
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, 'text/html');
    const decoded = doc.documentElement?.textContent;
    return typeof decoded === 'string' ? decoded : value;
  } catch {
    return null;
  }
}

function decodeWithFallbackMap(value: string): string {
  return value.replace(ENTITY_PATTERN, (match: string, entity: string): string => {
    const normalized = String(entity).toLowerCase();

    if (Object.prototype.hasOwnProperty.call(NAMED_ENTITY_FALLBACK, normalized)) {
      return NAMED_ENTITY_FALLBACK[normalized] ?? match;
    }

    if (normalized === '#39') {
      return "'";
    }

    if (normalized.startsWith('#x')) {
      const hex = normalized.slice(2);
      const codePoint = Number.parseInt(hex, 16);
      if (Number.isFinite(codePoint)) {
        return String.fromCodePoint(codePoint);
      }
      return match;
    }

    if (normalized.startsWith('#')) {
      const decimal = normalized.slice(1);
      const codePoint = Number.parseInt(decimal, 10);
      if (Number.isFinite(codePoint)) {
        return String.fromCodePoint(codePoint);
      }
    }

    return match;
  });
}

export function decodeHtmlEntitiesSafely(value: string): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (value.length === 0) {
    return '';
  }

  const domDecoded = decodeWithDOM(value);
  if (domDecoded !== null) {
    return domDecoded;
  }

  const parserDecoded = decodeWithDOMParser(value);
  if (parserDecoded !== null) {
    return parserDecoded;
  }

  try {
    return decodeWithFallbackMap(value);
  } catch {
    return null;
  }
}
