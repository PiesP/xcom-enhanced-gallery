/* eslint-env node */
/**
 * @file Toolbar hover trigger duplication guard
 * 목표: toolbarHoverTrigger 대체/중복 요소가 DOM/CSS에 재도입되지 않도록 가드
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Toolbar hover trigger duplication guard', () => {
  it('VerticalGalleryView.module.css에 toolbarHoverTrigger 선택자가 없어야 한다', () => {
    const cssPath = join(
      globalThis.process?.cwd?.() ?? '',
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
    );
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).not.toMatch(/\.toolbarHoverTrigger/);
  });

  it('VerticalGalleryView.tsx에 toolbarHoverTrigger 관련 코드가 없어야 한다', () => {
    const tsxPath = join(
      globalThis.process?.cwd?.() ?? '',
      'src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.tsx'
    );
    const tsx = readFileSync(tsxPath, 'utf-8');
    expect(tsx).not.toContain('toolbarHoverTrigger');
  });
});
