import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOKENS_PATH = resolve(__dirname, '../../src/shared/styles/design-tokens.css');

function loadCss(): string {
  return readFileSync(TOKENS_PATH, 'utf-8');
}

describe('Phase 113: Focus ring alias monochrome enforcement', () => {
  const css = loadCss().split('\n');

  function findLineContains(fragment: string): string {
    const line = css.find(entry => entry.includes(fragment));
    if (!line) {
      throw new Error(`Line containing "${fragment}" not found in design-tokens.css`);
    }

    return line.trim();
  }

  it('--xeg-focus-ring alias should use neutral gray token', () => {
    const focusRingLine = findLineContains('--xeg-focus-ring:');

    expect(focusRingLine.includes('var(--xeg-color-neutral-500)')).toBe(true);
    expect(focusRingLine.includes('--xeg-color-primary')).toBe(false);
  });

  it('--xeg-focus-outline alias should be monochrome', () => {
    const outlineLine = findLineContains('--xeg-focus-outline:');

    expect(outlineLine.includes('var(--xeg-color-neutral-500)')).toBe(true);
    expect(outlineLine.includes('--xeg-color-primary')).toBe(false);
  });

  it('--xeg-focus-outline-color alias should no longer reference primary token', () => {
    const outlineColorLine = findLineContains('--xeg-focus-outline-color:');

    expect(outlineColorLine.includes('var(--xeg-color-neutral-500)')).toBe(true);
    expect(outlineColorLine.includes('--xeg-color-primary')).toBe(false);
  });

  it('focus alias block should not mention --xeg-color-primary', () => {
    const focusBlockStart = css.findIndex(line => line.includes('Focus 토큰'));
    expect(focusBlockStart).toBeGreaterThanOrEqual(0);

    const blockLines = css.slice(focusBlockStart, focusBlockStart + 10).join('\n');
    expect(blockLines.includes('--xeg-color-primary')).toBe(false);
  });
});
