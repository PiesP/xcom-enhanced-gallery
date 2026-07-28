// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

const GALLERY_HIDDEN_MARKER = 'data-xeg-gallery-hidden';
const previousAriaHidden = new WeakMap<HTMLElement, string | null>();
const previousInert = new WeakMap<HTMLElement, string | null>();

export function hideBackgroundElement(element: HTMLElement): void {
  if (!previousAriaHidden.has(element)) {
    previousAriaHidden.set(element, element.getAttribute('aria-hidden'));
    previousInert.set(element, element.getAttribute('inert'));
  }
  element.setAttribute(GALLERY_HIDDEN_MARKER, '');
  element.setAttribute('aria-hidden', 'true');
  element.setAttribute('inert', '');
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
  const inert = previousInert.get(element);
  if (inert === null || inert === undefined) {
    element.removeAttribute('inert');
  } else {
    element.setAttribute('inert', inert);
  }
  previousInert.delete(element);
  element.removeAttribute(GALLERY_HIDDEN_MARKER);
}

export function isHiddenByGallery(element: HTMLElement): boolean {
  return element.hasAttribute(GALLERY_HIDDEN_MARKER);
}
