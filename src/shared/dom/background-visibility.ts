// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

const GALLERY_HIDDEN_MARKER = 'data-xeg-gallery-hidden';
const previousAriaHidden = new WeakMap<HTMLElement, string | null>();

export function hideBackgroundElement(element: HTMLElement): void {
  if (!previousAriaHidden.has(element)) {
    previousAriaHidden.set(element, element.getAttribute('aria-hidden'));
  }
  element.setAttribute(GALLERY_HIDDEN_MARKER, '');
  element.setAttribute('aria-hidden', 'true');
}

export function restoreBackgroundElement(element: HTMLElement): void {
  if (!previousAriaHidden.has(element) && !element.hasAttribute(GALLERY_HIDDEN_MARKER)) {
    return;
  }
  const previous = previousAriaHidden.get(element);
  if (previous === null || previous === undefined) {
    element.removeAttribute('aria-hidden');
  } else {
    element.setAttribute('aria-hidden', previous);
  }
  previousAriaHidden.delete(element);
  element.removeAttribute(GALLERY_HIDDEN_MARKER);
}

export function isHiddenByGallery(element: HTMLElement): boolean {
  return element.hasAttribute(GALLERY_HIDDEN_MARKER);
}
