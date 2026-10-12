// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

/**
 * Keep the original event while locating the nearest HTML owner of an SVG hit.
 * DOM ancestry and the live path must agree, so a supplied path cannot borrow
 * another control.
 */
export function getMediaClickTarget(event: MouseEvent): HTMLElement | null {
  const original = event.target;
  if (original instanceof HTMLElement) return original;
  if (!(original instanceof SVGElement) || !original.isConnected) return null;

  let ancestor: Element | null = original.parentElement;
  while (ancestor instanceof SVGElement) ancestor = ancestor.parentElement;
  if (!(ancestor instanceof HTMLElement) || !ancestor.isConnected) return null;

  try {
    // During dispatch, reject a path that does not agree with the DOM owner.
    // Browser composedPath() becomes empty after dispatch; early replay then
    // revalidates the still-connected DOM ancestor instead.
    const path = event.composedPath();
    if (path.length && (path[0] !== original || !path.includes(ancestor))) return null;
  } catch {
    // A path that cannot be inspected cannot establish a safe HTML owner.
    return null;
  }
  return ancestor;
}
