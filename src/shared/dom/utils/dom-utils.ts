// Minimal DOM helpers kept for media extraction performance paths.

function createEmptyNodeList<T extends Element>(): NodeListOf<T> {
  const fragment = document.createDocumentFragment();
  return fragment.querySelectorAll('*') as NodeListOf<T>;
}

export function querySelector<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): T | null {
  try {
    return container.querySelector<T>(selector);
  } catch {
    return null;
  }
}

export function querySelectorAll<T extends Element = Element>(
  selector: string,
  container: ParentNode = document
): NodeListOf<T> {
  try {
    return container.querySelectorAll<T>(selector);
  } catch {
    return createEmptyNodeList<T>();
  }
}
