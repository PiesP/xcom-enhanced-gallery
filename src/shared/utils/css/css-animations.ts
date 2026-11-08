// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/** Completion of the gallery's own finite CSS animations. */

const FADE_IN = 'xeg-fade-in';
const FADE_OUT = 'xeg-fade-out';
const activeAnimations = new WeakMap<Element, object>();

function runCssAnimation(element: Element, className: string): Promise<void> {
  if (!element.isConnected) {
    return Promise.resolve();
  }

  const token = {};
  activeAnimations.set(element, token);
  element.classList.remove(FADE_IN, FADE_OUT);
  element.classList.add(className);

  // getAnimations() defaults to this element only. Ignore descendant and
  // unrelated animations, including infinite progress indicators.
  const animation = element
    .getAnimations()
    .find(
      (candidate): candidate is CSSAnimation =>
        candidate instanceof CSSAnimation && candidate.animationName === className
    );

  const finished = animation
    ? animation.finished.then(
        () => undefined,
        () => undefined
      )
    : Promise.resolve();
  return finished.finally(() => {
    // A canceled earlier call must not remove the class owned by a newer call.
    if (activeAnimations.get(element) === token) {
      activeAnimations.delete(element);
      element.classList.remove(className);
    }
  });
}

export function animateGalleryEnter(element: Element): Promise<void> {
  return runCssAnimation(element, FADE_IN);
}

export function animateGalleryExit(element: Element): Promise<void> {
  return runCssAnimation(element, FADE_OUT);
}
