// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

// A transformed 44px DOMRect can differ by a few floating-point units.
const TOUCH_TARGET_SIZE_CSS_PX = 44;
const DOM_RECT_PRECISION_CSS_PX = 0.001;

export function has44CssPxTouchTarget(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width >= TOUCH_TARGET_SIZE_CSS_PX - DOM_RECT_PRECISION_CSS_PX &&
    height >= TOUCH_TARGET_SIZE_CSS_PX - DOM_RECT_PRECISION_CSS_PX
  );
}

export function isOperable44CssPxControl(geometry: {
  rect: { width: number; height: number };
  hit: boolean;
  withinViewport: boolean;
}): boolean {
  return (
    has44CssPxTouchTarget(geometry.rect.width, geometry.rect.height) &&
    geometry.hit &&
    geometry.withinViewport
  );
}
