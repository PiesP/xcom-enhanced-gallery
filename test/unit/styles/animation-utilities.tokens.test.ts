/**
 * @fileoverview Animation utilities tokenization policy
 * - Ensure utilities use var(--xeg-duration-*) and var(--xeg-ease-*)
 * - Forbid hardcoded duration numbers in animations/transitions
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Animation Utilities Token Policy', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  function readCSS(rel: string): string {
    const projectRoot = resolve(__dirname, '..', '..', '..');
    const filePath = resolve(projectRoot, 'src', ...rel.split('/'));
    return readFileSync(filePath, 'utf-8');
  }

  it('animation-utilities.css should not hardcode durations', () => {
    const css = readCSS('assets/styles/animation-utilities.css');
    // no patterns like: 0.2s or 200ms directly in animation/transition lines
    const hardcoded = css.match(/(animation|transition):[^;]*(\d+(?:\.\d+)?m?s)/g) || [];
    expect(hardcoded.length).toBe(0);
    // should use ease standard var
    expect(css).toContain('var(--xeg-ease-standard)');
    // should use duration tokens
    expect(css).toMatch(/var\(--xeg-duration-(?:fast|normal|slow)\)/);
  });

  it('design-tokens.semantic.css utility animations should be tokenized', () => {
    const css = readCSS('shared/styles/design-tokens.semantic.css');
    const utilityBlocks = (css.match(/\.xeg-anim-[^{]+{[^}]+}/g) || []).join('\n');
    expect(utilityBlocks).not.toMatch(/\s(\d+(?:\.\d+)?m?s)\s/);
    expect(utilityBlocks).toContain('var(--xeg-ease-standard)');
    expect(utilityBlocks).toMatch(/var\(--xeg-duration-(?:fast|normal|slow)\)/);
  });
});
