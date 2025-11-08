import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Twitter Color Mapping', () => {
  setupGlobalTestIsolation();

  it('should map primary color to Twitter blue via CSS variable', () => {
    // Read semantic tokens CSS file
    const semanticFile = join(
      process.cwd(),
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const content = readFileSync(semanticFile, 'utf-8');

    // Check that --color-primary maps to Twitter blue variable
    expect(content).toMatch(/--color-primary:\s*var\(--color-twitter-blue\)/);
  });

  it('should map primary-hover to Twitter blue hover', () => {
    const semanticFile = join(
      process.cwd(),
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const content = readFileSync(semanticFile, 'utf-8');

    expect(content).toMatch(/--color-primary-hover:\s*var\(--color-twitter-blue-hover\)/);
  });

  it('should map primary-active to Twitter blue active', () => {
    const semanticFile = join(
      process.cwd(),
      'src',
      'shared',
      'styles',
      'design-tokens.semantic.css'
    );
    const content = readFileSync(semanticFile, 'utf-8');

    expect(content).toMatch(/--color-primary-active:\s*var\(--color-twitter-blue-active\)/);
  });

  it('should resolve Twitter blue primitive tokens correctly', () => {
    // Read primitive tokens CSS file
    const primitiveFile = join(
      process.cwd(),
      'src',
      'shared',
      'styles',
      'design-tokens.primitive.css'
    );
    const content = readFileSync(primitiveFile, 'utf-8');

    // These should be defined as OKLCH values
    expect(content).toMatch(/--color-twitter-blue:\s*oklch\(/);
    expect(content).toMatch(/--color-twitter-blue-hover:\s*oklch\(/);
    expect(content).toMatch(/--color-twitter-blue-active:\s*oklch\(/);
  });

  it('should apply Twitter colors to Button primary variant', () => {
    // Check that Button CSS uses primary color tokens
    const buttonFile = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'Button',
      'Button.module.css'
    );
    const content = readFileSync(buttonFile, 'utf-8');

    // Should reference color-primary or related token
    expect(content).toMatch(/--color-primary|--xeg-color-primary/);
  });
});
