/**
 * @fileoverview Video item CLS hardening and skeleton token tests
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

// Read CSS content directly from file system (Node env in Vitest)
const cssPath = resolve(
  cwd(),
  'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
);
const verticalCss = readFileSync(cssPath, 'utf-8');

describe('VerticalImageItem.module.css — video CLS/skeleton token policy', () => {
  it('reserves aspect ratio or min-height to mitigate CLS', () => {
    // aspect-ratio present on wrapper
    expect(verticalCss).toMatch(/aspect-ratio\s*:/);
    // and has a token reference (with optional fallback), not raw number
    expect(verticalCss).toMatch(/var\(--xeg-aspect-default[^)]*\)/);
  });

  it('uses tokenized skeleton background for placeholder', () => {
    expect(verticalCss).toContain('.placeholder');
    expect(verticalCss).toContain('background: var(--xeg-skeleton-bg)');
  });

  it('video element styling uses tokens (radius/transition)', () => {
    expect(verticalCss).toContain('.video');
    expect(verticalCss).toContain('border-radius: var(--xeg-radius-md)');
    expect(verticalCss).toContain(
      'transition: opacity var(--xeg-duration-normal) var(--xeg-easing-ease-out)'
    );
  });
});
