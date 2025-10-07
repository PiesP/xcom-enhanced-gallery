/**
 * render-with-vendor-solid
 * Solid.js 컴포넌트 테스트를 위한 렌더 헬퍼
 */
import { render as solidRender } from '@solidjs/testing-library';
import type { JSX } from 'solid-js';

export function renderWithVendorSolid(component: () => JSX.Element) {
  return solidRender(component);
}
