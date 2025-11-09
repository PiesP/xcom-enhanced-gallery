/**
 * @fileoverview Guard: Injected CSS must respect reduced motion
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

describe('Injected CSS — reduced motion policy', () => {
  setupGlobalTestIsolation();

  it('animation utilities include reduced motion safeguards', () => {
    const css = readAnimationsCSS();

    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);

    const reducedBlock = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\}/);
    expect(reducedBlock).not.toBeNull();
    if (reducedBlock) {
      expect(reducedBlock[0]).toMatch(/transition:\s*none|animation:\s*none/);
    }
  });
});
