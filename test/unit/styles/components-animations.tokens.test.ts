/**
 * @fileoverview Components animations tokenization policy
 * - Ensure .xeg-animate-* classes use var(--xeg-duration-*) and var(--xeg-easing-*) (or --xeg-ease-*)
 * - Forbid hardcoded duration numbers (e.g., 1s, 200ms) in animation declarations
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Components Animations Token Policy', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  function readCSS(rel: string): string {
    const projectRoot = resolve(__dirname, '..', '..', '..');
    const filePath = resolve(projectRoot, 'src', ...rel.split('/'));
    return readFileSync(filePath, 'utf-8');
  }

  it('animation utility classes should be tokenized and not hardcode durations', () => {
    const css = readCSS('assets/styles/utilities/animations.css');

    // Extract animation classes like .xeg-fade-in, .xeg-slide-up, etc.
    const animateBlocks = (css.match(/\.xeg-[a-z-]+\s*{[^}]*animation:[^}]+}/g) || []).join('\n');

    // No raw durations like 1s, 250ms inside animation declarations
    const hardcodedInAnimations = animateBlocks.match(/animation:[^;]*(\d+(?:\.\d+)?m?s)/g) || [];
    expect(hardcodedInAnimations.length).toBe(0);

    // Should use duration tokens
    expect(animateBlocks).toMatch(/var\(--xeg-duration-(?:fast|normal|slow)\)/);

    // Should use easing tokens (either consumer alias --xeg-ease-* or base --xeg-easing-*)
    const hasEasing = /var\(--xeg-ease-[^)]+\)|var\(--xeg-easing-[^)]+\)/.test(animateBlocks);
    expect(hasEasing).toBe(true);
  });

  it('interaction hover/transition utilities should use tokenized transitions', () => {
    const css = readCSS('assets/styles/utilities/animations.css');

    // Check .xeg-transition* classes (e.g., .xeg-transition-hover)
    const transitionBlocks = (css.match(/\.xeg-transition[^{]*{[^}]+}/g) || []).join('\n');

    // Either use var(--xeg-transition-*) or explicit duration+ease tokens
    const usesTransitionTokens =
      /var\(--xeg-transition-[^)]+\)/.test(transitionBlocks) ||
      (/var\(--xeg-duration-(?:fast|normal|slow)\)/.test(transitionBlocks) &&
        /var\(--xeg-ease-[^)]+\)|var\(--xeg-easing-[^)]+\)/.test(transitionBlocks));

    expect(usesTransitionTokens).toBe(true);

    // Forbid hardcoded duration numbers in transition declarations
    const hardcodedInTransitions =
      transitionBlocks.match(/transition:[^;]*(\d+(?:\.\d+)?m?s)/g) || [];
    expect(hardcodedInTransitions.length).toBe(0);
  });
});
