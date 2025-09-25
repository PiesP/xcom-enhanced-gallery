import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

describe('Design tokens neutral palette', () => {
  const designTokensPath = resolve(currentDir, '../../src/shared/styles/design-tokens.css');
  const designTokensCSS = readFileSync(designTokensPath, 'utf-8');

  it('defines legacy neutral color aliases for full midscale coverage', () => {
    const requiredNeutralAliases = [
      '--xeg-color-neutral-100:',
      '--xeg-color-neutral-200:',
      '--xeg-color-neutral-300:',
      '--xeg-color-neutral-400:',
      '--xeg-color-neutral-500:',
      '--xeg-color-neutral-600:',
      '--xeg-color-neutral-700:',
      '--xeg-color-neutral-800:',
      '--xeg-color-neutral-900:',
    ];

    const missingTokens = requiredNeutralAliases.filter(token => !designTokensCSS.includes(token));
    expect(
      missingTokens,
      `Missing neutral alias definitions: ${missingTokens.join(', ')}`
    ).toHaveLength(0);
  });

  it('exposes border primary and hover aliases pointing to semantic roles', () => {
    expect(designTokensCSS).toContain('--xeg-color-border-primary:');
    expect(designTokensCSS).toContain('--xeg-color-border-hover:');
  });
});
