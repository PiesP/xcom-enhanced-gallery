/**
 * @fileoverview Guard: Injected CSS must not use `transition: all`
 * Rationale: limit to explicit properties for performance and predictability.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readAnimationsCSS(): string {
  const filePath = resolve(__dirname, '../../../src/shared/styles/utilities/animations.css');
  return readFileSync(filePath, 'utf-8');
}

describe('Injected CSS — forbid transition: all', () => {
  setupGlobalTestIsolation();

  it('animation utilities should not include transition: all', () => {
    const css = readAnimationsCSS();

    const cssNoVars = css.replace(/var\([^)]*\)/g, '');
    expect(cssNoVars).not.toMatch(/transition\s*:\s*all\b/);
  });
});
