import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CSS_PATH = resolve(
  __dirname,
  '../../../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView.module.css'
);

function extractMediaBlocks(css: string, query: string): string[] {
  const blocks: string[] = [];
  let index = css.indexOf(query);
  while (index !== -1) {
    let braceCount = 0;
    let block = '';
    let started = false;
    let endIndex = index;
    for (let i = index; i < css.length; i++) {
      const char = css[i];
      block += char;
      if (char === '{') {
        braceCount += 1;
        started = true;
      } else if (char === '}') {
        braceCount -= 1;
        if (started && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
    blocks.push(block);
    index = css.indexOf(query, endIndex);
  }
  return blocks;
}

describe('VerticalGalleryView high-contrast styling', () => {
  const css = readFileSync(CSS_PATH, 'utf-8');
  const highContrastBlocks = extractMediaBlocks(css, '@media (prefers-contrast: high)');

  it('defines dedicated high-contrast blocks for the toolbar', () => {
    expect(highContrastBlocks.length).toBeGreaterThanOrEqual(2);
  });

  it('uses overlay tokens for toolbar surface and hover zone in high contrast mode', () => {
    const tokenizedBlock = highContrastBlocks.find(block =>
      block.includes('var(--xeg-color-overlay-dark)')
    );
    expect(tokenizedBlock, 'High-contrast overlay block should exist').toBeDefined();
    expect(tokenizedBlock).toContain('background: var(--xeg-color-overlay-dark)');
    expect(tokenizedBlock).toContain('background: var(--xeg-color-overlay-subtle)');
    expect(tokenizedBlock).toContain('border: 2px solid white');
  });

  it('retains Canvas fallback gradient for early high-contrast support block', () => {
    const gradientBlock = highContrastBlocks.find(block => block.includes('Canvas 0%'));
    expect(gradientBlock, 'Canvas-based high-contrast gradient block should exist').toBeDefined();
  });
});
